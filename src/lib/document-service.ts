import { supabase } from './supabase';
import { getUser } from './auth';

// The bucket name where project documents are stored
const DOCUMENTS_BUCKET = 'project_documents';

// Document types and their accepted MIME types
export const ACCEPTED_DOCUMENT_TYPES = {
  'pdf': ['application/pdf'],
  'word': ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  'excel': ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  'powerpoint': ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  'video': ['video/mp4', 'video/webm', 'video/quicktime'],
  'text': ['text/plain'],
  'link': ['text/uri-list', 'text/url'],
};

export interface ProjectDocument {
  id?: string;
  project_id: string;
  file_name: string;
  file_path?: string;
  file_url?: string;
  file_type: string;
  file_size?: number;
  is_link: boolean;
  is_video: boolean;
  description?: string;
  uploaded_by?: string;
  uploaded_by_name?: string;
  avatar_url?: string;
  uploaded_by_user?: {
    id: string;
    email?: string;
    display_name?: string;
    avatar_url?: string;
  };
  created_at?: string;
  updated_at?: string;
}

/**
 * Generates a unique file name for a document upload
 * @param projectId The ID of the project
 * @param fileName The original file name
 */
export function generateDocumentFileName(projectId: string, fileName: string): string {
  const timestamp = Date.now();
  const fileExt = fileName.split('.').pop() || '';
  const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
  const sanitizedName = baseName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return `${projectId}/${sanitizedName}_${timestamp}.${fileExt}`;
}

/**
 * Determines if a URL is a video link (YouTube, Vimeo, etc.)
 * @param url The URL to check
 */
export function isVideoUrl(url: string): boolean {
  const videoPatterns = [
    /youtube\.com\/watch/i,
    /youtu\.be\//i,
    /vimeo\.com\//i,
    /wistia\.com\//i,
    /loom\.com\//i,
    /zoom\.us\/rec\//i,
    /teams\.microsoft\.com\/l\/meetup-join\//i,
    /drive\.google\.com.*videoplayback/i,
    /\.(mp4|webm|mov|avi)$/i
  ];
  
  return videoPatterns.some(pattern => pattern.test(url));
}

/**
 * Get the embedded version of a video URL
 * @param url The video URL to convert to embedded format
 */
export function getEmbeddedVideoUrl(url: string): string {
  // YouTube
  if (url.includes('youtube.com/watch')) {
    const videoId = new URL(url).searchParams.get('v');
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  }
  
  // YouTube short URL
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  }
  
  // Vimeo
  if (url.includes('vimeo.com/')) {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
    if (videoId) return `https://player.vimeo.com/video/${videoId}`;
  }
  
  // Loom
  if (url.includes('loom.com/share/')) {
    const videoId = url.split('loom.com/share/')[1]?.split('?')[0];
    if (videoId) return `https://www.loom.com/embed/${videoId}`;
  }
  
  // For other platforms or direct video links, return the original URL
  return url;
}

/**
 * Upload a document for a project
 * @param projectId The ID of the project
 * @param file The document file to upload
 * @param description Optional description for the document
 */
export async function uploadProjectDocument(
  projectId: string,
  file: File,
  description?: string
): Promise<ProjectDocument> {
  try {
    // Validate file size (20MB limit)
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('Document must be less than 20MB');
    }

    // Get the current user
    const currentUser = await getUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Determine file type category
    let fileType = 'other';
    for (const [type, mimeTypes] of Object.entries(ACCEPTED_DOCUMENT_TYPES)) {
      if (mimeTypes.includes(file.type)) {
        fileType = type;
        break;
      }
    }

    // Generate a file path
    const filePath = generateDocumentFileName(projectId, file.name);

    // Check if bucket exists and create it if it doesn't
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === DOCUMENTS_BUCKET)) {
      const { error: bucketError } = await supabase.storage.createBucket(DOCUMENTS_BUCKET, {
        public: true,
      });
      if (bucketError) throw bucketError;
    }

    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(DOCUMENTS_BUCKET)
      .getPublicUrl(filePath);

    // Create a record in the project_documents table
    const documentData: ProjectDocument = {
      project_id: projectId,
      file_name: file.name,
      file_path: filePath,
      file_url: urlData.publicUrl,
      file_type: fileType,
      file_size: file.size,
      is_link: false,
      is_video: file.type.startsWith('video/'),
      description: description || '',
      uploaded_by: currentUser.id
    };
    
    // We'll handle the uploaded_by_name in the UI by fetching user details separately

    const { data, error } = await supabase
      .from('project_documents')
      .insert([documentData])
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
}

/**
 * Add a link as a project document
 * @param projectId The ID of the project
 * @param url The URL to add
 * @param name A name for the link
 * @param description Optional description for the link
 */
export async function addProjectLink(
  projectId: string,
  url: string,
  name: string,
  description?: string
): Promise<ProjectDocument> {
  try {
    // Validate URL format
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL format');
    }

    // Get the current user
    const currentUser = await getUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Check if it's a video link
    const isVideo = isVideoUrl(url);

    // Create a record in the project_documents table
    const documentData: ProjectDocument = {
      project_id: projectId,
      file_name: name,
      file_url: url,
      file_type: isVideo ? 'video' : 'link',
      is_link: true,
      is_video: isVideo,
      description: description || '',
      uploaded_by: currentUser.id
    };

    const { data, error } = await supabase
      .from('project_documents')
      .insert([documentData])
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error adding project link:', error);
    throw error;
  }
}

/**
 * Fetch all documents for a project
 * @param projectId The ID of the project
 */
export async function getProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
  try {
    // Based on the error, we know the join won't work, so use a simpler query
    const { data, error } = await supabase
      .from('project_documents')
      .select('*')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Try to get user information separately for each document
    if (data && data.length > 0) {
      // Collect unique user IDs
      const userIds = Array.from(new Set(
        data.filter(doc => doc.uploaded_by).map(doc => doc.uploaded_by)
      ));
      
      if (userIds.length > 0) {
        try {
          // Get user info in a separate query
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, email, display_name, avatar_url')
            .in('id', userIds);
            
          if (!userError && userData) {
            // Create a map for quick lookups
            const userMap = userData.reduce((map, user) => {
              map[user.id] = user;
              return map;
            }, {});
            
            // Attach user info to documents
            return data.map(doc => ({
              ...doc,
              uploaded_by_name: doc.uploaded_by ? 
                (userMap[doc.uploaded_by]?.display_name || 
                 userMap[doc.uploaded_by]?.email || 
                 'Unknown User') : 'Unknown User',
              avatar_url: doc.uploaded_by ? userMap[doc.uploaded_by]?.avatar_url : undefined
            }));
          }
        } catch (userFetchError) {
          console.warn('Could not fetch user information:', userFetchError);
          // Continue with documents without user info
        }
      }
    }
    
    // Return data without user information if we couldn't get it
    return data || [];

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching project documents:', error);
    throw error;
  }
}

/**
 * Get a document by ID
 * @param documentId The ID of the document to retrieve
 */
export async function getDocumentById(documentId: string): Promise<ProjectDocument> {
  try {
    // Simplified query without the join that's causing issues
    const { data, error } = await supabase
      .from('project_documents')
      .select('*')
      .eq('id', documentId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
}

/**
 * Delete a document
 * @param documentId The ID of the document to delete
 */
export async function deleteDocument(documentId: string): Promise<void> {
  try {
    // Get the document first to check if it's a file that needs to be removed from storage
    const { data: document, error: fetchError } = await supabase
      .from('project_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError) throw fetchError;

    // If it's a file stored in our bucket, delete it from storage
    if (document && !document.is_link && document.file_path) {
      // Try to determine the bucket from the file path or URL
      let bucket = DOCUMENTS_BUCKET;
      
      // Check if the file URL indicates it's stored in public-docs
      if (document.file_url && document.file_url.includes('public-docs')) {
        bucket = 'public-docs';
      }
      
      // First try the determined bucket
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([document.file_path]);

      if (storageError) {
        console.warn(`Error deleting file from ${bucket}:`, storageError);
        
        // Try fallback bucket if first one failed
        const fallbackBucket = bucket === DOCUMENTS_BUCKET ? 'public-docs' : DOCUMENTS_BUCKET;
        console.log(`Trying fallback bucket: ${fallbackBucket}`);
        
        try {
          const { error: fallbackError } = await supabase.storage
            .from(fallbackBucket)
            .remove([document.file_path]);
            
          if (fallbackError) {
            console.warn(`Error deleting file from fallback bucket ${fallbackBucket}:`, fallbackError);
          } else {
            console.log(`Successfully deleted file from fallback bucket ${fallbackBucket}`);
          }
        } catch (fallbackErr) {
          console.error('Error with fallback deletion:', fallbackErr);
        }
        // Continue with database deletion even if storage deletion fails
      } else {
        console.log(`Successfully deleted file from ${bucket}`);
      }
    }

    // Soft delete the document record
    const { error } = await supabase
      .from('project_documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', documentId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

/**
 * Update a document's metadata
 * @param documentId The ID of the document to update
 * @param updates The updates to apply to the document
 */
export async function updateDocument(
  documentId: string, 
  updates: { description?: string, file_name?: string }
): Promise<ProjectDocument> {
  try {
    const { data, error } = await supabase
      .from('project_documents')
      .update(updates)
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
}
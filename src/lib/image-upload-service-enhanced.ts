import { supabase } from './supabase';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Convert File to base64 for upload
 */
async function fileToBlob(file: File): Promise<Blob> {
  return file;
}

/**
 * Upload image to Supabase storage
 */
export async function uploadImageToSupabase(
  file: File,
  candidateId: string,
  folder: 'profile-pictures' | 'documents'
): Promise<ImageUploadResult> {
  try {
    const blob = await fileToBlob(file);

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${candidateId}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('candidate-files')
      .upload(filePath, blob, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('candidate-files')
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error('Error in uploadImageToSupabase:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete image from Supabase storage
 */
export async function deleteImageFromSupabase(url: string): Promise<boolean> {
  try {
    // Extract file path from URL
    const urlParts = url.split('/candidate-files/');
    if (urlParts.length < 2) {
      return false;
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from('candidate-files')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteImageFromSupabase:', error);
    return false;
  }
}

/**
 * Update candidate profile picture in database
 */
export async function updateProfilePicture(
  candidateId: string,
  photoUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('candidates')
      .update({ profile_photo: photoUrl, updated_at: new Date().toISOString() })
      .eq('id', candidateId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Log activity to profile_activity_log
 */
async function logActivity(
  candidateId: string,
  actionType: string,
  fieldChanged?: string,
  oldValue?: any,
  newValue?: any
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('profile_activity_log').insert({
      candidate_id: candidateId,
      action_type: actionType,
      field_changed: fieldChanged,
      old_value: oldValue ? JSON.stringify(oldValue) : null,
      new_value: newValue ? JSON.stringify(newValue) : null,
      changed_by: user?.id,
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't fail the operation if logging fails
  }
}

/**
 * Update full body photos array
 */
export async function updateFullBodyPhotos(
  candidateId: string,
  photoUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current photos
    const { data: candidate, error: fetchError } = await supabase
      .from('candidates')
      .select('full_body_photos')
      .eq('id', candidateId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    const currentPhotos = candidate?.full_body_photos || [];
    const newPhotos = [...currentPhotos, photoUrl];

    // Update database
    const { error } = await supabase
      .from('candidates')
      .update({
        full_body_photos: newPhotos,
        updated_at: new Date().toISOString()
      })
      .eq('id', candidateId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Log activity
    await logActivity(candidateId, 'photo_upload', 'full_body_photos', currentPhotos, newPhotos);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update half body photos array
 */
export async function updateHalfBodyPhotos(
  candidateId: string,
  photoUrl: string,
  index: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current photos
    const { data: candidate, error: fetchError } = await supabase
      .from('candidates')
      .select('half_body_photos')
      .eq('id', candidateId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    const currentPhotos = candidate?.half_body_photos || [];
    const newPhotos = [...currentPhotos];

    // Ensure array has enough slots
    while (newPhotos.length <= index) {
      newPhotos.push(null);
    }

    newPhotos[index] = photoUrl;

    // Update database
    const { error } = await supabase
      .from('candidates')
      .update({
        half_body_photos: newPhotos,
        updated_at: new Date().toISOString()
      })
      .eq('id', candidateId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Log activity
    await logActivity(candidateId, 'photo_upload', 'half_body_photos', currentPhotos, newPhotos);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete photo from full body photos array
 */
export async function deleteFullBodyPhoto(
  candidateId: string,
  photoUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current photos
    const { data: candidate, error: fetchError } = await supabase
      .from('candidates')
      .select('full_body_photos')
      .eq('id', candidateId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    const currentPhotos = candidate?.full_body_photos || [];
    const newPhotos = currentPhotos.filter((url: string) => url !== photoUrl);

    // Delete from storage
    await deleteImageFromSupabase(photoUrl);

    // Update database
    const { error } = await supabase
      .from('candidates')
      .update({
        full_body_photos: newPhotos,
        updated_at: new Date().toISOString()
      })
      .eq('id', candidateId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Log activity
    await logActivity(candidateId, 'photo_delete', 'full_body_photos', currentPhotos, newPhotos);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete photo from half body photos array
 */
export async function deleteHalfBodyPhoto(
  candidateId: string,
  index: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current photos
    const { data: candidate, error: fetchError } = await supabase
      .from('candidates')
      .select('half_body_photos')
      .eq('id', candidateId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    const currentPhotos = candidate?.half_body_photos || [];
    const photoUrl = currentPhotos[index];

    if (photoUrl) {
      // Delete from storage
      await deleteImageFromSupabase(photoUrl);
    }

    const newPhotos = [...currentPhotos];
    newPhotos[index] = null;

    // Update database
    const { error } = await supabase
      .from('candidates')
      .update({
        half_body_photos: newPhotos,
        updated_at: new Date().toISOString()
      })
      .eq('id', candidateId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Log activity
    await logActivity(candidateId, 'photo_delete', 'half_body_photos', currentPhotos, newPhotos);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Complete flow: Select and upload profile picture
 */
export async function selectAndUploadProfilePicture(
  candidateId: string,
  file: File
): Promise<ImageUploadResult> {
  try {
    // Upload to storage
    const uploadResult = await uploadImageToSupabase(
      file,
      candidateId,
      'profile-pictures'
    );

    if (!uploadResult.success || !uploadResult.url) {
      return uploadResult;
    }

    // Update database
    const dbResult = await updateProfilePicture(candidateId, uploadResult.url);

    if (!dbResult.success) {
      // If database update fails, try to delete the uploaded file
      await deleteImageFromSupabase(uploadResult.url);
      return { success: false, error: dbResult.error };
    }

    // Log activity
    await logActivity(candidateId, 'photo_upload', 'profile_photo', null, uploadResult.url);

    return { success: true, url: uploadResult.url };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Handle document upload with automatic detection
 */
export async function uploadDocument(
  candidateId: string,
  file: File,
  documentType: 'full-body' | 'half-body',
  index?: number
): Promise<ImageUploadResult> {
  try {
    // Upload to storage
    const uploadResult = await uploadImageToSupabase(
      file,
      candidateId,
      'documents'
    );

    if (!uploadResult.success || !uploadResult.url) {
      return uploadResult;
    }

    // Update database based on document type
    let dbResult;
    if (documentType === 'full-body') {
      dbResult = await updateFullBodyPhotos(candidateId, uploadResult.url);
    } else if (documentType === 'half-body' && index !== undefined) {
      dbResult = await updateHalfBodyPhotos(candidateId, uploadResult.url, index);
    } else {
      return { success: false, error: 'Invalid document type or missing index' };
    }

    if (!dbResult.success) {
      // If database update fails, try to delete the uploaded file
      await deleteImageFromSupabase(uploadResult.url);
      return { success: false, error: dbResult.error };
    }

    return { success: true, url: uploadResult.url };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

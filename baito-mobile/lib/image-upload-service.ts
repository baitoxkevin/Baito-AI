import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Request camera and media library permissions
 */
export async function requestImagePermissions(): Promise<boolean> {
  try {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    return cameraPermission.status === 'granted' && mediaLibraryPermission.status === 'granted';
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
}

/**
 * Pick image from camera
 */
export async function pickImageFromCamera(): Promise<ImagePicker.ImagePickerAsset | null> {
  try {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) {
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }

    return null;
  } catch (error) {
    console.error('Error picking image from camera:', error);
    return null;
  }
}

/**
 * Pick image from gallery
 */
export async function pickImageFromGallery(): Promise<ImagePicker.ImagePickerAsset | null> {
  try {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) {
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }

    return null;
  } catch (error) {
    console.error('Error picking image from gallery:', error);
    return null;
  }
}

/**
 * Pick document/image for documents (no aspect ratio restriction)
 */
export async function pickDocument(): Promise<ImagePicker.ImagePickerAsset | null> {
  try {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) {
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false, // No editing for documents
      quality: 0.9, // Higher quality for documents
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }

    return null;
  } catch (error) {
    console.error('Error picking document:', error);
    return null;
  }
}

/**
 * Convert image URI to Blob for upload
 */
async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
}

/**
 * Upload image to Supabase storage
 */
export async function uploadImageToSupabase(
  imageAsset: ImagePicker.ImagePickerAsset,
  candidateId: string,
  folder: 'profile-pictures' | 'documents'
): Promise<ImageUploadResult> {
  try {
    const blob = await uriToBlob(imageAsset.uri);

    // Generate unique filename
    const fileExt = imageAsset.uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${candidateId}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('candidate-files')
      .upload(filePath, blob, {
        contentType: imageAsset.mimeType || 'image/jpeg',
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
 * Complete flow: Pick and upload profile picture
 */
export async function selectAndUploadProfilePicture(
  candidateId: string,
  source: 'camera' | 'gallery'
): Promise<ImageUploadResult> {
  try {
    // Pick image
    const imageAsset = source === 'camera'
      ? await pickImageFromCamera()
      : await pickImageFromGallery();

    if (!imageAsset) {
      return { success: false, error: 'Image selection cancelled or failed' };
    }

    // Upload to storage
    const uploadResult = await uploadImageToSupabase(
      imageAsset,
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

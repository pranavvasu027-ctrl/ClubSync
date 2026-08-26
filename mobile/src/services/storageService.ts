import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';

/**
 * Open the device image gallery, let the user pick an image, 
 * and upload it directly to Supabase Storage.
 * 
 * @param bucketName The name of the storage bucket (e.g., 'avatars')
 * @param folderPath Optional folder path inside the bucket
 * @returns The public URL of the uploaded image, or null if failed/cancelled.
 */
export async function pickAndUploadImage(
  bucketName: string,
  folderPath: string = ''
): Promise<string | null> {
  try {
    // 1. Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      console.warn("Permission to access gallery was denied");
      return null;
    }

    // 2. Launch Image Picker
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7, // Compress image to 70% quality to save bandwidth
      base64: true, // Request base64 so we can upload it easily
    });

    if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
      return null;
    }

    const asset = pickerResult.assets[0];
    
    // Fallback if base64 is missing for some reason
    let base64 = asset.base64;
    if (!base64 && asset.uri) {
      base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }

    if (!base64) {
      throw new Error('Failed to read image data');
    }

    // 3. Prepare for Supabase Upload
    const ext = asset.uri.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
    const arrayBuffer = decode(base64);

    // 4. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, arrayBuffer, {
        contentType: asset.mimeType || `image/${ext}`,
        upsert: true,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    // 5. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error in pickAndUploadImage:', error);
    return null;
  }
}

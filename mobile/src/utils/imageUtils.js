import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Compress any image before uploading to Supabase Storage.
 * Per PRD MOD 4: max 800px width, 80% JPEG quality.
 * Reduces typical 4MB phone photo to under 200KB.
 *
 * @param {string} uri - Local image URI from camera or image picker
 * @returns {Promise<{uri: string, base64?: string}>} - Compressed image info
 */
export async function compressImage(uri) {
    const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }], // limit to 800px wide (height auto-scales)
        {
            compress: 0.8,              // 80% JPEG quality
            format: ImageManipulator.SaveFormat.JPEG,
        }
    );
    return result;
}

/**
 * Open image picker, pick a single image, and compress it.
 * @returns {Promise<{uri: string}|null>}
 */
export async function pickAndCompressImage() {
    const { launchImageLibraryAsync, MediaTypeOptions, requestMediaLibraryPermissionsAsync } =
        require('expo-image-picker');

    const { status } = await requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
        throw new Error('Photo library permission is required to upload images.');
    }

    const result = await launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1, // raw — we compress ourselves
    });

    if (result.canceled) return null;

    const compressed = await compressImage(result.assets[0].uri);
    return compressed;
}

/**
 * Upload a compressed image to Supabase Storage.
 * @param {object} supabase - Supabase client instance
 * @param {string} uri - Local file URI
 * @param {string} bucket - 'product-images' | 'payment-screenshots'
 * @param {string} path - File path inside bucket e.g. 'seller-id/product-1.jpg'
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
export async function uploadImage(supabase, uri, bucket, path) {
    // Validate MIME type — JPEG/PNG only
    const ext = uri.split('.').pop().toLowerCase();
    if (!['jpg', 'jpeg', 'png'].includes(ext)) {
        throw new Error('Only JPEG or PNG images are allowed.');
    }

    // Fetch file as blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // 5MB max guard
    if (blob.size > 5 * 1024 * 1024) {
        throw new Error('File too large. Maximum size is 5MB.');
    }

    const { error } = await supabase.storage
        .from(bucket)
        .upload(path, blob, {
            contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
            upsert: true,
        });

    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
}

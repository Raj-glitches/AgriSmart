import { v2 as cloudinary } from 'cloudinary';

/**
 * Cloudinary Configuration
 * Cloud-based image and video management service
 * 
 * Why Cloudinary?
 * - Handles image uploads, storage, optimization, and delivery
 * - Automatic image resizing and format conversion
 * - CDN delivery for fast loading worldwide
 * - Reduces server load and storage costs
 * 
 * Integration with MERN:
 * - Backend uploads images to Cloudinary
 * - Returns secure URL stored in MongoDB
 * - Frontend displays images directly from Cloudinary CDN
 */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary
 * @param {string} filePath - Local file path or base64 string
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<object>} - Upload result with secure_url
 */
export const uploadImage = async (filePath, folder = 'agriSmart') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      // Optimization options
      quality: 'auto:good',
      fetch_format: 'auto',
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Image upload failed');
  }
};

/**
 * Upload multiple images
 */
export const uploadMultipleImages = async (files, folder = 'agriSmart') => {
  const uploadPromises = files.map((file) => uploadImage(file, folder));
  return await Promise.all(uploadPromises);
};

/**
 * Delete image from Cloudinary
 */
export const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Image deletion failed');
  }
};

/**
 * Get optimized image URL
 */
export const getOptimizedUrl = (url, options = {}) => {
  const { width = 800, height = null, crop = 'fill' } = options;
  
  // Cloudinary supports on-the-fly transformations via URL parameters
  // This is a simplified version - in production, use SDK methods
  return url.replace('/upload/', `/upload/w_${width}${height ? `,h_${height}` : ''},c_${crop}/`);
};

export default cloudinary;


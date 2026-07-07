// backend/config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Uploads a local file to Cloudinary and deletes the local file afterwards.
 * @param {string} localFilePath Path to the local file
 * @param {string} folder Cloudinary folder name (e.g., 'inkdrop/posts', 'inkdrop/avatars')
 * @returns {Promise<string>} The secure URL of the uploaded image
 */
const uploadToCloudinary = async (localFilePath, folder) => {
  try {
    if (!localFilePath) return '';
    
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary is not properly configured. Missing environment variables in .env.');
    }

    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: folder,
      resource_type: 'auto'
    });

    // Delete local file after successful upload
    if (fs.existsSync(localFilePath)) {
      try { fs.unlinkSync(localFilePath); } catch (_) {}
    }

    return result.secure_url;
  } catch (error) {
    // Make sure we delete local file even if upload fails
    if (localFilePath && fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (err) {
        console.error('Error deleting local file after upload failure:', err);
      }
    }
    throw error;
  }
};

/**
 * Deletes an image from Cloudinary using its secure URL.
 * @param {string} secureUrl The Cloudinary secure URL of the image
 * @returns {Promise<any>} Cloudinary deletion result
 */
const deleteFromCloudinary = async (secureUrl) => {
  try {
    if (!secureUrl || !secureUrl.includes('cloudinary.com')) return null;

    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567/folder/subfolder/public_id.jpg
    const parts = secureUrl.split('/upload/');
    if (parts.length < 2) return null;

    // Get the path after '/upload/', e.g., 'v1234567/folder/subfolder/filename.jpg'
    const pathAfterUpload = parts[1];
    
    // Remove the version segment (v followed by digits) if present
    const pathWithoutVersion = pathAfterUpload.replace(/^v\d+\//, '');
    
    // Remove the file extension (e.g. .jpg, .png, etc.)
    const lastDotIndex = pathWithoutVersion.lastIndexOf('.');
    const publicId = lastDotIndex !== -1 ? pathWithoutVersion.substring(0, lastDotIndex) : pathWithoutVersion;

    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Failed to delete image from Cloudinary:', error);
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary
};

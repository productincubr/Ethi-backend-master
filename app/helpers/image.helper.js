/**
 * Image Processing Helper
 * 
 * PURPOSE: Handle image upload, resize, compress, and delete operations
 * 
 * FEATURES:
 * - Resize images to standard sizes (passport, profile, thumbnail)
 * - Compress images to reduce file size
 * - Delete old images when new ones are uploaded
 * - Support multiple image types (JPG, PNG, WEBP)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Standard image sizes
const IMAGE_SIZES = {
  passport: { width: 200, height: 200 },      // Square passport size
  profile: { width: 400, height: 400 },       // Profile picture
  thumbnail: { width: 150, height: 150 },     // Small thumbnail
  banner: { width: 1200, height: 400 },       // Banner/cover image
};

/**
 * Generate unique filename with MD5 hash
 * @param {String} suffix - File suffix (e.g., '_admin', '_doctor')
 * @param {String} extension - File extension (e.g., '.jpg', '.png')
 * @returns {String} Unique filename
 */
const generateUniqueFilename = (suffix = '', extension = '.jpg') => {
  const timestamp = new Date().getTime().toString();
  const md5Hash = crypto.createHash('md5').update(timestamp).digest('hex');
  return `${md5Hash}${suffix}${extension}`;
};

/**
 * Process and save uploaded image with resizing and compression
 * @param {Object} imageFile - Express fileUpload file object
 * @param {String} folderPath - Destination folder path (e.g., '/ethi_doctor_image/')
 * @param {String} suffix - Filename suffix (e.g., '_admin', '_doctor')
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Result with filename and success status
 */
const processAndSaveImage = async (imageFile, folderPath, suffix = '', options = {}) => {
  try {
    const {
      size = 'passport',           // passport, profile, thumbnail, banner
      quality = 85,                 // JPEG quality (1-100)
      format = 'jpeg',              // jpeg, png, webp
      oldImageName = null,          // Delete old image if provided
    } = options;

    // Validate image file
    if (!imageFile || !imageFile.data) {
      throw new Error('Invalid image file');
    }

    // Get image dimensions
    const dimensions = IMAGE_SIZES[size] || IMAGE_SIZES.passport;

    // Generate unique filename
    const extension = format === 'jpeg' ? '.jpg' : `.${format}`;
    const newFileName = generateUniqueFilename(suffix, extension);

    // Construct full file path
    const baseDir = path.join(__dirname, '../../app/assets');
    const fullFolderPath = path.join(baseDir, folderPath.replace(/^\/|\/$/g, ''));
    const fullFilePath = path.join(fullFolderPath, newFileName);

    // Ensure folder exists
    if (!fs.existsSync(fullFolderPath)) {
      fs.mkdirSync(fullFolderPath, { recursive: true });
      console.log(`✅ Created folder: ${fullFolderPath}`);
    }

    // Process image: resize + compress
    await sharp(imageFile.data)
      .resize(dimensions.width, dimensions.height, {
        fit: 'cover',              // Crop to exact dimensions
        position: 'center',        // Center crop
      })
      .toFormat(format, {
        quality: quality,          // Compression quality
        mozjpeg: true,            // Use mozjpeg for better compression
      })
      .toFile(fullFilePath);

    console.log(`✅ Image processed and saved: ${newFileName}`);
    console.log(`   - Size: ${dimensions.width}x${dimensions.height}`);
    console.log(`   - Quality: ${quality}%`);
    console.log(`   - Format: ${format}`);

    // Delete old image if exists
    if (oldImageName && oldImageName !== 'user_image.png' && oldImageName !== 'default.jpg') {
      const oldFilePath = path.join(fullFolderPath, oldImageName);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
        console.log(`🗑️ Deleted old image: ${oldImageName}`);
      }
    }

    return {
      success: true,
      filename: newFileName,
      path: `${folderPath}${newFileName}`,
      size: dimensions,
    };
  } catch (error) {
    console.error('❌ Image processing error:', error);
    return {
      success: false,
      error: error.message,
      filename: null,
    };
  }
};

/**
 * Delete image file from disk
 * @param {String} folderPath - Folder path (e.g., '/ethi_doctor_image/')
 * @param {String} fileName - Image filename
 * @returns {Boolean} Success status
 */
const deleteImage = (folderPath, fileName) => {
  try {
    if (!fileName || fileName === 'user_image.png' || fileName === 'default.jpg') {
      return false; // Don't delete default images
    }

    const baseDir = path.join(__dirname, '../../app/assets');
    const fullFolderPath = path.join(baseDir, folderPath.replace(/^\/|\/$/g, ''));
    const fullFilePath = path.join(fullFolderPath, fileName);

    if (fs.existsSync(fullFilePath)) {
      fs.unlinkSync(fullFilePath);
      console.log(`🗑️ Deleted image: ${fileName}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Image deletion error:', error);
    return false;
  }
};

/**
 * Get image file size in bytes
 * @param {String} folderPath - Folder path
 * @param {String} fileName - Image filename
 * @returns {Number} File size in bytes (or 0 if not found)
 */
const getImageSize = (folderPath, fileName) => {
  try {
    const baseDir = path.join(__dirname, '../../app/assets');
    const fullFolderPath = path.join(baseDir, folderPath.replace(/^\/|\/$/g, ''));
    const fullFilePath = path.join(fullFolderPath, fileName);

    if (fs.existsSync(fullFilePath)) {
      const stats = fs.statSync(fullFilePath);
      return stats.size;
    }

    return 0;
  } catch (error) {
    console.error('❌ Error getting image size:', error);
    return 0;
  }
};

module.exports = {
  processAndSaveImage,
  deleteImage,
  getImageSize,
  generateUniqueFilename,
  IMAGE_SIZES,
};

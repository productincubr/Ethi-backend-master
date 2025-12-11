/**
 * AWS S3 Image Storage Helper
 * 
 * PURPOSE: Upload, retrieve, and delete images from AWS S3 cloud storage
 * 
 * FEATURES:
 * - Upload images to S3 bucket
 * - Generate secure public URLs
 * - Delete old images from S3
 * - Support multiple image formats
 * - Image compression before upload
 * 
 * INDUSTRY STANDARD APPROACH:
 * Instead of saving images in project folder, we:
 * 1. Compress image locally (Sharp)
 * 2. Upload to AWS S3 cloud storage
 * 3. Store only the S3 URL in MongoDB
 * 4. Serve images via CloudFront CDN (optional)
 */

const AWS = require('aws-sdk');
const sharp = require('sharp');
const crypto = require('crypto');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1', // Mumbai region
});

const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'ethi-healthcare-images';

// Standard image sizes
const IMAGE_SIZES = {
  passport: { width: 200, height: 200 },      // Square passport size
  profile: { width: 400, height: 400 },       // Profile picture
  thumbnail: { width: 150, height: 150 },     // Small thumbnail
  banner: { width: 1200, height: 400 },       // Banner/cover image
  full: { width: 1920, height: 1080 },        // Full HD
};

/**
 * Generate unique filename with MD5 hash
 * @param {String} prefix - Folder prefix (e.g., 'doctor', 'admin', 'patient')
 * @param {String} extension - File extension (e.g., '.jpg', '.png')
 * @returns {String} Unique S3 key
 */
const generateS3Key = (prefix = 'images', extension = '.jpg') => {
  const timestamp = Date.now().toString();
  const randomStr = crypto.randomBytes(8).toString('hex');
  const md5Hash = crypto.createHash('md5').update(timestamp + randomStr).digest('hex');
  return `${prefix}/${md5Hash}${extension}`;
};

/**
 * Upload image to AWS S3 with compression and resizing
 * @param {Object} imageFile - Express fileUpload file object or Buffer
 * @param {String} folder - S3 folder (e.g., 'doctor', 'admin', 'patient')
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Result with S3 URL and key
 * 
 * EXAMPLE USAGE:
 * const result = await uploadImageToS3(req.files.profile_image, 'doctor', {
 *   size: 'profile',
 *   quality: 85,
 *   oldImageKey: 'doctor/abc123.jpg' // Delete old image
 * });
 * 
 * // Save result.url to MongoDB
 * doctor.profile_image_url = result.url;
 */
const uploadImageToS3 = async (imageFile, folder = 'images', options = {}) => {
  try {
    const {
      size = 'profile',            // passport, profile, thumbnail, banner, full
      quality = 85,                // JPEG quality (1-100)
      format = 'jpeg',             // jpeg, png, webp
      oldImageKey = null,          // Delete old image from S3 if provided
      makePublic = true,           // Make image publicly accessible
    } = options;

    // Validate image file
    if (!imageFile) {
      throw new Error('No image file provided');
    }

    // Get image buffer
    const imageBuffer = imageFile.data || imageFile;

    // Get image dimensions
    const dimensions = IMAGE_SIZES[size] || IMAGE_SIZES.profile;

    // Process image: resize + compress
    const processedBuffer = await sharp(imageBuffer)
      .resize(dimensions.width, dimensions.height, {
        fit: 'cover',              // Crop to exact dimensions
        position: 'center',        // Center crop
      })
      .toFormat(format, {
        quality: quality,          // Compression quality
        mozjpeg: true,            // Use mozjpeg for better compression
      })
      .toBuffer();

    // Generate unique S3 key
    const extension = format === 'jpeg' ? '.jpg' : `.${format}`;
    const s3Key = generateS3Key(folder, extension);

    // Prepare S3 upload parameters
    const uploadParams = {
      Bucket: S3_BUCKET_NAME,
      Key: s3Key,
      Body: processedBuffer,
      ContentType: `image/${format}`,
      ACL: makePublic ? 'public-read' : 'private', // Public or private access
    };

    // Upload to S3
    const uploadResult = await s3.upload(uploadParams).promise();

    console.log(`✅ Image uploaded to S3: ${s3Key}`);
    console.log(`   - Size: ${dimensions.width}x${dimensions.height}`);
    console.log(`   - Quality: ${quality}%`);
    console.log(`   - Format: ${format}`);
    console.log(`   - URL: ${uploadResult.Location}`);

    // Delete old image if exists
    if (oldImageKey && oldImageKey !== 'default.jpg' && oldImageKey !== 'user_image.png') {
      await deleteImageFromS3(oldImageKey);
    }

    return {
      success: true,
      url: uploadResult.Location,        // Public URL
      key: s3Key,                         // S3 key for deletion
      bucket: S3_BUCKET_NAME,
      size: dimensions,
    };
  } catch (error) {
    console.error('❌ S3 upload error:', error);
    return {
      success: false,
      error: error.message,
      url: null,
      key: null,
    };
  }
};

/**
 * Delete image from AWS S3
 * @param {String} s3Key - S3 object key (e.g., 'doctor/abc123.jpg')
 * @returns {Promise<Boolean>} Success status
 * 
 * EXAMPLE USAGE:
 * await deleteImageFromS3('doctor/abc123.jpg');
 */
const deleteImageFromS3 = async (s3Key) => {
  try {
    if (!s3Key || s3Key === 'default.jpg' || s3Key === 'user_image.png') {
      return false; // Don't delete default images
    }

    // Extract key from full URL if provided
    let key = s3Key;
    if (s3Key.includes('amazonaws.com/')) {
      key = s3Key.split('amazonaws.com/')[1];
    }

    const deleteParams = {
      Bucket: S3_BUCKET_NAME,
      Key: key,
    };

    await s3.deleteObject(deleteParams).promise();
    console.log(`🗑️ Deleted image from S3: ${key}`);
    return true;
  } catch (error) {
    console.error('❌ S3 deletion error:', error);
    return false;
  }
};

/**
 * Generate signed URL for private images (expires in 1 hour)
 * @param {String} s3Key - S3 object key
 * @param {Number} expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns {String} Signed URL
 * 
 * EXAMPLE USAGE:
 * const signedUrl = getSignedUrl('patient/private/abc123.jpg', 3600);
 * // URL expires after 1 hour
 */
const getSignedUrl = (s3Key, expiresIn = 3600) => {
  try {
    const params = {
      Bucket: S3_BUCKET_NAME,
      Key: s3Key,
      Expires: expiresIn, // 1 hour by default
    };

    const signedUrl = s3.getSignedUrl('getObject', params);
    return signedUrl;
  } catch (error) {
    console.error('❌ Error generating signed URL:', error);
    return null;
  }
};

/**
 * Check if S3 bucket exists and is accessible
 * @returns {Promise<Boolean>} Bucket accessibility status
 */
const checkS3Connection = async () => {
  try {
    await s3.headBucket({ Bucket: S3_BUCKET_NAME }).promise();
    console.log(`✅ S3 bucket accessible: ${S3_BUCKET_NAME}`);
    return true;
  } catch (error) {
    console.error(`❌ S3 bucket not accessible: ${S3_BUCKET_NAME}`);
    console.error('   Error:', error.message);
    return false;
  }
};

/**
 * Upload multiple images to S3
 * @param {Array} imageFiles - Array of image file objects
 * @param {String} folder - S3 folder prefix
 * @param {Object} options - Processing options
 * @returns {Promise<Array>} Array of upload results
 */
const uploadMultipleImagesToS3 = async (imageFiles, folder = 'images', options = {}) => {
  try {
    const uploadPromises = imageFiles.map(file => 
      uploadImageToS3(file, folder, options)
    );
    
    const results = await Promise.all(uploadPromises);
    
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Uploaded ${successCount}/${imageFiles.length} images to S3`);
    
    return results;
  } catch (error) {
    console.error('❌ Multiple upload error:', error);
    return [];
  }
};

module.exports = {
  uploadImageToS3,
  deleteImageFromS3,
  getSignedUrl,
  checkS3Connection,
  uploadMultipleImagesToS3,
  generateS3Key,
  IMAGE_SIZES,
};

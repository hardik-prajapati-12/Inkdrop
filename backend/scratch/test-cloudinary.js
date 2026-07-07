// backend/scratch/test-cloudinary.js
const fs = require('fs');
const path = require('path');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function runTest() {
  console.log('🧪 Starting Cloudinary upload and delete verification test...');
  console.log('   Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('   API Key:', process.env.CLOUDINARY_API_KEY ? 'Present' : 'Missing');
  console.log('   API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Present' : 'Missing');

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const isConfigured = cloudName && apiKey && apiSecret &&
                       !cloudName.includes('your_cloudinary') &&
                       !apiKey.includes('your_cloudinary') &&
                       !apiSecret.includes('your_cloudinary');

  if (!isConfigured) {
    console.error('❌ Error: Cloudinary credentials are using default placeholders in your .env file.');
    console.log('   Please configure real credentials in backend/.env before running the test.');
    process.exit(1);
  }

  // Create a temporary text file that we can pretend is an image (or a small transparent 1x1 GIF)
  // Transparent 1x1 GIF base64
  const gifBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const testFilePath = path.join(__dirname, 'test-image.gif');
  fs.writeFileSync(testFilePath, Buffer.from(gifBase64, 'base64'));
  console.log(`📂 Created temporary test file at: ${testFilePath}`);

  try {
    // Test 1: Upload
    console.log('📤 Test 1: Uploading to Cloudinary folder "test-inkdrop"...');
    const secureUrl = await uploadToCloudinary(testFilePath, 'test-inkdrop');
    console.log('   ✅ Upload success!');
    console.log(`   Secure URL: ${secureUrl}`);

    // Verify local file cleanup
    if (!fs.existsSync(testFilePath)) {
      console.log('   ✅ Verification: Local temp file was automatically deleted.');
    } else {
      console.warn('   ❌ Warning: Local temp file still exists! Cleanup failed.');
      try { fs.unlinkSync(testFilePath); } catch (_) {}
    }

    // Test 2: Deletion
    console.log('\n🗑️ Test 2: Deleting from Cloudinary using secure URL...');
    const deleteResult = await deleteFromCloudinary(secureUrl);
    console.log('   ✅ Deletion success!');
    console.log('   Delete response:', deleteResult);

    console.log('\n🎉 All tests passed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    // Cleanup if testFilePath still exists
    if (fs.existsSync(testFilePath)) {
      try { fs.unlinkSync(testFilePath); } catch (_) {}
    }
    process.exit(1);
  }
}

runTest();

// backend/migrate-to-cloudinary.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Post = require('./models/Post');
const User = require('./models/User');
const { uploadToCloudinary } = require('./config/cloudinary');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blogdb';

async function migrate() {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const isConfigured = cloudName && apiKey && apiSecret &&
                         !cloudName.includes('your_cloudinary') &&
                         !apiKey.includes('your_cloudinary') &&
                         !apiSecret.includes('your_cloudinary');

    if (!isConfigured) {
      console.error('❌ Error: Cloudinary is not properly configured in .env. Please fill in your real CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
      process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Make sure uploads directory exists for temp copying
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // 1 ── Migrate User Avatars
    console.log('\n--- Migrating User Avatars ---');
    const users = await User.find({ avatar: { $regex: /^\/?uploads\//i } });
    console.log(`🔍 Found ${users.length} users with local avatars.`);

    let usersMigratedCount = 0;
    for (const user of users) {
      const relativePath = user.avatar.replace(/^\//, ''); // remove leading slash
      const localPath = path.join(__dirname, relativePath);

      if (fs.existsSync(localPath)) {
        try {
          console.log(`📤 Uploading avatar for user "${user.username}" (${user.email})...`);
          
          // Copy file to temp location so the upload utility deletes the temp file, leaving the original intact
          const tempFileName = `temp-migrate-${Date.now()}-${path.basename(localPath)}`;
          const tempPath = path.join(uploadsDir, tempFileName);
          fs.copyFileSync(localPath, tempPath);
          
          const cloudUrl = await uploadToCloudinary(tempPath, 'inkdrop/avatars');
          if (cloudUrl) {
            user.avatar = cloudUrl;
            await user.save();
            usersMigratedCount++;
            console.log(`   ✅ Success! New URL: ${cloudUrl}`);
          }
        } catch (err) {
          console.error(`   ❌ Failed to migrate avatar for user "${user.username}":`, err.message);
        }
      } else {
        console.warn(`   ⚠️  Local file not found at: ${localPath}`);
      }
    }

    // 2 ── Migrate Post Cover Images
    console.log('\n--- Migrating Post Cover Images ---');
    const posts = await Post.find({ coverImage: { $regex: /^\/?uploads\//i } });
    console.log(`🔍 Found ${posts.length} posts with local cover images.`);

    let postsMigratedCount = 0;
    for (const post of posts) {
      const relativePath = post.coverImage.replace(/^\//, ''); // remove leading slash
      const localPath = path.join(__dirname, relativePath);

      if (fs.existsSync(localPath)) {
        try {
          console.log(`📤 Uploading cover image for post "${post.title}"...`);
          
          // Copy file to temp location so the upload utility deletes the temp file, leaving the original intact
          const tempFileName = `temp-migrate-${Date.now()}-${path.basename(localPath)}`;
          const tempPath = path.join(uploadsDir, tempFileName);
          fs.copyFileSync(localPath, tempPath);

          const cloudUrl = await uploadToCloudinary(tempPath, 'inkdrop/posts');
          if (cloudUrl) {
            post.coverImage = cloudUrl;
            await post.save();
            postsMigratedCount++;
            console.log(`   ✅ Success! New URL: ${cloudUrl}`);
          }
        } catch (err) {
          console.error(`   ❌ Failed to migrate cover image for post "${post.title}":`, err.message);
        }
      } else {
        console.warn(`   ⚠️  Local file not found at: ${localPath}`);
      }
    }

    console.log('\n=====================================');
    console.log('🎉 Migration Completed!');
    console.log(`👤 User avatars migrated: ${usersMigratedCount}/${users.length}`);
    console.log(`📝 Post cover images migrated: ${postsMigratedCount}/${posts.length}`);
    console.log('=====================================');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrate();

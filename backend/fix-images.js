// backend/fix-images.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Post = require('./models/Post');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blogdb';

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      console.log('❌ Uploads directory does not exist');
      process.exit(0);
    }

    // Get list of images in uploads folder
    const files = fs.readdirSync(uploadsDir)
      .filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));

    if (files.length === 0) {
      console.log('❌ No image files found in uploads directory');
      process.exit(0);
    }

    console.log('📂 Found uploads files:', files);

    const posts = await Post.find();
    console.log(`📝 Found ${posts.length} posts in database`);

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      // Cycle through existing files so each post has a valid cover image
      const file = files[i % files.length];
      post.coverImage = `/uploads/${file}`;
      await post.save();
      console.log(`✓ Updated post "${post.title}" -> "/uploads/${file}"`);
    }

    console.log('🎉 Successfully fixed all post cover images!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

run();

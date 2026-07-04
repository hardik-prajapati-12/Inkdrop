// backend/routes/settings.js
const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/settings - Public
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      // Create defaults
      settings = await Settings.create({
        twitter: 'https://twitter.com',
        linkedin: 'https://linkedin.com',
        github: 'https://github.com',
        email: 'contact@inkdrop.com'
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/settings - Admin Only
router.put('/', protect, adminOnly, async (req, res) => {
  try {
    const { twitter, linkedin, github, email } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    settings.twitter = twitter || '';
    settings.linkedin = linkedin || '';
    settings.github = github || '';
    settings.email = email || '';
    
    await settings.save();
    res.json({ message: 'Settings updated successfully!', settings });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

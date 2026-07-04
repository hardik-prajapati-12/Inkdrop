// backend/models/Settings.js
const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  twitter: { type: String, default: 'https://twitter.com' },
  linkedin: { type: String, default: 'https://linkedin.com' },
  github: { type: String, default: 'https://github.com' },
  email: { type: String, default: 'contact@inkdrop.com' }
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);

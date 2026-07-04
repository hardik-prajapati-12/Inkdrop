// =============================================
//   MEAN Stack Blog - Main Server (server.js)
// =============================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ── Middleware ──────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:4200',
    'https://inkdrop-kappa.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Database Connection ─────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://hardikprajapati73116_db_user:30gbZwBOdwtkEDxf@blog.cwwwlr4.mongodb.net/?appName=blog')
  .then(() => console.log('✅  MongoDB connected successfully'))
  .catch(err => console.error('❌  MongoDB connection error:', err));


app.get('/test', (req, res) => {
  res.json({
    message: 'Backend is working!',
    time: new Date()
  });
});
// ── Routes ──────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/messages', require('./routes/messages'));   // ← contact messages
app.use('/api/stats', require('./routes/stats'));      // ← admin overview stats
app.use('/api/settings', require('./routes/settings'));

// ── Health Check ────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Blog API is running 🚀' });
});

// ── 404 Handler ─────────────────────────────
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// ── Global Error Handler ─────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// ── Start Server ─────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const backgroundRemovalService = require('./services/backgroundRemovalService');

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_FILE_SIZE_BYTES = (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 15) * 1024 * 1024;

// Basic security and parsing middleware
app.use(cors());
app.use(express.json());

// In-memory file upload storage: user images are NEVER saved to disk, ensuring complete privacy
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedMimes.includes(file.mimetype.toLowerCase())) {
      const err = new Error('Please upload a JPG, PNG, JPEG, or WEBP image.');
      err.code = 'LIMIT_FILE_TYPE';
      return cb(err, false);
    }
    cb(null, true);
  }
});

// Serve frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// Health & Info Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    maxFileSizeMb: Math.floor(MAX_FILE_SIZE_BYTES / (1024 * 1024)),
    supportedFormats: ['JPG', 'JPEG', 'PNG', 'WEBP']
  });
});

// Background Removal Endpoint
app.post('/api/remove-background', (req, res, next) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'This image is too large. Please choose a smaller image.'
        });
      }
      if (err.code === 'LIMIT_FILE_TYPE') {
        return res.status(400).json({
          error: err.message
        });
      }
      return res.status(400).json({
        error: 'We couldn\'t process this image. Please try another image.'
      });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        error: 'Please choose an image to upload.'
      });
    }

    try {
      const startTime = Date.now();
      const result = await backgroundRemovalService.process(req.file.buffer);
      const durationMs = Date.now() - startTime;

      // Extract original filename without extension for download header
      const originalName = req.file.originalname 
        ? path.parse(req.file.originalname).name 
        : 'image';
      const cleanDownloadName = `${originalName}-no-background.png`;

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(cleanDownloadName)}"`);
      res.setHeader('X-Processing-Time-Ms', durationMs.toString());
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      
      return res.send(result.buffer);
    } catch (processError) {
      console.error('[API Error] Background removal failure:', processError.message);

      if (processError.statusCode === 400) {
        return res.status(400).json({ error: processError.message });
      }

      return res.status(500).json({
        error: 'Something went wrong while processing your image. Please try again.'
      });
    }
  });
});

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('[Global Error]', err);
  res.status(500).json({
    error: 'Something went wrong while processing your image. Please try again.'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[Background Remover] Server running at http://localhost:${PORT}`);
});

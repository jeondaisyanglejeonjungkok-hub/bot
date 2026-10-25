# Background Remover

A focused, professional image utility that removes backgrounds from images quickly, cleanly, and securely.

## Features

- **Instant Background Removal**: Upload or drag & drop JPG, PNG, or WEBP images up to 15MB.
- **True Transparency**: Outputs high-resolution transparent PNG with intact foreground pixels and smooth edge blending.
- **Interactive Before / After Comparison**:
  - Interactive split slider (drag or touch)
  - Keyboard arrow navigation (<kbd>←</kbd> / <kbd>→</kbd>)
  - Dedicated view mode toggle buttons (*Split*, *Background Removed*, *Original*)
- **Preview Inspection Controls**:
  - Zoom in, zoom out, fit to screen
  - Backdrop contrast switcher (Transparent checkerboard, solid white, solid dark)
- **Zero Disk Storage / 100% Privacy**: Images are processed directly in-memory and wiped immediately upon completion.
- **Smart Download Naming**: Automatically preserves original filename and appends `-no-background.png`.
- **Seamless Reset**: "Remove Another Image" resets the UI smoothly without page reload.
- **Clipboard Paste**: Press <kbd>Ctrl+V</kbd> or <kbd>⌘V</kbd> anywhere on the page to paste an image directly from your clipboard.
- **Pluggable Architecture**: `backgroundRemovalService.js` supports local open-source models (U2-Net / U2-Net Portable) with optional fallback to external APIs via environment variables.

## Architecture

```
ads-traffic-agent/
├── server.js                      # Express application, routes, in-memory upload & security headers
├── services/
│   └── backgroundRemovalService.js # Modular provider interface (Local U2-Net / External API)
├── python_engine/
│   └── remove_bg.py               # Rembg ONNX engine with EXIF orientation correction
├── public/
│   ├── index.html                 # Accessible, semantic HTML5 UI with SEO meta tags
│   ├── css/
│   │   └── index.css              # Custom design system (slate/neutral, checkerboard, responsive)
│   └── js/
│       ├── app.js                 # Main application state coordinator
│       ├── components/
│       │   ├── uploader.js        # Drag & drop, click, paste, format/size validation
│       │   ├── comparisonSlider.js# Split slider with mouse, touch, and keyboard support
│       │   └── previewControls.js # Zoom and backdrop contrast controls
│       └── services/
│           └── apiService.js      # Frontend API client
```

## Quick Start

1. Start the server:
   ```bash
   npm start
   ```
2. Open your browser:
   ```
   http://localhost:3000
   ```

## Configuration (.env)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port for the web server |
| `MAX_FILE_SIZE_MB` | `15` | Maximum upload size in megabytes |
| `BG_REMOVAL_PROVIDER` | `local` | Background removal provider (`local` or `api`) |
| `REMBG_MODEL` | `u2netp` | Model architecture (`u2netp`, `u2net`, etc.) |
| `PYTHON_PATH` | `python` | Path to python executable |
| `BG_REMOVAL_API_KEY` | *(optional)* | External provider API key if using cloud provider |

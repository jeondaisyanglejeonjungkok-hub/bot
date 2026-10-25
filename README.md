# Background Remover (100% Client-Side / Netlify Ready)

A focused, professional image utility that removes backgrounds from images quickly, cleanly, and securely — running **100% directly in the user's browser** via WebAssembly (Wasm) and ONNX Runtime Web.

- **Zero backend or server required** (no Node.js server, no Python, no Docker).
- **100% Private**: Images are processed directly on your local device and never leave the browser.
- **Ready for Instant Netlify Deployment** with built-in `netlify.toml`.

---

## Features

- **In-Browser AI Segmentation**: Powered by `@imgly/background-removal` running via WebAssembly.
- **True Transparency**: High-resolution transparent PNG with preserved foreground pixels and clean edge masking.
- **Interactive Before / After Comparison**:
  - Interactive split slider (mouse and touch drag)
  - Keyboard arrow navigation (<kbd>←</kbd> / <kbd>→</kbd>)
  - Dedicated view modes (*Split*, *Background Removed*, *Original*)
- **Preview Inspection Controls**:
  - Zoom in, zoom out, fit to screen
  - Backdrop contrast switcher (Transparent checkerboard, solid white, solid dark)
- **Smart Download Naming**: Preserves original filename and appends `-no-background.png`.
- **Clipboard Paste**: Press <kbd>Ctrl+V</kbd> or <kbd>⌘V</kbd> anywhere on the page to paste an image directly from your clipboard.
- **Responsive & Accessible**: Works on desktop and mobile viewports with full ARIA accessibility.

---

## Project Structure

```
/
├── index.html                           # Main static HTML entry point
├── netlify.toml                         # Netlify configuration & WebAssembly headers
├── css/
│   └── index.css                        # Professional slate/neutral design system & checkerboard
├── js/
│   ├── app.js                           # UI coordinator & state machine
│   ├── components/
│   │   ├── uploader.js                  # Drag & drop, file selection, clipboard paste
│   │   ├── comparisonSlider.js          # Before/After comparison slider
│   │   └── previewControls.js           # Zoom and backdrop contrast controls
│   └── services/
│       ├── backgroundRemovalService.js  # In-browser WebAssembly background removal
│       └── apiService.js                # Service facade
└── package.json                         # Local development scripts
```

---

## How to Deploy on Netlify (100% Free)

Because this repository is now 100% static:

1. Go to **[https://app.netlify.com](https://app.netlify.com)** and log in.
2. Click **Add new site** → **Import an existing project**.
3. Choose **GitHub** and authorize access.
4. Select the repository **`jeondaisyanglejeonjungkok-hub/bot`**.
5. Netlify will automatically detect:
   - **Publish directory**: `.` (root)
   - **Build command**: *(leave blank)*
6. Click **Deploy bot**.

Your website will be live worldwide in ~10 seconds with a free HTTPS URL!

---

## Local Development

To run locally:

```bash
# Using Python's built-in web server:
python -m http.server 3000

# OR using npx serve:
npx serve .
```

Visit: `http://localhost:3000`

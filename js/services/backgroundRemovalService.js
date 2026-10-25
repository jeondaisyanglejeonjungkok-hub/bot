/**
 * backgroundRemovalService.js
 * 
 * 100% Client-Side Background Removal Engine.
 * Runs in the user's browser using WebAssembly (Wasm) and ONNX Runtime Web
 * via the @imgly/background-removal library.
 * 
 * - Zero backend servers or Python dependencies required
 * - Completely private: user images never leave the browser
 * - Supports JPG, JPEG, PNG, WEBP
 * - Automatic caching of model weights in browser storage
 */

let imglyModule = null;

/**
 * Lazily loads the background removal engine from ESM CDN
 */
async function loadEngine(onProgress) {
  if (imglyModule) return imglyModule;

  if (onProgress) {
    onProgress('Loading background removal engine…', 10);
  }

  try {
    // Dynamic import of ESM build from jsDelivr CDN
    const module = await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.7/+esm');
    imglyModule = module.removeBackground || module.default;
    return imglyModule;
  } catch (err) {
    console.error('[Engine Load Error]', err);
    throw new Error('Failed to load in-browser background removal engine. Please check your internet connection.');
  }
}

/**
 * Remove background from an image file or blob completely on the client side
 * @param {File|Blob|string} imageSource 
 * @param {Function} [onProgress] - Callback (message: string, percent: number)
 * @returns {Promise<{ blob: Blob, durationMs: number }>}
 */
export async function removeBackgroundClient(imageSource, onProgress = null) {
  const startTime = Date.now();
  const removeBg = await loadEngine(onProgress);

  const config = {
    model: 'small', // Optimized small model (~40MB) for faster browser downloads & inference
    debug: false,
    progress: (key, current, total) => {
      if (typeof onProgress === 'function') {
        if (total > 0) {
          const pct = Math.min(99, Math.round((current / total) * 100));
          if (key && key.includes('model')) {
            onProgress(`Loading AI model (${pct}%)…`, pct);
          } else {
            onProgress(`Processing image (${pct}%)…`, pct);
          }
        } else {
          onProgress('Removing background…', 75);
        }
      }
    }
  };

  if (onProgress) {
    onProgress('Analyzing image and extracting subject…', 85);
  }

  try {
    const resultBlob = await removeBg(imageSource, config);
    const durationMs = Date.now() - startTime;
    return {
      blob: resultBlob,
      durationMs
    };
  } catch (err) {
    console.error('[Client-Side Removal Error]', err);
    throw new Error('We couldn\'t process this image. Please try another image.');
  }
}

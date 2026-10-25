/**
 * backgroundRemovalService.js
 * 
 * Modular background removal service.
 * Supports multiple providers:
 *  - 'local': Local U2-Net / U2-Net Portable ONNX model via Python worker (zero disk I/O, in-memory)
 *  - 'api': External API provider (e.g. remove.bg, ClipDrop, or custom API) configured via environment variables
 * 
 * Preserves foreground pixels, outputs transparent PNGs, and never permanently stores images.
 */

const { spawn } = require('child_process');
const path = require('path');

// Image magic byte signatures for security validation
const MAGIC_NUMBERS = {
  jpeg: [0xFF, 0xD8, 0xFF],
  png:  [0x89, 0x50, 0x4E, 0x47],
  webp: [0x52, 0x49, 0x46, 0x46] // RIFF...WEBP
};

/**
 * Validates whether the buffer matches supported image signatures (JPEG, PNG, WEBP)
 * @param {Buffer} buffer 
 * @returns {boolean}
 */
function isValidImageSignature(buffer) {
  if (!buffer || buffer.length < 12) return false;

  // Check JPEG
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;

  // Check PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;

  // Check WEBP (starts with RIFF and has WEBP at offset 8)
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return true;

  return false;
}

/**
 * Local Python Provider: executes python_engine/remove_bg.py with stdin/stdout streaming
 */
class LocalPythonProvider {
  constructor(modelName = process.env.REMBG_MODEL || 'u2netp') {
    this.modelName = modelName;
    this.scriptPath = path.resolve(__dirname, '../python_engine/remove_bg.py');
    this.pythonPath = process.env.PYTHON_PATH || 'python';
  }

  async removeBackground(imageBuffer) {
    return new Promise((resolve, reject) => {
      const child = spawn(this.pythonPath, [
        this.scriptPath,
        '--pipe',
        '--model', this.modelName
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const stdoutChunks = [];
      const stderrChunks = [];

      child.stdout.on('data', chunk => stdoutChunks.push(chunk));
      child.stderr.on('data', chunk => stderrChunks.push(chunk));

      child.on('error', err => {
        reject(new Error(`Failed to spawn background removal process: ${err.message}`));
      });

      child.on('close', code => {
        if (code !== 0) {
          const stderr = Buffer.concat(stderrChunks).toString('utf-8');
          return reject(new Error(`Background removal failed (exit code ${code}): ${stderr || 'Unknown error'}`));
        }

        const resultBuffer = Buffer.concat(stdoutChunks);
        if (!resultBuffer || resultBuffer.length === 0) {
          return reject(new Error('Background removal produced empty output'));
        }

        resolve({
          buffer: resultBuffer,
          contentType: 'image/png',
          provider: 'local-u2net'
        });
      });

      // Stream image directly into worker via stdin (in-memory)
      child.stdin.write(imageBuffer);
      child.stdin.end();
    });
  }
}

/**
 * External API Provider (e.g. remove.bg, ClipDrop, etc.)
 */
class ExternalApiProvider {
  constructor() {
    this.apiKey = process.env.BG_REMOVAL_API_KEY;
    this.apiUrl = process.env.BG_REMOVAL_API_URL || 'https://api.remove.bg/v1.0/removebg';
  }

  async removeBackground(imageBuffer) {
    if (!this.apiKey) {
      throw new Error('BG_REMOVAL_API_KEY is not configured on the server');
    }

    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('image_file', blob, 'input.jpg');
    formData.append('size', 'auto');

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'X-Api-Key': this.apiKey
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`External API failed with HTTP ${response.status}: ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      contentType: 'image/png',
      provider: 'external-api'
    };
  }
}

/**
 * Main Background Removal Service orchestrator
 */
class BackgroundRemovalService {
  constructor() {
    this.localProvider = new LocalPythonProvider();
    this.externalProvider = new ExternalApiProvider();
    this.providerType = process.env.BG_REMOVAL_PROVIDER || 'local';
  }

  /**
   * Remove background from the supplied image buffer
   * @param {Buffer} imageBuffer 
   * @param {Object} options 
   * @returns {Promise<{ buffer: Buffer, contentType: string, provider: string }>}
   */
  async process(imageBuffer, options = {}) {
    // 1. Buffer integrity validation
    if (!imageBuffer || !Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
      const err = new Error('No image buffer provided');
      err.statusCode = 400;
      throw err;
    }

    // 2. Strict magic number verification
    if (!isValidImageSignature(imageBuffer)) {
      const err = new Error('Please upload a JPG, PNG, JPEG, or WEBP image.');
      err.statusCode = 400;
      throw err;
    }

    // 3. Delegate to selected provider with automatic fallback
    if (this.providerType === 'api' && process.env.BG_REMOVAL_API_KEY) {
      try {
        return await this.externalProvider.removeBackground(imageBuffer);
      } catch (apiError) {
        console.warn('[BackgroundRemovalService] External API failed, falling back to local model:', apiError.message);
        return await this.localProvider.removeBackground(imageBuffer);
      }
    }

    // Default to local U2-Net engine
    return await this.localProvider.removeBackground(imageBuffer);
  }
}

module.exports = new BackgroundRemovalService();

/**
 * apiService.js
 * Client-side service facade for background removal.
 * Powered by in-browser WebAssembly with zero server dependencies.
 */

import { removeBackgroundClient } from './backgroundRemovalService.js';

export class ApiService {
  /**
   * Process an image file client-side
   * @param {File} file 
   * @param {Function} [onProgress]
   * @returns {Promise<{ blob: Blob, durationMs: number }>}
   */
  static async removeBackground(file, onProgress) {
    return await removeBackgroundClient(file, onProgress);
  }

  /**
   * Static health check (Client-side engine readiness)
   */
  static async checkHealth() {
    return {
      status: 'ok',
      engine: 'client-wasm',
      maxFileSizeMb: 25,
      supportedFormats: ['JPG', 'JPEG', 'PNG', 'WEBP']
    };
  }
}

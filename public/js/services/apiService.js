/**
 * apiService.js
 * Handles backend communication for background removal and server health.
 */

export class ApiService {
  /**
   * Send an image file to the background removal endpoint
   * @param {File} file 
   * @returns {Promise<{ blob: Blob, durationMs: number }>}
   */
  static async removeBackground(file) {
    const formData = new FormData();
    formData.append('image', file);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      const response = await fetch('/api/remove-background', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = 'Something went wrong while processing your image. Please try again.';
        try {
          const errorJson = await response.json();
          if (errorJson && errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch {
          // Response was not JSON
        }
        const error = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }

      const blob = await response.blob();
      const durationMs = parseInt(response.headers.get('X-Processing-Time-Ms') || '0', 10);

      return { blob, durationMs };
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Processing took longer than expected. Please try again.');
      }
      throw err;
    }
  }

  /**
   * Fetch server configuration and status
   */
  static async checkHealth() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return { status: 'unknown', maxFileSizeMb: 15 };
  }
}

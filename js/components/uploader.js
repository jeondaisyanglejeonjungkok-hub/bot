/**
 * uploader.js
 * Handles drag & drop, file selection, clipboard paste, validation, and keyboard interaction.
 */

export class Uploader {
  constructor(options = {}) {
    this.dropzoneEl = options.dropzoneEl;
    this.fileInputEl = options.fileInputEl;
    this.chooseBtnEl = options.chooseBtnEl;
    this.maxSizeBytes = options.maxSizeBytes || 15 * 1024 * 1024; // 15MB
    this.onFileAccepted = options.onFileAccepted || (() => {});
    this.onError = options.onError || (() => {});

    this.allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    this.allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    this.init();
  }

  init() {
    if (!this.dropzoneEl || !this.fileInputEl) return;

    // 1. File input change event
    this.fileInputEl.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        this.validateAndProcess(file);
      }
      // Reset input value so re-selecting same file triggers change
      this.fileInputEl.value = '';
    });

    // 2. Click on choose button or dropzone
    if (this.chooseBtnEl) {
      this.chooseBtnEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.fileInputEl.click();
      });
    }

    this.dropzoneEl.addEventListener('click', () => {
      this.fileInputEl.click();
    });

    // 3. Keyboard accessibility (Enter or Space triggers file picker)
    this.dropzoneEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.fileInputEl.click();
      }
    });

    // 4. Drag & Drop events
    ['dragenter', 'dragover'].forEach(eventType => {
      this.dropzoneEl.addEventListener(eventType, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropzoneEl.classList.add('is-dragging');
      });
    });

    ['dragleave', 'dragend'].forEach(eventType => {
      this.dropzoneEl.addEventListener(eventType, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropzoneEl.classList.remove('is-dragging');
      });
    });

    this.dropzoneEl.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.dropzoneEl.classList.remove('is-dragging');

      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        this.validateAndProcess(dt.files[0]);
      }
    });

    // 5. Global Clipboard Paste (Ctrl+V / Cmd+V)
    document.addEventListener('paste', (e) => {
      // Do not intercept paste if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            this.validateAndProcess(file);
            break;
          }
        }
      }
    });
  }

  /**
   * Validate image format and size
   * @param {File} file 
   */
  validateAndProcess(file) {
    // 1. Format check
    const hasValidMime = this.allowedTypes.includes(file.type.toLowerCase());
    const lowerName = file.name.toLowerCase();
    const hasValidExt = this.allowedExtensions.some(ext => lowerName.endsWith(ext));

    if (!hasValidMime && !hasValidExt) {
      this.onError('Please upload a JPG, PNG, JPEG, or WEBP image.');
      return;
    }

    // 2. Size check
    if (file.size > this.maxSizeBytes) {
      this.onError('This image is too large. Please choose a smaller image.');
      return;
    }

    // 3. Accepted
    this.onFileAccepted(file);
  }
}

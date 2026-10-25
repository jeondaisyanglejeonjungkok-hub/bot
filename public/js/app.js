/**
 * app.js
 * Main application coordinator for Background Remover.
 */

import { ApiService } from './services/apiService.js';
import { Uploader } from './components/uploader.js';
import { ComparisonSlider } from './components/comparisonSlider.js';
import { PreviewControls } from './components/previewControls.js';

class BackgroundRemoverApp {
  constructor() {
    // State
    this.originalFile = null;
    this.originalUrl = null;
    this.processedUrl = null;
    this.processedBlob = null;
    this.downloadFilename = 'image-no-background.png';

    // DOM Elements
    this.heroSection = document.getElementById('hero-section');
    this.uploadCard = document.getElementById('upload-card');
    this.processingCard = document.getElementById('processing-card');
    this.resultCard = document.getElementById('result-card');
    this.notificationBanner = document.getElementById('notification-banner');
    this.notificationText = document.getElementById('notification-text');
    this.notificationDismiss = document.getElementById('notification-dismiss');

    // Processing Elements
    this.processingThumb = document.getElementById('processing-thumb');
    this.ariaLiveRegion = document.getElementById('aria-live-region');

    // Result Elements
    this.resultMeta = document.getElementById('result-meta');
    this.downloadBtn = document.getElementById('download-btn');
    this.resetBtn = document.getElementById('reset-btn');

    // Modal & Theme Elements
    this.aboutModal = document.getElementById('about-modal');
    this.openAboutBtn = document.getElementById('open-about-btn');
    this.closeAboutBtn = document.getElementById('close-about-btn');
    this.modalCloseIconBtn = document.getElementById('modal-close-icon-btn');
    this.themeToggleBtn = document.getElementById('theme-toggle-btn');

    this.init();
  }

  init() {
    // 1. Initialize Uploader
    this.uploader = new Uploader({
      dropzoneEl: document.getElementById('dropzone'),
      fileInputEl: document.getElementById('file-input'),
      chooseBtnEl: document.getElementById('choose-btn'),
      onFileAccepted: (file) => this.handleImageUpload(file),
      onError: (msg) => this.showError(msg)
    });

    // 2. Initialize Comparison Slider
    this.slider = new ComparisonSlider({
      containerEl: document.getElementById('slider-container'),
      beforeImgEl: document.getElementById('slider-img-before'),
      afterImgEl: document.getElementById('slider-img-after'),
      clipLayerEl: document.getElementById('slider-clip-layer'),
      handleEl: document.getElementById('slider-handle'),
      modeButtons: document.querySelectorAll('.mode-btn')
    });

    // 3. Initialize Preview Controls
    this.controls = new PreviewControls({
      previewContainerEl: document.getElementById('preview-container'),
      viewportEl: document.getElementById('image-viewport'),
      zoomInBtn: document.getElementById('zoom-in-btn'),
      zoomOutBtn: document.getElementById('zoom-out-btn'),
      zoomResetBtn: document.getElementById('zoom-reset-btn'),
      backdropToggleBtn: document.getElementById('backdrop-toggle-btn')
    });

    // 4. Download button
    if (this.downloadBtn) {
      this.downloadBtn.addEventListener('click', () => this.downloadResult());
    }

    // 5. Reset button ("Remove Another Image")
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => this.resetToUpload());
    }

    // 6. Notification dismiss
    if (this.notificationDismiss) {
      this.notificationDismiss.addEventListener('click', () => this.hideError());
    }

    // 7. About Modal
    this.initModal();

    // 8. Theme Toggle
    this.initTheme();

    // 9. Initial health check
    ApiService.checkHealth();
  }

  /**
   * Main flow: user uploads an image
   * @param {File} file 
   */
  async handleImageUpload(file) {
    this.hideError();
    this.originalFile = file;

    // Determine download filename: [original-name]-no-background.png
    const baseName = file.name ? file.name.substring(0, file.name.lastIndexOf('.')) || file.name : 'image';
    this.downloadFilename = `${baseName}-no-background.png`;

    // Revoke previous URLs if any
    this.cleanupUrls();

    // Create local object URL for preview
    this.originalUrl = URL.createObjectURL(file);

    // Read image dimensions
    const imgTest = new Image();
    imgTest.src = this.originalUrl;
    imgTest.onload = () => {
      this.imageWidth = imgTest.naturalWidth;
      this.imageHeight = imgTest.naturalHeight;
    };

    // Transition to Processing State
    this.setViewState('processing');
    if (this.processingThumb) {
      this.processingThumb.src = this.originalUrl;
    }
    this.announce('Uploading image and removing background…');

    try {
      const { blob, durationMs } = await ApiService.removeBackground(file);
      this.processedBlob = blob;
      this.processedUrl = URL.createObjectURL(blob);

      // Populate slider images
      const beforeImg = document.getElementById('slider-img-before');
      const afterImg = document.getElementById('slider-img-after');

      beforeImg.src = this.originalUrl;
      afterImg.src = this.processedUrl;

      // Update meta details
      if (this.resultMeta) {
        const sizeKb = Math.round(blob.size / 1024);
        const dimensionText = this.imageWidth && this.imageHeight ? `${this.imageWidth} × ${this.imageHeight} px • ` : '';
        this.resultMeta.textContent = `${dimensionText}${sizeKb} KB PNG`;
      }

      // Transition to Success State
      this.setViewState('success');
      this.slider.reset();
      this.controls.reset();
      this.announce('Background removed successfully.');
    } catch (err) {
      console.error('[Processing Error]', err);
      this.setViewState('idle');
      this.showError(err.message || 'Something went wrong while processing your image. Please try again.');
      this.announce('Failed to remove background.');
    }
  }

  /**
   * Download the transparent PNG result
   */
  downloadResult() {
    if (!this.processedUrl) return;

    const link = document.createElement('a');
    link.href = this.processedUrl;
    link.download = this.downloadFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Return to upload state without page reload
   */
  resetToUpload() {
    this.cleanupUrls();
    this.originalFile = null;
    this.processedBlob = null;
    this.hideError();
    this.setViewState('idle');
    this.announce('Ready to remove another image.');
  }

  /**
   * Manage UI states cleanly: idle | processing | success
   */
  setViewState(state) {
    if (state === 'idle') {
      this.heroSection.classList.remove('hidden');
      this.uploadCard.classList.remove('hidden');
      this.processingCard.classList.add('hidden');
      this.resultCard.classList.add('hidden');
    } else if (state === 'processing') {
      this.heroSection.classList.add('hidden');
      this.uploadCard.classList.add('hidden');
      this.processingCard.classList.remove('hidden');
      this.resultCard.classList.add('hidden');
    } else if (state === 'success') {
      this.heroSection.classList.add('hidden');
      this.uploadCard.classList.add('hidden');
      this.processingCard.classList.add('hidden');
      this.resultCard.classList.remove('hidden');
    }
  }

  showError(message) {
    if (this.notificationBanner && this.notificationText) {
      this.notificationText.textContent = message;
      this.notificationBanner.classList.remove('hidden');
      this.notificationBanner.focus();
    }
  }

  hideError() {
    if (this.notificationBanner) {
      this.notificationBanner.classList.add('hidden');
    }
  }

  announce(message) {
    if (this.ariaLiveRegion) {
      this.ariaLiveRegion.textContent = message;
    }
  }

  cleanupUrls() {
    if (this.originalUrl) {
      URL.revokeObjectURL(this.originalUrl);
      this.originalUrl = null;
    }
    if (this.processedUrl) {
      URL.revokeObjectURL(this.processedUrl);
      this.processedUrl = null;
    }
  }

  initModal() {
    const openModal = () => {
      this.aboutModal.classList.remove('hidden');
      this.closeAboutBtn.focus();
    };

    const closeModal = () => {
      this.aboutModal.classList.add('hidden');
      this.openAboutBtn.focus();
    };

    if (this.openAboutBtn) this.openAboutBtn.addEventListener('click', openModal);
    if (this.closeAboutBtn) this.closeAboutBtn.addEventListener('click', closeModal);
    if (this.modalCloseIconBtn) this.modalCloseIconBtn.addEventListener('click', closeModal);

    // Close on backdrop click
    if (this.aboutModal) {
      this.aboutModal.addEventListener('click', (e) => {
        if (e.target === this.aboutModal) closeModal();
      });
    }

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.aboutModal.classList.contains('hidden')) {
        closeModal();
      }
    });
  }

  initTheme() {
    const savedTheme = localStorage.getItem('bg_remover_theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('bg_remover_theme', newTheme);
      });
    }
  }
}

// Instantiate on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  new BackgroundRemoverApp();
});

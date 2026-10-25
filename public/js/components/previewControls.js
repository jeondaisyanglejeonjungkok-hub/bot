/**
 * previewControls.js
 * Controls zoom levels and background inspection backdrops (transparent, white, dark).
 */

export class PreviewControls {
  constructor(options = {}) {
    this.previewContainerEl = options.previewContainerEl;
    this.viewportEl = options.viewportEl;
    this.zoomInBtn = options.zoomInBtn;
    this.zoomOutBtn = options.zoomOutBtn;
    this.zoomResetBtn = options.zoomResetBtn;
    this.backdropToggleBtn = options.backdropToggleBtn;

    this.scale = 1.0;
    this.backdropState = 'checkerboard'; // 'checkerboard' | 'white' | 'black'

    this.init();
  }

  init() {
    if (this.zoomInBtn) {
      this.zoomInBtn.addEventListener('click', () => this.zoom(0.2));
    }
    if (this.zoomOutBtn) {
      this.zoomOutBtn.addEventListener('click', () => this.zoom(-0.2));
    }
    if (this.zoomResetBtn) {
      this.zoomResetBtn.addEventListener('click', () => this.resetZoom());
    }
    if (this.backdropToggleBtn) {
      this.backdropToggleBtn.addEventListener('click', () => this.cycleBackdrop());
    }
  }

  zoom(delta) {
    this.scale = Math.max(0.6, Math.min(2.5, this.scale + delta));
    this.applyZoom();
  }

  resetZoom() {
    this.scale = 1.0;
    this.applyZoom();
  }

  applyZoom() {
    if (this.viewportEl) {
      this.viewportEl.style.transform = `scale(${this.scale})`;
    }
  }

  cycleBackdrop() {
    if (!this.previewContainerEl) return;
    this.previewContainerEl.classList.remove('backdrop-white', 'backdrop-black');

    if (this.backdropState === 'checkerboard') {
      this.backdropState = 'white';
      this.previewContainerEl.classList.add('backdrop-white');
    } else if (this.backdropState === 'white') {
      this.backdropState = 'black';
      this.previewContainerEl.classList.add('backdrop-black');
    } else {
      this.backdropState = 'checkerboard';
    }
  }

  reset() {
    this.resetZoom();
    this.backdropState = 'checkerboard';
    if (this.previewContainerEl) {
      this.previewContainerEl.classList.remove('backdrop-white', 'backdrop-black');
    }
  }
}

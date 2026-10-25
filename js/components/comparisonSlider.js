/**
 * comparisonSlider.js
 * Interactive Before / After split comparison slider with touch, mouse, and keyboard support.
 */

export class ComparisonSlider {
  constructor(options = {}) {
    this.containerEl = options.containerEl;
    this.beforeImgEl = options.beforeImgEl;
    this.afterImgEl = options.afterImgEl;
    this.clipLayerEl = options.clipLayerEl;
    this.handleEl = options.handleEl;
    this.modeButtons = options.modeButtons || [];

    this.position = 50; // Percentage (0 - 100)
    this.currentMode = 'split'; // 'split' | 'removed' | 'original'
    this.isDragging = false;

    this.init();
  }

  init() {
    if (!this.containerEl || !this.handleEl || !this.clipLayerEl) return;

    // Mouse events
    this.handleEl.addEventListener('mousedown', (e) => this.startDrag(e));
    window.addEventListener('mousemove', (e) => this.onDrag(e));
    window.addEventListener('mouseup', () => this.stopDrag());

    // Touch events
    this.handleEl.addEventListener('touchstart', (e) => this.startDrag(e), { passive: true });
    window.addEventListener('touchmove', (e) => this.onDrag(e), { passive: false });
    window.addEventListener('touchend', () => this.stopDrag());

    // Keyboard accessibility on handle
    this.handleEl.setAttribute('tabindex', '0');
    this.handleEl.setAttribute('role', 'slider');
    this.handleEl.setAttribute('aria-label', 'Before and after comparison slider');
    this.handleEl.setAttribute('aria-valuemin', '0');
    this.handleEl.setAttribute('aria-valuemax', '100');
    this.handleEl.setAttribute('aria-valuenow', '50');

    this.handleEl.addEventListener('keydown', (e) => {
      if (this.currentMode !== 'split') {
        this.setMode('split');
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        this.setPosition(this.position - 5);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.setPosition(this.position + 5);
      } else if (e.key === 'Home') {
        e.preventDefault();
        this.setPosition(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        this.setPosition(100);
      }
    });

    // Clicking anywhere on the slider container jumps to that position
    this.containerEl.addEventListener('click', (e) => {
      if (e.target.closest('.slider-handle')) return;
      if (this.currentMode !== 'split') {
        this.setMode('split');
      }
      this.updatePositionFromEvent(e);
    });

    // Segmented mode buttons ('split', 'removed', 'original')
    this.modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        if (mode) this.setMode(mode);
      });
    });

    // Ensure images stay aligned when container resizes
    window.addEventListener('resize', () => this.syncDimensions());
    if (this.afterImgEl) {
      this.afterImgEl.addEventListener('load', () => this.syncDimensions());
    }
  }

  startDrag(e) {
    if (this.currentMode !== 'split') {
      this.setMode('split');
    }
    this.isDragging = true;
    this.containerEl.style.userSelect = 'none';
  }

  onDrag(e) {
    if (!this.isDragging) return;
    if (e.cancelable && e.type === 'touchmove') {
      e.preventDefault();
    }
    this.updatePositionFromEvent(e);
  }

  stopDrag() {
    this.isDragging = false;
    if (this.containerEl) {
      this.containerEl.style.userSelect = '';
    }
  }

  updatePositionFromEvent(e) {
    const rect = this.containerEl.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const offsetX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));
    this.setPosition(percentage);
  }

  setPosition(percentage) {
    this.position = Math.max(0, Math.min(100, percentage));
    this.clipLayerEl.style.width = `${this.position}%`;
    this.handleEl.style.left = `${this.position}%`;
    this.handleEl.setAttribute('aria-valuenow', Math.round(this.position));
  }

  setMode(mode) {
    this.currentMode = mode;
    this.modeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    if (mode === 'removed') {
      this.clipLayerEl.style.width = '0%';
      this.handleEl.style.display = 'none';
    } else if (mode === 'original') {
      this.clipLayerEl.style.width = '100%';
      this.handleEl.style.display = 'none';
    } else {
      // Split
      this.handleEl.style.display = 'flex';
      this.setPosition(this.position);
    }
  }

  syncDimensions() {
    if (!this.afterImgEl || !this.beforeImgEl) return;
    const width = this.afterImgEl.offsetWidth;
    const height = this.afterImgEl.offsetHeight;
    if (width > 0 && height > 0) {
      this.beforeImgEl.style.width = `${width}px`;
      this.beforeImgEl.style.height = `${height}px`;
    }
  }

  reset() {
    this.position = 50;
    this.setMode('split');
    this.setPosition(50);
  }
}

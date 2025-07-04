import Quill from 'quill';

export default class QuillImageResizer {
  quill: Quill;
  img: HTMLImageElement | null = null;
  overlay: HTMLDivElement | null = null;
  handles: HTMLDivElement[] = [];
  initialAspectRatio: number = 0;
  mutationObserver: MutationObserver | null = null;
  isDragging: boolean = false;
  isResizing: boolean = false;

  constructor(quill: Quill) {
    this.quill = quill;
    this.quill.root.addEventListener('click', this._handleClick.bind(this));
    this.quill.root.addEventListener('mousedown', this._handleRootMouseDown.bind(this));
    this.quill.scroll.domNode.addEventListener('scroll', this._handleScroll.bind(this));
  }

  _handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target && target.tagName === 'IMG') {
      if (!this.isResizing) {
        this._activate(target as HTMLImageElement);
      }
    }
  }

  _activate(img: HTMLImageElement) {
    if (this.img === img) return;

    this._deactivate();

    this.img = img;
    this.initialAspectRatio = img.naturalWidth / img.naturalHeight;

    this._createOverlay();
    this._positionOverlay();
    this._createHandles();
    this._observeImageRemoval();
  }

  _deactivate() {
    if (!this.img && !this.overlay) return;

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    this.img = null;
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.overlay = null;
    this.handles = [];
    this.initialAspectRatio = 0;
    this.isDragging = false;
    this.isResizing = false;
  }

  _createOverlay() {
    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position: 'absolute',
      border: '1px dashed #444'
    });
    this.quill.container.appendChild(this.overlay);
    this.overlay.addEventListener('mousedown', this._handleOverlayMouseDown.bind(this));
  }

  _positionOverlay() {
    if (!this.img || !this.overlay) return;

    if (!document.body.contains(this.img)) {
      this._deactivate();
      return;
    }

    const imgRect = this.img.getBoundingClientRect();
    const containerRect = this.quill.container.getBoundingClientRect();
    const scrollTop = this.quill.scroll.domNode.scrollTop;
    const scrollLeft = this.quill.scroll.domNode.scrollLeft;

    Object.assign(this.overlay.style, {
      left: `${imgRect.left - containerRect.left + scrollLeft - 1}px`,
      top: `${imgRect.top - containerRect.top + scrollTop - 1}px`,
      width: `${imgRect.width + 2}px`,
      height: `${imgRect.height + 2}px`,
    });
  }

  _createHandles() {
    if (!this.overlay) return;

    const positions = ['nw', 'ne', 'se', 'sw'];
    positions.forEach(pos => {
      const handle = document.createElement('div');
      Object.assign(handle.style, {
        position: 'absolute',
        width: '10px',
        height: '10px',
        background: '#444',
        border: '1px solid #fff',
        cursor: `${pos}-resize`,
        zIndex: '1001',
      });

      switch (pos) {
        case 'nw': Object.assign(handle.style, { top: '-5px', left: '-5px' }); break;
        case 'ne': Object.assign(handle.style, { top: '-5px', right: '-5px' }); break;
        case 'se': Object.assign(handle.style, { bottom: '-5px', right: '-5px' }); break;
        case 'sw': Object.assign(handle.style, { bottom: '-5px', left: '-5px' }); break;
      }

      handle.dataset.direction = pos;
      handle.addEventListener('mousedown', this._handleDragStart.bind(this));
      this.overlay!.appendChild(handle);
      this.handles.push(handle);
    });
  }

  _handleDragStart(event: MouseEvent) {
    if (!this.img) return;

    this.isDragging = true;
    this.isResizing = true;

    event.preventDefault();
    event.stopPropagation();

    this.quill.disable();

    const handle = event.target as HTMLDivElement;
    const direction = handle.dataset.direction!;
    const initialWidth = parseInt(this.img.getAttribute('width') || this.img.width.toString(), 10);
    const initialHeight = parseInt(this.img.getAttribute('height') || this.img.height.toString(), 10);
    const startX = event.clientX;
    const startY = event.clientY;

    const mouseMoveHandler = (e: MouseEvent) => {
      if (!this.img) {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
        this._deactivate();
        return;
      }

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newWidth = initialWidth;
      let newHeight = initialHeight;

      if (direction.includes('e')) newWidth += deltaX;
      if (direction.includes('w')) newWidth -= deltaX;
      if (direction.includes('s')) newHeight += deltaY;
      if (direction.includes('n')) newHeight -= deltaY;

      if (e.shiftKey) {
        if (direction.includes('w') || direction.includes('e')) {
          newHeight = Math.round(newWidth / this.initialAspectRatio);
        } else {
          newWidth = Math.round(newHeight * this.initialAspectRatio);
        }
      }

      newWidth = Math.max(20, newWidth);
      newHeight = Math.max(20, newHeight);

      this.img.setAttribute('width', `${newWidth}`);
      this.img.setAttribute('height', `${newHeight}`);
      this._positionOverlay();
    };

    const mouseUpHandler = () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);

      this.isDragging = false;

      if (this.img) {
        const blot = Quill.find(this.img);
        if (blot && 'domNode' in blot && blot.domNode instanceof HTMLElement) {
          const index = this.quill.getIndex(blot);
          const length = blot.length();
          this.quill.setSelection(index, length);
          this.quill.format('width', this.img.getAttribute('width'));
          this.quill.format('height', this.img.getAttribute('height'));
        }
      }

      this.isResizing = false;
      this.quill.enable();
      this.quill.focus();
    };

    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  }

  _handleOverlayMouseDown(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isResizing) {
      this.quill.focus();
    }
  }

  _handleRootMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (this.img && this.overlay && !this.overlay.contains(target) && !this.isResizing) {
      this._deactivate();
    }

    if (target && target.tagName === 'IMG' && target !== this.img && !this.isResizing) {
      this._activate(target as HTMLImageElement);
    }
  }

  _observeImageRemoval() {
    if (!this.img || !this.img.parentNode) return;

    this.mutationObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          if (this.img && (!mutation.target.contains(this.img) || !document.body.contains(this.img))) {
            this._deactivate();
          }
        }
      });
    });

    this.mutationObserver.observe(this.img.parentNode, { childList: true });
  }

  _handleScroll() {
    if (this.img && this.overlay) {
      this._positionOverlay();
    }
  }

  destroy() {
    this.quill.root.removeEventListener('click', this._handleClick);
    this.quill.root.removeEventListener('mousedown', this._handleRootMouseDown);
    this.quill.scroll.domNode.removeEventListener('scroll', this._handleScroll);
    if (this.overlay) {
      this.overlay.removeEventListener('mousedown', this._handleOverlayMouseDown);
    }
    this._deactivate();
  }
}

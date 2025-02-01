class Board {
    draggedEl = null;
    isDragging = false;
    startX = 0;
    startY = 0;

    constructor(containerEl) {
        this.containerEl = containerEl;
        this.bindEvents();
    }

    bindEvents() {
        this.containerEl.addEventListener('mousedown', e => { this.dragStart(e); });
        this.containerEl.addEventListener('mousemove', e => { this.drag(e); });
        this.containerEl.addEventListener('mouseup', e => { this.dragEnd(e); });
        this.containerEl.addEventListener('mouseleave', e => { this.dragEnd(e); });
        this.containerEl.addEventListener('dblclick', e => { this.openNote(e); });
    }

    dragStart(e) {
        if (e.target.classList.contains('is-draggable')) {
            this.draggedEl = e.target;
            const rect = this.draggedEl.getBoundingClientRect();

            this.startX = e.clientX - rect.left;
            this.startY = e.clientY - rect.top;

            this.isDragging = true;
        }
    }

    drag(e) {
        if (!this.isDragging) {
            return;
        }

        e.preventDefault();
        
        this.draggedEl.classList.add('is-dragging');

        const containerRect = this.containerEl.getBoundingClientRect();
        let newX = e.clientX - containerRect.left - this.startX;
        let newY = e.clientY - containerRect.top - this.startY;

        const maxX = this.containerEl.clientWidth - this.draggedEl.offsetWidth;
        const maxY = this.containerEl.clientHeight - this.draggedEl.offsetHeight;

        newX = Math.min(Math.max(0, newX), maxX);
        newY = Math.min(Math.max(0, newY), maxY);

        this.draggedEl.style.left = `${newX}px`;
        this.draggedEl.style.top = `${newY}px`;
    }

    dragEnd(e) {
        if (!this.isDragging) {
            return;
        }

        this.isDragging = false;
        if (this.draggedEl) {
            this.draggedEl.classList.remove('is-dragging');
            this.draggedEl = null;
        }
    }

    openNote(e) {
        e.target.querySelector('a').click();
    }
}

export default Board;
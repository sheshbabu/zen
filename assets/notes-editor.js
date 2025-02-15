export class Editor {
    noteId = null;
    tagsEditor = null;

    constructor(containerEl) {
        this.containerEl = containerEl;
        this.containerEl.addEventListener('htmx:afterSwap', e => this.handleUpdate(e));
        this.bindEvents();

        if (this.titleEl.textContent === "" && this.textareaEl.value === "") {
            this.titleEl.focus();
        } else {
            this.renderMarkdown();
        }
    }

    bindEvents() {
        this.editorEl = this.containerEl.querySelector('.notes-editor');
        this.titleEl = this.containerEl.querySelector('.notes-editor-title');
        this.textareaEl = this.containerEl.querySelector('.notes-editor-textarea');
        this.renderedEl = this.containerEl.querySelector('.notes-editor-rendered');
        this.editButtonEl = this.containerEl.querySelector('.notes-editor-toolbar-button-edit');
        this.doneButtonEl = this.containerEl.querySelector('.notes-editor-toolbar-button-done');
        this.hideButtonEl = this.containerEl.querySelector('.notes-editor-toolbar-button-hide');
        this.imagePreview = this.containerEl.querySelector('.notes-editor-image-attachment-preview');
        this.imageDropzone = this.containerEl.querySelector('.notes-editor-image-dropzone');

        this.noteId = this.containerEl.firstElementChild.dataset.noteId;
        if (this.noteId === "" || this.noteId === "0") {
            this.noteId = null;
        }

        if (this.isFloating()) {
            this.hideButtonEl.style.display = 'block';
        } else {
            this.hideButtonEl.style.display = 'none';
        }

        if (this.isEditable()) {
            this.editButtonEl.style.display = 'none';
            this.doneButtonEl.style.display = 'block';
        } else {
            this.editButtonEl.style.display = 'block';
            this.doneButtonEl.style.display = 'none';
        }


        this.tagsEditor = new TagsEditor(this.noteId, null, this.containerEl.querySelector('.notes-editor-tags'));

        this.editorEl.addEventListener('paste', (e) => {
            const items = e.clipboardData.items;

            // Ignore if it doesn't contain any images
            if (Array.from(items).every(item => item.type.indexOf('image') === -1)) {
                return;
            }

            e.preventDefault();
            for (let item of items) {
                if (item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile();
                    this.handleImageAttach(file);
                }
            }
        });

        this.textareaEl.addEventListener('input', () => {
            // scrollHeight is height of content and padding
            // It doesn't include border, margin, or scrollbar
            // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight
            this.textareaEl.style.height = `${this.textareaEl.scrollHeight + 2}px`;
        });

        this.editButtonEl.addEventListener('click', (e) => {
            e.preventDefault();
            this.enableEditMode();
        });

        this.doneButtonEl.addEventListener('click', (e) => {
            e.preventDefault();
            this.disableEditMode();
        });

        this.hideButtonEl.addEventListener('click', (e) => {
            e.preventDefault();
            this.hide();
        });

        this.imageDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.imageDropzone.classList.add('dragover');
        });

        this.imageDropzone.addEventListener('dragleave', () => {
            this.imageDropzone.classList.remove('dragover');
        });

        this.imageDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.imageDropzone.classList.remove('dragover');

            const files = e.dataTransfer.files;
            for (let file of files) {
                if (file.type.startsWith('image/')) {
                    this.handleImageAttach(file);
                }
            }
        });
    }

    handleUpdate(e) {
        this.bindEvents();
        this.renderMarkdown();

        if (this.isHidden()) {
            this.showFloating();
        }

        if (e.detail.target.classList.contains("notes-editor-container")) {
            this.titleEl.focus();
        } else if (e.detail.target.classList.contains("notes-editor-tags")) {
            this.tagsEditor.focusInput();
        }
    }

    renderMarkdown() {
        this.renderedEl.innerHTML = window.zen.renderMarkdown(this.textareaEl.value);
    }

    toggleEditMode() {
        if (this.isEditable()) {
            this.disableEditMode();
        } else {
            this.enableEditMode();
        }
    }

    enableEditMode() {
        if (!this.isEditable()) {
            this.editorEl.classList.add('is-editable');
            this.titleEl.setAttribute('contenteditable', true);
            this.doneButtonEl.style.display = 'block';
            this.editButtonEl.style.display = 'none';
            this.textareaEl.style.height = 'auto'; // Reset the height
            this.textareaEl.style.height = `${this.textareaEl.scrollHeight + 2}px`;
            this.textareaEl.focus();
        }
    }

    disableEditMode() {
        if (this.isEditable()) {
            this.editorEl.classList.remove('is-editable');
            this.titleEl.setAttribute('contenteditable', false);
            this.doneButtonEl.style.display = 'none';
            this.editButtonEl.style.display = 'block';
            this.renderMarkdown();
            this.saveNote();
        }
    }

    hide() {
        this.containerEl.classList.add('is-hidden');
    }

    showFloating() {
        this.containerEl.classList.remove('is-hidden');
        this.containerEl.classList.add('is-floating');
        this.hideButtonEl.style.display = 'block';
    }

    showPinned() {
        this.containerEl.classList.remove('is-hidden');
        this.containerEl.classList.remove('is-floating');
        this.hideButtonEl.style.display = 'none';
    }

    saveNote() {
        const title = this.titleEl.textContent;
        const content = this.textareaEl.value;
        const path = this.noteId ? `/notes/${this.noteId}` : '/notes/';
        const method = this.noteId ? 'PUT' : 'POST';
        const context = {
            target: '.notes-editor-container',
            values: {
                title,
                content,
                tag_ids: this.tagsEditor.currentTagIds
            }
        };

        htmx.ajax(method, path, context);
    }

    isEditable() {
        return this.editorEl.classList.contains('is-editable');
    }

    isHidden() {
        return this.containerEl.classList.contains('is-hidden');
    }

    isFloating() {
        return this.containerEl.classList.contains('is-floating');
    }

    handleImageAttach(file) {
        if (!this.isEditable()) {
            return;
        }

        const reader = new FileReader();
        reader.addEventListener('load', e => {
            const img = document.createElement('img');
            img.src = e.target.result;
            this.imagePreview.appendChild(img);
        });
        reader.readAsDataURL(file);
        this.uploadImage(file);
    }

    async uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch('/images/', {
            method: 'POST',
            body: formData,
            redirect: 'follow'
        });
        const result = await res.json();
        const imageUrl = `![](/images/${result.filename})`;
        this.insertAtCursor(imageUrl);
    }

    insertAtCursor(text) {
        const startPos = this.textareaEl.selectionStart;
        const endPos = this.textareaEl.selectionEnd;
        const beforeText = this.textareaEl.value.substring(0, startPos);
        const afterText = this.textareaEl.value.substring(endPos);

        this.textareaEl.value = beforeText + text + afterText;

        const newPosition = startPos + text.length;
        this.textareaEl.selectionStart = newPosition;
        this.textareaEl.selectionEnd = newPosition;
        this.textareaEl.focus();
    }
}

export class TagsEditor {
    currentTagIds = [];
    selectedTagEl = null;

    constructor(noteId, focusId, containerEl) {
        this.noteId = noteId;
        this.focusId = focusId;
        this.containerEl = containerEl;
        this.inputEl = containerEl.querySelector(".notes-editor-tags-input")
        this.suggestionsListEl = containerEl.querySelector(".dropdown-menu li");

        this.currentTagIds = Array.from(containerEl.querySelectorAll(".tag")).map(tag => parseInt(tag.dataset.tagId, 10));

        this.bindEvents();
    }

    bindEvents() {
        this.inputEl.addEventListener('keyup', (e) => {
            if (e.key === "ArrowDown") {
                const oldSelectedTagEl = this.selectedTagEl;
                if (this.selectedTagEl === null) {
                    this.selectedTagEl = this.suggestionsListEl.firstElementChild;
                } else {
                    const selectedTagId = this.selectedTagEl.dataset.tagId;
                    const nextTag = this.suggestionsListEl.querySelector(`[data-tag-id="${selectedTagId}"]`).nextElementSibling;
                    if (nextTag) {
                        this.selectedTagEl = nextTag;
                    }
                }
                this.selectOption(oldSelectedTagEl, this.selectedTagEl);
                return;
            }

            if (e.key === "ArrowUp") {
                const oldSelectedTagEl = this.selectedTagEl;
                if (this.selectedTagEl === null) {
                    this.selectedTagEl = this.suggestionsListEl.lastElementChild;
                } else {
                    const selectedTagId = this.selectedTagEl.dataset.tagId;
                    const prevTag = this.suggestionsListEl.querySelector(`[data-tag-id="${selectedTagId}"]`).previousElementSibling;
                    if (prevTag) {
                        this.selectedTagEl = prevTag;
                    }
                }
                this.selectOption(oldSelectedTagEl, this.selectedTagEl);
                return;
            }

            if (e.key === "Enter") {
                if (this.selectedTagEl) {
                    this.addTag(this.selectedTagEl.dataset.tagId);
                    this.inputEl.value = '';
                    this.closeSuggestions();
                }
                return;
            }

            if (e.key === "Escape") {
                this.closeSuggestions();
                return;
            }

            this.searchTags(this.inputEl.value);
        });

        this.inputEl.addEventListener('keydown', (e) => {
            if (e.key === "Backspace" && this.inputEl.value === "") {
                this.removeTag(this.currentTagIds[this.currentTagIds.length - 1]);
            }
        });

        this.containerEl.querySelectorAll('.tag svg').forEach(tag => {
            tag.addEventListener('click', (e) => {
                this.removeTag(e.currentTarget.parentElement.dataset.tagId);
            });
        });
    }

    selectOption(oldSelectedTagEl, newSelectedTagEl) {
        if (oldSelectedTagEl) {
            oldSelectedTagEl.classList.remove('is-selected');
        }
        this.selectedTagEl = newSelectedTagEl;
        this.selectedTagEl.classList.add('is-selected');
    }

    focusInput() {
        this.inputEl.focus();
    }

    removeTag(tagId) {
        this.currentTagIds = this.currentTagIds.filter(id => id !== parseInt(tagId, 10));

        let url = ""
        if (this.focusId) {
            url = `/focus/${this.focusId}/tags`;
        } else if (this.noteId) {
            url = `/notes/${this.noteId}/tags`;
        }

        htmx.ajax("PUT", url, {
            target: this.containerEl,
            swap: "outerHTML",
            values: {
                tag_ids: this.currentTagIds
            }
        });
    }

    addTag(tagId) {
        if (tagId === "-1" && this.noteId !== null) {
            htmx.ajax("POST", "/tags/", {
                target: this.containerEl,
                swap: "outerHTML",
                values: {
                    name: this.inputEl.value,
                    note_id: this.noteId,
                    tag_ids: this.currentTagIds
                }
            });
            this.inputEl.value = '';
            this.closeSuggestions();
            return;
        }

        this.currentTagIds.push(tagId);

        let url = ""
        if (this.focusId) {
            url = `/focus/${this.focusId}/tags`;
        } else if (this.noteId) {
            url = `/notes/${this.noteId}/tags`;
        }

        htmx.ajax("PUT", url, {
            target: this.containerEl,
            swap: "outerHTML",
            values: {
                tag_ids: this.currentTagIds
            }
        });
    }

    async searchTags(query) {
        if (query === "") {
            this.closeSuggestions();
            return;
        }
        const res = await fetch(`/tags?query=${query}`)
        const data = await res.json();
        const filteredData = data.filter(tag => !this.currentTagIds.includes(tag.tag_id));
        this.renderSuggestions(filteredData, query);
    }

    closeSuggestions() {
        this.suggestionsListEl.innerHTML = '';
        this.selectedTagEl = null;
    }

    renderSuggestions(tags, query) {
        this.suggestionsListEl.innerHTML = '';
        for (const tag of tags) {
            const option = document.createElement('span');
            option.classList.add('dropdown-option');
            option.dataset.tagId = tag.tag_id;
            option.dataset.tagName = tag.name;
            option.textContent = tag.name;
            this.suggestionsListEl.appendChild(option);
        }

        if (tags.length === 0 && this.noteId !== null) {
            const addNewTagOption = document.createElement('span');
            addNewTagOption.classList.add('dropdown-option');
            addNewTagOption.dataset.tagId = -1;
            addNewTagOption.dataset.tagName = query;
            addNewTagOption.textContent = `Add "${query}"`;
            this.suggestionsListEl.appendChild(addNewTagOption);
        }

        this.selectOption(null, this.suggestionsListEl.firstElementChild);

        this.suggestionsListEl.querySelectorAll('.dropdown-option').forEach(option => {
            option.addEventListener('mouseover', (e) => {
                this.selectOption(this.selectedTagEl, e.currentTarget);
            });
            option.addEventListener('click', (e) => {
                this.addTag(e.currentTarget.dataset.tagId);
            });
        });
    }
}

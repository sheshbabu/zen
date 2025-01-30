class Editor {
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
        this.buttonEl = this.containerEl.querySelector('.notes-editor-toolbar a');

        this.noteId = this.containerEl.firstElementChild.dataset.noteId;
        if (this.noteId === "" || this.noteId === "0") {
            this.noteId = null;
        }

        this.tagsEditor = new TagsEditor(this.noteId, this.containerEl.querySelector('.notes-editor-tags'));

        this.textareaEl.addEventListener('input', () => {
            this.textareaEl.style.height = `${this.textareaEl.scrollHeight}px`;
        });

        this.buttonEl.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleEditMode();
        });
    }

    handleUpdate(e) {
        this.bindEvents();
        this.renderMarkdown();

        if (e.detail.target.classList.contains("notes-editor-container")) {
            this.titleEl.focus();
        } else if (e.detail.target.classList.contains("notes-editor-tags")) {
            this.tagsEditor.focusInput();
        }
    }

    renderMarkdown() {
        const md = window.markdownit({
            linkify: true,
            breaks: true,
            highlight: function (str, lang) {
                if (lang && window.hljs.getLanguage(lang)) {
                    try {
                        return window.hljs.highlight(lang, str).value;
                    } catch (__) { }
                }
                return '';
            }
        });

        // https://github.com/markdown-it/markdown-it/blob/master/docs/architecture.md#renderer
        var defaultRender = md.renderer.rules.link_open || function (tokens, idx, options, env, self) {
            return self.renderToken(tokens, idx, options);
        };
        md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
            tokens[idx].attrSet('target', '_blank');
            return defaultRender(tokens, idx, options, env, self);
        };

        this.renderedEl.innerHTML = md.render(this.textareaEl.value);
    }

    toggleEditMode() {
        if (this.editorEl.classList.contains('is-editable')) {
            this.editorEl.classList.remove('is-editable');
            this.titleEl.setAttribute('contenteditable', false);
            this.renderMarkdown();
            this.buttonEl.innerHTML = 'Edit';
            this.saveNote();
        } else {
            this.editorEl.classList.add('is-editable');
            this.titleEl.setAttribute('contenteditable', true);
            this.textareaEl.style.height = 'auto'; // Reset the height
            this.textareaEl.style.height = `${this.textareaEl.scrollHeight}px`;
            this.textareaEl.focus();
            this.buttonEl.innerHTML = 'Done';
        }
    }

    newNote() {
        console.log('new note');
        htmx.ajax("GET", "/notes/new", {
            target: this.containerEl
        });
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
}

class TagsEditor {
    currentTagIds = [];
    selectedTagEl = null;

    constructor(noteId, containerEl) {
        this.noteId = noteId;
        this.containerEl = containerEl;
        this.inputEl = containerEl.querySelector(".notes-editor-tags-input")
        this.suggestionsListEl = containerEl.querySelector(".dropdown-menu li");

        this.currentTagIds = Array.from(containerEl.querySelectorAll(".tag")).map(tag => parseInt(tag.dataset.tagId, 10));

        this.bindEvents();
    }

    bindEvents() {
        this.inputEl.addEventListener('keyup', (e) => {
            console.log(e.key);
            console.log(this.inputEl.value);

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

        htmx.ajax("PUT", `/notes/${this.noteId}/tags`, {
            target: this.containerEl,
            swap: "outerHTML",
            values: {
                tag_ids: this.currentTagIds
            }
        });
    }

    addTag(tagId) {
        if (tagId === "-1") {
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

        htmx.ajax("PUT", `/notes/${this.noteId}/tags`, {
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
        if (tags.length === 0) {
            const addNewTagOption = document.createElement('span');
            addNewTagOption.classList.add('dropdown-option');
            addNewTagOption.dataset.tagId = -1;
            addNewTagOption.dataset.tagName = query;
            addNewTagOption.textContent = `Add new tag: "${query}"`;
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

export default Editor
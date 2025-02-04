import {Editor, TagsEditor} from "./notes-editor.js";
import Board from "./board.js";

window.zen = {};

let editor = null;
const editorContainerEl = document.querySelector('.notes-editor-container');
const notesListContainerEl = document.querySelector('.notes-list-container');

document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('keyup', (e) => {
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            htmx.ajax("GET", "/notes/new", { target: editorContainerEl }).then(() => {
                initEditor();
            });
            return
        }
    });

    initEditor();
    initNotesGrid();
    initBoard();

    new FocusSwitcher(document.querySelector('.sidebar-focus-switcher'))
})

function initEditor() {
    if (editorContainerEl.innerHTML.trim() === "") {
        return;
    }

    if (editor === null) {
        editor = new Editor(editorContainerEl);
    }

    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            editor.toggleEditMode();
            return
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            if (editor.isFloating()) {
                editor.hide();
            }
            return
        }
    });
}

function initNotesGrid() {
    notesListContainerEl.addEventListener('htmx:afterSwap', () => renderNotesGrid());
    renderNotesGrid()
}

function initBoard() {
    const boardEl = document.querySelector('.notes-grid.board');
    if (boardEl) {
        new Board(boardEl);
    }
    renderNotesGrid()
}


function renderNotesGrid() {
    document.querySelectorAll(".notes-grid-item-content").forEach((el) => {
        el.innerHTML = renderMarkdown(el.dataset.content);
    });
}

function renderMarkdown(text) {
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

    return md.render(text);
}

function setListViewPreference(view) {
    document.cookie = `listViewPreference=${view}; path=/; max-age=31536000`;
    const listViewFragmentUrl = "/notes/" + window.location.search;
    htmx.ajax("GET", listViewFragmentUrl, { target: '.notes-list-container' }).then(() => {
        if (view === 'grid') {
            notesListContainerEl.classList.add('grid');
            editor.hide();
        } else {
            notesListContainerEl.classList.remove('grid');
            editor.showPinned();
        }
    });
}

class FocusSwitcher {
    constructor(containerEl) {
        this.containerEl = containerEl;
        this.buttonEL = this.containerEl.querySelector('.dropdown-button.button');
        this.suggestionsContainerEl = this.containerEl.querySelector(".dropdown-container");
        this.dialogContainerEl = document.querySelector('.dialog-container');
        this.dialogContainerEl.addEventListener('htmx:afterSwap', e => this.handleUpdate(e));

        this.bindEvents();
    }

    bindEvents() {
        this.buttonEL.addEventListener('click', () => {
            if (this.isSuggestionsOpen()) {
                this.closeSuggestions();
            } else {
                this.openSuggestions();
            }
        });
        this.suggestionsContainerEl.querySelectorAll('li').forEach(el => {
            el.addEventListener('click', (e) => {
                this.handleOptionClick(e.currentTarget);
            });
        });
    }

    handleUpdate() {
        this.focusDialog
        this.tagsEditor = new TagsEditor(null, null, this.dialogContainerEl.querySelector('.notes-editor-tags'));
    }

    closeSuggestions() {
        this.suggestionsContainerEl.classList.remove('open');
    }

    openSuggestions() {
        this.suggestionsContainerEl.classList.add('open');
    }

    isSuggestionsOpen() {
        return this.suggestionsContainerEl.classList.contains('open');
    }

    handleOptionClick(optionEl) {
        this.closeSuggestions();
        if (optionEl.textContent === 'Add new...') {
            htmx.ajax("GET", "/focus/new", { target: document.querySelector('.dialog-container') });
        }
    }
}

window.zen.renderMarkdown = renderMarkdown;
window.zen.setListViewPreference = setListViewPreference;
import Editor from "./notes-editor.js";

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
})

function initEditor() {
    if (editorContainerEl.innerHTML.trim() === "") {
        return;
    }

    editor = new Editor(editorContainerEl);

    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            editor.toggleEditMode();
            return
        }
    });
}

function initNotesGrid() {
    notesListContainerEl.addEventListener('htmx:afterSwap', () => renderNotesGrid());
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
    let listViewFragmentUrl = new URL(location.href);
    if (listViewFragmentUrl.pathname === '/') {
        listViewFragmentUrl.pathname = '/notes';
    }
    htmx.ajax("GET", listViewFragmentUrl.href, { target: '.notes-list-container' });
    if (view === 'grid') {
        notesListContainerEl.classList.add('grid');
    } else {
        notesListContainerEl.classList.remove('grid');
    }
}

window.zen = {};
window.zen.renderMarkdown = renderMarkdown;
window.zen.setListViewPreference = setListViewPreference;
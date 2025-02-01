import Editor from "./notes-editor.js";

let editor = null;
const editorContainerEl = document.querySelector('.notes-editor-container');

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
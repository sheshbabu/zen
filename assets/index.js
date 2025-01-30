import Editor from "./notes-editor.js";

let editor = null;

document.addEventListener('DOMContentLoaded', () => {
    editor = new Editor(document.querySelector('.notes-editor-container'));
})

document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        editor.toggleEditMode();
        return
    }
});

document.addEventListener('keyup', (e) => {
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        editor.newNote();
        return
    }
});


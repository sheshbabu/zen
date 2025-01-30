import Editor from "./notes-editor.js";

let editor = null;

document.addEventListener('DOMContentLoaded', () => {
    editor = new Editor(document.querySelector('.notes-editor-container'));

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

    document.addEventListener('paste', (e) => {
        const items = e.clipboardData.items;

        // Ignore if it doesn't contain any images
        if (Array.from(items).every(item => item.type.indexOf('image') === -1)) {
            return;
        }

        e.preventDefault();
        for (let item of items) {
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                editor.handleImageAttach(file);
            }
        }
    });
})

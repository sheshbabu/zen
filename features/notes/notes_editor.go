package notes

import (
	"net/http"
	"zen/commons/templates"
)

func renderNoteEditorFragment(w http.ResponseWriter, editorData Editor) {
	templates.Render(w, "notes_editor", editorData)
}

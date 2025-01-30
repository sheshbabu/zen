package tags

import (
	"net/http"
	"zen/commons/templates"
)

func RenderNoteEditorTagsComponent(w http.ResponseWriter, tagsData []Tag) {
	templates.Render(w, "notes_editor_tags", tagsData)
}

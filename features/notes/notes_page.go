package notes

import (
	"net/http"
	"zen/commons/templates"
	"zen/features/tags"
)

type templateData struct {
	Tags      []tags.Tag
	NotesList NotesList
	Editor    Editor
}

func renderNotesPage(w http.ResponseWriter, allTags []tags.Tag, allNotes []Note, selectedNote Note, isNewNote bool) {
	tmplData := templateData{
		Tags: allTags,
		NotesList: NotesList{
			Title:       "Notes",
			Notes:       allNotes,
			RefreshLink: "/notes",
		},
		Editor: Editor{
			SelectedNote: selectedNote,
			IsNewNote:    isNewNote,
		},
	}

	templates.Render(w, "notes_page.html", tmplData)
}

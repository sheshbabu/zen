package notes

import (
	"net/http"
	"zen/commons/templates"
)

func renderNotesListFragment(w http.ResponseWriter, allNotes []Note, tagName string, refreshLink string) {
	tmplData := NotesList{
		Title:       tagName,
		Notes:       allNotes,
		RefreshLink: refreshLink,
	}

	templates.Render(w, "notes_list", tmplData)
}

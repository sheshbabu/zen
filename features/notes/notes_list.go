package notes

import (
	"net/http"
	"zen/commons/templates"
)

func renderNotesListFragment(w http.ResponseWriter, allNotes []Note, tagName string, refreshLink string, viewPreference string) {
	tmplData := NotesList{
		Title:          tagName,
		Notes:          allNotes,
		RefreshLink:    refreshLink,
		ViewPreference: viewPreference,
	}

	if viewPreference == "list" {
		templates.Render(w, "notes_list", tmplData)
		return
	}

	templates.Render(w, "notes_grid", tmplData)
}

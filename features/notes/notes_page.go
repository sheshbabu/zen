package notes

import (
	"net/http"
	"zen/commons/templates"
	"zen/features/focus"
	"zen/features/tags"
)

type templateData struct {
	Page      string
	Sidebar   Sidebar
	NotesList NotesList
	Editor    Editor
}

func renderNotesPage(w http.ResponseWriter, allTags []tags.Tag, allNotes []Note, allFocusModes []focus.FocusMode, selectedNote Note, isNewNote bool, viewPreference string, page string) {
	tmplData := templateData{
		Page: page,
		Sidebar: Sidebar{
			FocusModes: allFocusModes,
			Tags:       allTags,
		},
		NotesList: NotesList{
			Title:          "Notes",
			Notes:          allNotes,
			RefreshLink:    "/notes",
			ViewPreference: viewPreference,
		},
		Editor: Editor{
			SelectedNote: selectedNote,
			IsNewNote:    isNewNote,
			IsHidden:     viewPreference == "grid",
		},
	}

	templates.Render(w, "notes_page.html", tmplData)
}

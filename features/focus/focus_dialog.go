package focus

import (
	"net/http"
	"zen/commons/components"
	"zen/commons/templates"
	"zen/features/tags"
)

type templateData struct {
	SelectedFocusMode     FocusMode
	SelectedFocusModeTags []tags.Tag
	Input                 components.Input
}

func renderFocusDialog(w http.ResponseWriter, selectedFocusMode FocusMode, selectedFocusModeTags []tags.Tag) {
	tmplData := templateData{
		SelectedFocusMode:     selectedFocusMode,
		SelectedFocusModeTags: selectedFocusModeTags,
		Input: components.Input{
			ID:          "focus-name",
			Label:       "Focus Name",
			Type:        "text",
			Placeholder: "Enter focus name",
			Value:       selectedFocusMode.Name,
			Hint:        "",
			Error:       "",
			IsDisabled:  false,
		},
	}

	templates.Render(w, "focus_dialog", tmplData)
}

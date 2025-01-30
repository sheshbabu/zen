package tags

import (
	"net/http"
	"zen/commons/templates"
)

func renderTagsSuggestionFragment(w http.ResponseWriter, tags []Tag) {
	templates.Render(w, "tags_suggestion", tags)
}

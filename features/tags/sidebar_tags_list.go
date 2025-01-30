package tags

import (
	"net/http"
	"zen/commons/templates"
)

func renderSidebarTagsListFragment(w http.ResponseWriter, tagsData []Tag) {
	templates.Render(w, "sidebar_tags_list", tagsData)
}

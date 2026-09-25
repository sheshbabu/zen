package tags

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"zen/commons/auth"
	"zen/commons/utils"
)

type Tag struct {
	TagID     int    `json:"tagId"`
	Name      string `json:"name"`
	Color     string `json:"color"`
	NoteCount int    `json:"noteCount"`
}

const DefaultTagColor = "gray"

func HandleGetTags(w http.ResponseWriter, r *http.Request) {
	var tags []Tag
	var err error

	query := r.URL.Query().Get("query")
	focusModeIDStr := r.URL.Query().Get("focusId")

	focusModeID := 0
	if focusModeIDStr != "" {
		focusModeID, err = strconv.Atoi(focusModeIDStr)
		if err != nil {
			utils.SendErrorResponse(w, "INVALID_FOCUS_ID", "Invalid focus mode ID", err, http.StatusBadRequest)
			return
		}
	}

	access := auth.GetAccess(r.Context())

	if focusModeID != 0 {
		tags, err = GetTagsByFocusModeID(access, focusModeID)
	} else if query != "" {
		tags, err = SearchTags(access, query)
	} else {
		tags, err = GetAllTags(access)
	}

	if err != nil {
		utils.SendErrorResponse(w, "TAGS_FETCH_FAILED", "Error fetching tags.", err, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tags)
}

func HandleUpdateTag(w http.ResponseWriter, r *http.Request) {
	var tag Tag
	if err := json.NewDecoder(r.Body).Decode(&tag); err != nil {
		utils.SendErrorResponse(w, "INVALID_REQUEST_BODY", "Invalid request data", err, http.StatusBadRequest)
		return
	}

	if tag.Color == "" {
		tag.Color = DefaultTagColor
	}

	if code, message, err := isValid(tag); err != nil {
		slog.Error(err.Error())
		utils.SendErrorResponse(w, code, message, err, http.StatusBadRequest)
		return
	}

	if err := UpdateTag(tag); err != nil {
		utils.SendErrorResponse(w, "TAG_UPDATE_FAILED", "Error updating tag.", err, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func HandleDeleteTag(w http.ResponseWriter, r *http.Request) {
	tagIDStr := r.PathValue("tagId")
	tagID, err := strconv.Atoi(tagIDStr)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_TAG_ID", "Invalid tag ID", err, http.StatusBadRequest)
		return
	}

	if err := DeleteTag(tagID); err != nil {
		utils.SendErrorResponse(w, "TAG_DELETE_FAILED", "Error deleting tag.", err, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func isValid(tag Tag) (string, string, error) {
	validTagColors := map[string]bool{
		"gray":   true,
		"red":    true,
		"orange": true,
		"yellow": true,
		"green":  true,
		"teal":   true,
		"blue":   true,
		"purple": true,
		"pink":   true,
	}

	if strings.TrimSpace(tag.Name) == "" {
		return "INVALID_TAG_NAME", "Tag name cannot be empty", errors.New("tag name cannot be empty")
	}

	if !validTagColors[tag.Color] {
		return "INVALID_TAG_COLOR", "Invalid tag color", fmt.Errorf("invalid tag color: %s", tag.Color)
	}

	return "", "", nil
}

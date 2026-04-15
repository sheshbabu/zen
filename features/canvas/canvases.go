package canvas

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"
	"zen/commons/utils"
)

type Canvas struct {
	CanvasID  int       `json:"canvasId"`
	Title     string    `json:"title"`
	Data      string    `json:"data,omitempty"`
	Preview   string    `json:"preview"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func HandleGetCanvases(w http.ResponseWriter, r *http.Request) {
	canvases, err := GetAllCanvases()
	if err != nil {
		utils.SendErrorResponse(w, "CANVASES_READ_FAILED", "Error fetching canvases.", err, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(canvases)
}

func HandleGetCanvas(w http.ResponseWriter, r *http.Request) {
	canvasIDStr := r.PathValue("canvasId")
	canvasID, err := strconv.Atoi(canvasIDStr)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_CANVAS_ID", "Invalid canvas ID", err, http.StatusBadRequest)
		return
	}

	canvas, err := GetCanvasByID(canvasID)
	if err != nil {
		utils.SendErrorResponse(w, "CANVAS_READ_FAILED", "Error fetching canvas.", err, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(canvas)
}

func HandleCreateCanvas(w http.ResponseWriter, r *http.Request) {
	var canvas Canvas
	if err := json.NewDecoder(r.Body).Decode(&canvas); err != nil {
		utils.SendErrorResponse(w, "INVALID_REQUEST_BODY", "Invalid request data", err, http.StatusBadRequest)
		return
	}

	if err := CreateCanvas(&canvas); err != nil {
		utils.SendErrorResponse(w, "CANVAS_CREATE_FAILED", "Error creating canvas.", err, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(canvas)
}

func HandleUpdateCanvas(w http.ResponseWriter, r *http.Request) {
	canvasIDStr := r.PathValue("canvasId")
	canvasID, err := strconv.Atoi(canvasIDStr)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_CANVAS_ID", "Invalid canvas ID", err, http.StatusBadRequest)
		return
	}

	var canvas Canvas
	if err := json.NewDecoder(r.Body).Decode(&canvas); err != nil {
		utils.SendErrorResponse(w, "INVALID_REQUEST_BODY", "Invalid request data", err, http.StatusBadRequest)
		return
	}

	canvas.CanvasID = canvasID

	if err := UpdateCanvas(&canvas); err != nil {
		utils.SendErrorResponse(w, "CANVAS_UPDATE_FAILED", "Error updating canvas.", err, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(canvas)
}

func HandleDeleteCanvas(w http.ResponseWriter, r *http.Request) {
	canvasIDStr := r.PathValue("canvasId")
	canvasID, err := strconv.Atoi(canvasIDStr)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_CANVAS_ID", "Invalid canvas ID", err, http.StatusBadRequest)
		return
	}

	if err := DeleteCanvas(canvasID); err != nil {
		utils.SendErrorResponse(w, "CANVAS_DELETE_FAILED", "Error deleting canvas.", err, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

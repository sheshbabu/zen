package images

import (
	"encoding/json"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"
	"zen/commons/utils"
)

const IMAGES_LIMIT = 100

type ImagesResponseEnvelope struct {
	Images []Image `json:"images"`
	Total  int     `json:"total"`
}

type Image struct {
	Filename    string    `json:"filename"`
	Width       int       `json:"width"`
	Height      int       `json:"height"`
	Format      string    `json:"format"`
	AspectRatio float64   `json:"aspectRatio"`
	FileSize    int64     `json:"fileSize"`
	Caption     *string   `json:"caption"`
	CreatedAt   time.Time `json:"createdAt"`
}

type ImageRecord struct {
	Filename    string
	Width       int
	Height      int
	Format      string
	AspectRatio float64
	FileSize    int64
	Caption     *string
}

type ImageInfo struct {
	Width       int
	Height      int
	Format      string
	AspectRatio float64
}

type ImagesFilter struct {
	page        int
	tagID       int
	focusModeID int
}

func NewImagesFilter() ImagesFilter {
	return ImagesFilter{
		page:        1,
		tagID:       0,
		focusModeID: 0,
	}
}

func HandleGetImages(w http.ResponseWriter, r *http.Request) {
	var allImages []Image
	var err error
	var total int

	pageStr := r.URL.Query().Get("page")
	tagIDStr := r.URL.Query().Get("tagId")
	focusModeIDStr := r.URL.Query().Get("focusId")

	page := 1
	tagID := 0
	focusModeID := 0

	if pageStr != "" {
		page, err = strconv.Atoi(pageStr)
		if err != nil {
			utils.SendErrorResponse(w, "INVALID_PAGE_NUMBER", "Invalid page number", err, http.StatusBadRequest)
			return
		}
	}

	if tagIDStr != "" {
		tagID, err = strconv.Atoi(tagIDStr)
		if err != nil {
			utils.SendErrorResponse(w, "INVALID_TAG_ID", "Invalid tag ID", err, http.StatusBadRequest)
			return
		}
	}

	if focusModeIDStr != "" {
		focusModeID, err = strconv.Atoi(focusModeIDStr)
		if err != nil {
			utils.SendErrorResponse(w, "INVALID_FOCUS_ID", "Invalid focus mode ID", err, http.StatusBadRequest)
			return
		}
	}

	filter := ImagesFilter{
		page:        page,
		tagID:       tagID,
		focusModeID: focusModeID,
	}

	allImages, total, err = GetAllImages(filter)

	if err != nil {
		utils.SendErrorResponse(w, "IMAGES_READ_FAILED", "Error fetching images.", err, http.StatusInternalServerError)
		return
	}

	response := ImagesResponseEnvelope{
		Images: allImages,
		Total:  total,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func HandleUploadImage(w http.ResponseWriter, r *http.Request) {
	err := r.ParseMultipartForm(10 << 20) // Max 10MB
	if err != nil {
		err = fmt.Errorf("error parsing image: %w", err)
		utils.SendErrorResponse(w, "INVALID_IMAGE", "Invalid image file", err, http.StatusBadRequest)
		return
	}

	file, handler, err := r.FormFile("image")
	if err != nil {
		err = fmt.Errorf("error parsing image: %w", err)
		utils.SendErrorResponse(w, "INVALID_IMAGE", "Invalid image file", err, http.StatusBadRequest)
		return
	}
	defer file.Close()

	imageInfo, err := getImageInfo(file, handler.Filename)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_IMAGE", "Invalid image format", err, http.StatusBadRequest)
		return
	}

	if _, err := file.Seek(0, 0); err != nil {
		err = fmt.Errorf("error resetting file pointer: %w", err)
		utils.SendErrorResponse(w, "IMAGE_UPLOAD_FAILED", "Error processing image", err, http.StatusInternalServerError)
		return
	}

	filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), filepath.Ext(handler.Filename))
	filepath := filepath.Join("images", filename)

	dst, err := os.Create(filepath)
	if err != nil {
		err = fmt.Errorf("error creating image file: %w", err)
		utils.SendErrorResponse(w, "IMAGE_CREATE_FAILED", "Error creating image file.", err, http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	bytesWritten, err := io.Copy(dst, file)
	if err != nil {
		err = fmt.Errorf("error uploading image file: %w", err)
		utils.SendErrorResponse(w, "IMAGE_UPLOAD_FAILED", "Error uploading image.", err, http.StatusInternalServerError)
		return
	}

	imageRecord := ImageRecord{
		Filename:    filename,
		Width:       imageInfo.Width,
		Height:      imageInfo.Height,
		Format:      imageInfo.Format,
		AspectRatio: imageInfo.AspectRatio,
		FileSize:    bytesWritten,
		Caption:     nil,
	}

	image, err := CreateImage(imageRecord)
	if err != nil {
		err = fmt.Errorf("error creating image record: %w", err)
		utils.SendErrorResponse(w, "IMAGE_CREATE_FAILED", "Error saving image.", err, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(image)
}

func getImageInfo(file io.Reader, filename string) (*ImageInfo, error) {
	img, format, err := image.Decode(file)
	if err != nil {
		return nil, fmt.Errorf("error decoding image: %w", err)
	}

	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()
	aspectRatio := float64(width) / float64(height)

	info := &ImageInfo{
		Width:       width,
		Height:      height,
		Format:      format,
		AspectRatio: aspectRatio,
	}

	return info, nil
}

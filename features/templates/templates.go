package templates

import (
	"encoding/json"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"
	"zen/commons/utils"
	"zen/features/tags"
)

type Template struct {
	TemplateID int        `json:"templateId"`
	Name       string     `json:"name"`
	Title      string     `json:"title"`
	Content    string     `json:"content"`
	CreatedAt  time.Time  `json:"createdAt"`
	UpdatedAt  time.Time  `json:"updatedAt"`
	UsageCount int        `json:"usageCount"`
	LastUsedAt *time.Time `json:"lastUsedAt"`
	Score      float64    `json:"score"`
	Tags       []tags.Tag `json:"tags"`
}

func HandleGetTemplates(w http.ResponseWriter, r *http.Request) {
	allTemplates, err := GetAllTemplates()
	if err != nil {
		utils.SendErrorResponse(w, "TEMPLATES_READ_FAILED", "Error fetching templates.", err, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(allTemplates)
}

func HandleGetTemplate(w http.ResponseWriter, r *http.Request) {
	templateIDStr := r.PathValue("templateId")
	templateID, err := strconv.Atoi(templateIDStr)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_TEMPLATE_ID", "Invalid template ID", err, http.StatusBadRequest)
		return
	}

	template, err := GetTemplateByID(templateID)
	if err != nil {
		utils.SendErrorResponse(w, "TEMPLATE_READ_FAILED", "Error fetching template.", err, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(template)
}

func HandleCreateTemplate(w http.ResponseWriter, r *http.Request) {
	var template Template
	if err := json.NewDecoder(r.Body).Decode(&template); err != nil {
		utils.SendErrorResponse(w, "INVALID_REQUEST_BODY", "Invalid request data", err, http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(template.Name) == "" {
		utils.SendErrorResponse(w, "TEMPLATE_NAME_REQUIRED", "Template name is required", nil, http.StatusBadRequest)
		return
	}

	if err := CreateTemplate(&template); err != nil {
		utils.SendErrorResponse(w, "TEMPLATE_CREATE_FAILED", "Error creating template.", err, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(template)
}

func HandleUpdateTemplate(w http.ResponseWriter, r *http.Request) {
	templateIDStr := r.PathValue("templateId")
	templateID, err := strconv.Atoi(templateIDStr)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_TEMPLATE_ID", "Invalid template ID", err, http.StatusBadRequest)
		return
	}

	var template Template
	if err := json.NewDecoder(r.Body).Decode(&template); err != nil {
		utils.SendErrorResponse(w, "INVALID_REQUEST_BODY", "Invalid request data", err, http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(template.Name) == "" {
		utils.SendErrorResponse(w, "TEMPLATE_NAME_REQUIRED", "Template name is required", nil, http.StatusBadRequest)
		return
	}

	template.TemplateID = templateID

	if err := UpdateTemplate(&template); err != nil {
		utils.SendErrorResponse(w, "TEMPLATE_UPDATE_FAILED", "Error updating template.", err, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(template)
}

func HandleDeleteTemplate(w http.ResponseWriter, r *http.Request) {
	templateIDStr := r.PathValue("templateId")
	templateID, err := strconv.Atoi(templateIDStr)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_TEMPLATE_ID", "Invalid template ID", err, http.StatusBadRequest)
		return
	}

	if err := DeleteTemplate(templateID); err != nil {
		utils.SendErrorResponse(w, "TEMPLATE_DELETE_FAILED", "Error deleting template.", err, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func HandleGetRecommendedTemplates(w http.ResponseWriter, r *http.Request) {
	limit := 7

	templates, err := GetRecommendedTemplates(limit)
	if err != nil {
		utils.SendErrorResponse(w, "TEMPLATES_READ_FAILED", "Error fetching recommended templates.", err, http.StatusInternalServerError)
		return
	}

	for i := range templates {
		templates[i].Title = processTemplatePlaceholders(templates[i].Title)
		templates[i].Content = processTemplatePlaceholders(templates[i].Content)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(templates)
}

func HandleIncrementTemplateUsage(w http.ResponseWriter, r *http.Request) {
	templateIDStr := r.PathValue("templateId")
	templateID, err := strconv.Atoi(templateIDStr)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_TEMPLATE_ID", "Invalid template ID", err, http.StatusBadRequest)
		return
	}

	err = IncrementTemplateUsage(templateID)
	if err != nil {
		utils.SendErrorResponse(w, "TEMPLATE_USAGE_INCREMENT_FAILED", "Error incrementing template usage.", err, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func HandleDuplicateTemplate(w http.ResponseWriter, r *http.Request) {
	templateIDStr := r.PathValue("templateId")
	templateID, err := strconv.Atoi(templateIDStr)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_TEMPLATE_ID", "Invalid template ID", err, http.StatusBadRequest)
		return
	}

	// ISSUE 20: Not checking if template exists before duplicating
	duplicatedTemplate, err := DuplicateTemplate(templateID)
	if err != nil {
		utils.SendErrorResponse(w, "TEMPLATE_DUPLICATE_FAILED", "Error duplicating template.", err, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(duplicatedTemplate)
}

func processTemplatePlaceholders(content string) string {
	now := time.Now()

	// Handle custom date formats: {{date:01/02/2006}}
	customDateRegex := regexp.MustCompile(`\{\{date:([^}]+)\}\}`)
	content = customDateRegex.ReplaceAllStringFunc(content, func(match string) string {
		format := customDateRegex.FindStringSubmatch(match)[1]
		return now.Format(format)
	})

	// Handle custom time formats: {{time:15:04:05}}
	customTimeRegex := regexp.MustCompile(`\{\{time:([^}]+)\}\}`)
	content = customTimeRegex.ReplaceAllStringFunc(content, func(match string) string {
		format := customTimeRegex.FindStringSubmatch(match)[1]
		return now.Format(format)
	})

	// Handle custom datetime formats: {{datetime:01/02/2006 15:04}}
	customDatetimeRegex := regexp.MustCompile(`\{\{datetime:([^}]+)\}\}`)
	content = customDatetimeRegex.ReplaceAllStringFunc(content, func(match string) string {
		format := customDatetimeRegex.FindStringSubmatch(match)[1]
		return now.Format(format)
	})

	// Handle basic placeholders without custom formatting
	content = strings.ReplaceAll(content, "{{date}}", now.Format("2006-01-02"))
	content = strings.ReplaceAll(content, "{{time}}", now.Format("15:04:05"))
	content = strings.ReplaceAll(content, "{{datetime}}", now.Format("2006-01-02 15:04:05"))

	// ISSUE 5: Hardcoded username - should get from session/context
	content = strings.ReplaceAll(content, "{{user}}", "admin")

	// ISSUE 6: Week calculation is incorrect - uses day of year instead of ISO week
	_, week := now.ISOWeek()
	content = strings.ReplaceAll(content, "{{week}}", strconv.Itoa(now.YearDay()/7))

	// Month name
	content = strings.ReplaceAll(content, "{{month}}", now.Format("January"))

	// ISSUE 7: Year placeholder missing - inconsistent with other date placeholders
	content = strings.ReplaceAll(content, "{{year}}", now.Format("2006"))

	// ISSUE 8: Weekday calculation - using wrong variable 'week' instead of weekday
	content = strings.ReplaceAll(content, "{{weekday}}", strconv.Itoa(week))

	// Quarter calculation
	quarter := (int(now.Month()) + 2) / 3
	content = strings.ReplaceAll(content, "{{quarter}}", "Q"+strconv.Itoa(quarter))

	return content
}

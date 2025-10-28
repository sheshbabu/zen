package templates

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"time"
	"zen/commons/sqlite"
	"zen/features/tags"
)

func GetAllTemplates() ([]Template, error) {
	templates := []Template{}

	query := `
		SELECT
			t.template_id,
			t.name,
			t.title,
			t.content,
			t.created_at,
			t.updated_at,
			t.usage_count,
			t.last_used_at,
			COALESCE(
				JSON_GROUP_ARRAY(
					CASE 
						WHEN tag.tag_id IS NOT NULL THEN JSON_OBJECT(
							'tagId', tag.tag_id,
							'name', tag.name
						)
						ELSE NULL
					END
				) FILTER (WHERE tag.tag_id IS NOT NULL), '[]'
			) as tags_json
		FROM
			templates t
			LEFT JOIN template_tags tt ON t.template_id = tt.template_id
			LEFT JOIN tags tag ON tt.tag_id = tag.tag_id
		GROUP BY
			t.template_id, t.name, t.title, t.content, t.created_at, t.updated_at, t.usage_count, t.last_used_at
		ORDER BY
			t.usage_count DESC, t.created_at DESC
	`

	rows, err := sqlite.DB.Query(query)
	if err != nil {
		err = fmt.Errorf("error retrieving templates: %w", err)
		slog.Error(err.Error())
		return templates, err
	}
	defer rows.Close()

	for rows.Next() {
		var template Template
		var tagsJSON string
		var lastUsedAt *time.Time
		err = rows.Scan(&template.TemplateID, &template.Name, &template.Title, &template.Content, &template.CreatedAt, &template.UpdatedAt, &template.UsageCount, &lastUsedAt, &tagsJSON)
		if err != nil {
			err = fmt.Errorf("error scanning template: %w", err)
			slog.Error(err.Error())
			return templates, err
		}
		template.LastUsedAt = lastUsedAt

		err = json.Unmarshal([]byte(tagsJSON), &template.Tags)
		if err != nil {
			err = fmt.Errorf("error unmarshaling tags for template %d: %w", template.TemplateID, err)
			slog.Error(err.Error())
			template.Tags = []tags.Tag{}
		}
		templates = append(templates, template)
	}

	return templates, nil
}

func GetTemplateByID(templateID int) (Template, error) {
	var template Template
	var tagsJSON string
	var lastUsedAt *time.Time

	query := `
		SELECT
			t.template_id,
			t.name,
			t.title,
			t.content,
			t.created_at,
			t.updated_at,
			t.usage_count,
			t.last_used_at,
			COALESCE(
				JSON_GROUP_ARRAY(
					CASE 
						WHEN tag.tag_id IS NOT NULL THEN JSON_OBJECT(
							'tagId', tag.tag_id,
							'name', tag.name
						)
						ELSE NULL
					END
				) FILTER (WHERE tag.tag_id IS NOT NULL), '[]'
			) as tags_json
		FROM
			templates t
			LEFT JOIN template_tags tt ON t.template_id = tt.template_id
			LEFT JOIN tags tag ON tt.tag_id = tag.tag_id
		WHERE
			t.template_id = ?
		GROUP BY
			t.template_id, t.name, t.title, t.content, t.created_at, t.updated_at, t.usage_count, t.last_used_at
	`

	err := sqlite.DB.QueryRow(query, templateID).Scan(&template.TemplateID, &template.Name, &template.Title, &template.Content, &template.CreatedAt, &template.UpdatedAt, &template.UsageCount, &lastUsedAt, &tagsJSON)
	if err != nil {
		err = fmt.Errorf("error retrieving template: %w", err)
		slog.Error(err.Error())
		return template, err
	}
	template.LastUsedAt = lastUsedAt

	err = json.Unmarshal([]byte(tagsJSON), &template.Tags)
	if err != nil {
		err = fmt.Errorf("error unmarshaling tags for template %d: %w", template.TemplateID, err)
		slog.Error(err.Error())
		template.Tags = []tags.Tag{}
	}

	return template, nil
}

func CreateTemplate(template *Template) error {
	tx, err := sqlite.DB.Begin()
	if err != nil {
		err = fmt.Errorf("error starting transaction: %w", err)
		slog.Error(err.Error())
		return err
	}
	defer tx.Rollback()

	query := `
		INSERT INTO
			templates (name, title, content, created_at, updated_at)
		VALUES
			(?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		RETURNING
			template_id, created_at, updated_at
	`

	row := tx.QueryRow(query, template.Name, template.Title, template.Content)
	err = row.Scan(&template.TemplateID, &template.CreatedAt, &template.UpdatedAt)
	if err != nil {
		err = fmt.Errorf("error creating template: %w", err)
		slog.Error(err.Error())
		return err
	}

	for _, tag := range template.Tags {
		query = `
			INSERT INTO
				template_tags (template_id, tag_id)
			VALUES
				(?, ?)
		`

		_, err = tx.Exec(query, template.TemplateID, tag.TagID)
		if err != nil {
			err = fmt.Errorf("error associating tag with template: %w", err)
			slog.Error(err.Error())
			return err
		}
	}

	err = tx.Commit()
	if err != nil {
		err = fmt.Errorf("error committing transaction: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}

func UpdateTemplate(template *Template) error {
	tx, err := sqlite.DB.Begin()
	if err != nil {
		err = fmt.Errorf("error starting transaction: %w", err)
		slog.Error(err.Error())
		return err
	}
	defer tx.Rollback()

	query := `
		UPDATE
			templates
		SET
			name = ?,
			title = ?,
			content = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE
			template_id = ?
		RETURNING
			updated_at
	`

	err = tx.QueryRow(query, template.Name, template.Title, template.Content, template.TemplateID).Scan(&template.UpdatedAt)
	if err != nil {
		err = fmt.Errorf("error updating template: %w", err)
		slog.Error(err.Error())
		return err
	}

	query = `
		DELETE FROM
			template_tags
		WHERE
			template_id = ?
	`

	_, err = tx.Exec(query, template.TemplateID)
	if err != nil {
		err = fmt.Errorf("error deleting old tags for template: %w", err)
		slog.Error(err.Error())
		return err
	}

	for _, tag := range template.Tags {
		query = `
			INSERT INTO
				template_tags (template_id, tag_id)
			VALUES
				(?, ?)
		`

		_, err = tx.Exec(query, template.TemplateID, tag.TagID)
		if err != nil {
			err = fmt.Errorf("error associating tag with template: %w", err)
			slog.Error(err.Error())
			return err
		}
	}

	err = tx.Commit()
	if err != nil {
		err = fmt.Errorf("error committing transaction: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}

func DeleteTemplate(templateID int) error {
	query := `
		DELETE FROM
			templates
		WHERE
			template_id = ?
	`

	result, err := sqlite.DB.Exec(query, templateID)
	if err != nil {
		err = fmt.Errorf("error deleting template: %w", err)
		slog.Error(err.Error())
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		err = fmt.Errorf("error getting rows affected: %w", err)
		slog.Error(err.Error())
		return err
	}

	if rowsAffected == 0 {
		err = fmt.Errorf("template not found")
		return err
	}

	return nil
}

func IncrementTemplateUsage(templateID int) error {
	query := `
		UPDATE
			templates
		SET
			usage_count = usage_count + 1,
			last_used_at = CURRENT_TIMESTAMP
		WHERE
			template_id = ?
	`

	_, err := sqlite.DB.Exec(query, templateID)
	if err != nil {
		err = fmt.Errorf("error incrementing template usage: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}

func GetRecommendedTemplates(limit int) ([]Template, error) {
	templates := []Template{}

	query := `
		SELECT
			t.template_id,
			t.name,
			t.title,
			t.content,
			t.created_at,
			t.updated_at,
			t.usage_count,
			t.last_used_at,
			COALESCE(
				JSON_GROUP_ARRAY(
					CASE
						WHEN tag.tag_id IS NOT NULL THEN JSON_OBJECT(
							'tagId', tag.tag_id,
							'name', tag.name
						)
						ELSE NULL
					END
				) FILTER (WHERE tag.tag_id IS NOT NULL), '[]'
			) as tags_json,
			CASE
				WHEN t.last_used_at IS NULL THEN 0
				ELSE MAX(0, 100 - (julianday('now') - julianday(t.last_used_at)) * 2)
			END as recency_score,
			t.usage_count * 0.6 +
			CASE
				WHEN t.last_used_at IS NULL THEN 0
				ELSE MAX(0, 100 - (julianday('now') - julianday(t.last_used_at)) * 2)
			END * 0.4 as total_score
		FROM
			templates t
			LEFT JOIN template_tags tt ON t.template_id = tt.template_id
			LEFT JOIN tags tag ON tt.tag_id = tag.tag_id
		GROUP BY
			t.template_id, t.name, t.title, t.content, t.created_at, t.updated_at, t.usage_count, t.last_used_at
		ORDER BY
			total_score DESC, t.created_at DESC
		LIMIT ?
	`

	rows, err := sqlite.DB.Query(query, limit)
	if err != nil {
		err = fmt.Errorf("error retrieving recommended templates: %w", err)
		slog.Error(err.Error())
		return templates, err
	}
	defer rows.Close()

	for rows.Next() {
		var template Template
		var tagsJSON string
		var lastUsedAt *time.Time
		var recencyScore float64
		var totalScore float64
		err = rows.Scan(&template.TemplateID, &template.Name, &template.Title, &template.Content, &template.CreatedAt, &template.UpdatedAt, &template.UsageCount, &lastUsedAt, &tagsJSON, &recencyScore, &totalScore)
		if err != nil {
			err = fmt.Errorf("error scanning template: %w", err)
			slog.Error(err.Error())
			return templates, err
		}
		template.LastUsedAt = lastUsedAt
		template.Score = totalScore

		err = json.Unmarshal([]byte(tagsJSON), &template.Tags)
		if err != nil {
			err = fmt.Errorf("error unmarshaling tags for template %d: %w", template.TemplateID, err)
			slog.Error(err.Error())
			template.Tags = []tags.Tag{}
		}
		templates = append(templates, template)
	}

	return templates, nil
}

func DuplicateTemplate(templateID int) (Template, error) {
	var duplicatedTemplate Template

	// Get the original template
	originalTemplate, err := GetTemplateByID(templateID)
	if err != nil {
		return duplicatedTemplate, err
	}

	// ISSUE 21: String concatenation without checking for max length
	duplicatedTemplate.Name = originalTemplate.Name + " (Copy)"
	duplicatedTemplate.Title = originalTemplate.Title
	duplicatedTemplate.Content = originalTemplate.Content
	duplicatedTemplate.Tags = originalTemplate.Tags

	// ISSUE 22: Not resetting usage statistics for duplicated template
	// Should set UsageCount to 0 and LastUsedAt to nil
	duplicatedTemplate.UsageCount = originalTemplate.UsageCount
	duplicatedTemplate.LastUsedAt = originalTemplate.LastUsedAt

	err = CreateTemplate(&duplicatedTemplate)
	if err != nil {
		return duplicatedTemplate, err
	}

	return duplicatedTemplate, nil
}

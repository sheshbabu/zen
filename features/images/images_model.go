package images

import (
	"fmt"
	"log/slog"
	"zen/commons/sqlite"
)

func GetAllImages(filter ImagesFilter) ([]Image, int, error) {
	images := []Image{}
	total := 0
	offset := (filter.page - 1) * IMAGES_LIMIT

	var query string
	var queryArgs []interface{}

	if filter.tagID != 0 {
		query = `
			SELECT
				i.filename,
				i.width,
				i.height,
				i.format,
				i.aspect_ratio,
				i.file_size,
				i.caption,
				i.created_at,
				COUNT(*) OVER() as total_count
			FROM
				images i
			INNER JOIN
				note_images ni ON i.filename = ni.filename
			INNER JOIN
				note_tags nt ON ni.note_id = nt.note_id
			WHERE
				nt.tag_id = ?
			GROUP BY
				i.filename
			ORDER BY
				i.created_at DESC
			LIMIT
				?
			OFFSET
				?
		`
		queryArgs = []interface{}{filter.tagID, IMAGES_LIMIT, offset}
	} else if filter.focusModeID != 0 {
		query = `
			SELECT
				i.filename,
				i.width,
				i.height,
				i.format,
				i.aspect_ratio,
				i.file_size,
				i.caption,
				i.created_at,
				COUNT(*) OVER() as total_count
			FROM
				focus_mode_tags fmt
			JOIN
				note_tags nt ON fmt.tag_id = nt.tag_id
			JOIN
				note_images ni ON nt.note_id = ni.note_id
			JOIN
				images i ON ni.filename = i.filename
			WHERE
				fmt.focus_mode_id = ?
			GROUP BY
				i.filename
			ORDER BY
				i.created_at DESC
			LIMIT
				?
			OFFSET
				?
		`
		queryArgs = []interface{}{filter.focusModeID, IMAGES_LIMIT, offset}
	} else {
		query = `
			SELECT
				filename,
				width,
				height,
				format,
				aspect_ratio,
				file_size,
				caption,
				created_at,
				COUNT(*) OVER() as total_count
			FROM
				images
			ORDER BY
				created_at DESC
			LIMIT
				?
			OFFSET
				?
		`
		queryArgs = []interface{}{IMAGES_LIMIT, offset}
	}

	rows, err := sqlite.DB.Query(query, queryArgs...)
	if err != nil {
		err = fmt.Errorf("error retrieving images: %w", err)
		slog.Error(err.Error())
		return images, total, err
	}
	defer rows.Close()

	for rows.Next() {
		var image Image
		err = rows.Scan(
			&image.Filename,
			&image.Width,
			&image.Height,
			&image.Format,
			&image.AspectRatio,
			&image.FileSize,
			&image.Caption,
			&image.CreatedAt,
			&total,
		)
		if err != nil {
			err = fmt.Errorf("error scanning image: %w", err)
			slog.Error(err.Error())
			return images, total, err
		}
		images = append(images, image)
	}

	return images, total, nil
}

func CreateImage(imageRecord ImageRecord) (Image, error) {
	query := `
		INSERT INTO images (
			filename,
			width,
			height,
			format,
			aspect_ratio,
			file_size,
			caption
		) VALUES (?, ?, ?, ?, ?, ?, ?)
	`

	_, err := sqlite.DB.Exec(
		query,
		imageRecord.Filename,
		imageRecord.Width,
		imageRecord.Height,
		imageRecord.Format,
		imageRecord.AspectRatio,
		imageRecord.FileSize,
		imageRecord.Caption,
	)

	if err != nil {
		err = fmt.Errorf("error inserting image: %w", err)
		slog.Error(err.Error())
		return Image{}, err
	}

	// Query the inserted image to get the timestamps
	var image Image
	selectQuery := `
		SELECT
			filename,
			width,
			height,
			format,
			aspect_ratio,
			file_size,
			caption,
			created_at
		FROM images
		WHERE filename = ?
	`

	err = sqlite.DB.QueryRow(selectQuery, imageRecord.Filename).Scan(
		&image.Filename,
		&image.Width,
		&image.Height,
		&image.Format,
		&image.AspectRatio,
		&image.FileSize,
		&image.Caption,
		&image.CreatedAt,
	)

	if err != nil {
		err = fmt.Errorf("error retrieving created image: %w", err)
		slog.Error(err.Error())
		return Image{}, err
	}

	return image, nil
}

func DeleteImage(filename string) error {
	query := "DELETE FROM images WHERE filename = ?"

	_, err := sqlite.DB.Exec(query, filename)
	if err != nil {
		err = fmt.Errorf("error deleting image: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}

func LinkImageToNote(noteID int, filename string) error {
	query := `
		INSERT OR IGNORE INTO note_images (note_id, filename)
		VALUES (?, ?)
	`

	_, err := sqlite.DB.Exec(query, noteID, filename)
	if err != nil {
		err = fmt.Errorf("error linking image to note: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}

func UnlinkImageFromNote(noteID int, filename string) error {
	query := "DELETE FROM note_images WHERE note_id = ? AND filename = ?"

	_, err := sqlite.DB.Exec(query, noteID, filename)
	if err != nil {
		err = fmt.Errorf("error unlinking image from note: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}

func GetOrphanedImages() ([]Image, error) {
	images := []Image{}
	query := `
		SELECT
			i.filename,
			i.width,
			i.height,
			i.format,
			i.aspect_ratio,
			i.file_size,
			i.caption,
			i.created_at
		FROM
			images i
		LEFT JOIN
			note_images ni ON i.filename = ni.filename
		WHERE
			ni.filename IS NULL
	`

	rows, err := sqlite.DB.Query(query)
	if err != nil {
		err = fmt.Errorf("error retrieving orphaned images: %w", err)
		slog.Error(err.Error())
		return images, err
	}
	defer rows.Close()

	for rows.Next() {
		var image Image
		err = rows.Scan(
			&image.Filename,
			&image.Width,
			&image.Height,
			&image.Format,
			&image.AspectRatio,
			&image.FileSize,
			&image.Caption,
			&image.CreatedAt,
		)
		if err != nil {
			err = fmt.Errorf("error scanning orphaned image: %w", err)
			slog.Error(err.Error())
			return images, err
		}
		images = append(images, image)
	}

	return images, nil
}

func GetLinkedNotesByImage(filename string) ([]int, error) {
	var noteIDs []int
	query := "SELECT note_id FROM note_images WHERE filename = ?"

	rows, err := sqlite.DB.Query(query, filename)
	if err != nil {
		return nil, fmt.Errorf("error querying note_images: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var noteID int
		err = rows.Scan(&noteID)
		if err != nil {
			return nil, fmt.Errorf("error scanning note_id: %w", err)
		}
		noteIDs = append(noteIDs, noteID)
	}

	return noteIDs, nil
}

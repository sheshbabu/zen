package images

import (
	"bytes"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"os"
	"path/filepath"

	"golang.org/x/image/draw"
	_ "golang.org/x/image/webp"
)

type ResizeOptions struct {
	MaxSize int
	Quality int
}

func ResizeImage(filename string, options ResizeOptions) ([]byte, error) {
	filepath := filepath.Join("images", filename)
	file, err := os.Open(filepath)
	if err != nil {
		return nil, fmt.Errorf("failed to open image: %w", err)
	}
	defer file.Close()

	img, format, err := image.Decode(file)
	if err != nil {
		return nil, fmt.Errorf("failed to decode image: %w", err)
	}

	originalBounds := img.Bounds()
	originalWidth := originalBounds.Dx()
	originalHeight := originalBounds.Dy()

	if originalWidth <= options.MaxSize && originalHeight <= options.MaxSize {
		file.Seek(0, 0)
		data, err := os.ReadFile(filepath)
		if err != nil {
			return nil, fmt.Errorf("failed to read original image: %w", err)
		}
		return data, nil
	}

	newWidth, newHeight := calculateNewDimensions(originalWidth, originalHeight, options.MaxSize)
	resizedImg := image.NewRGBA(image.Rect(0, 0, newWidth, newHeight))
	draw.CatmullRom.Scale(resizedImg, resizedImg.Bounds(), img, originalBounds, draw.Over, nil)

	var buf bytes.Buffer
	switch format {
	case "png":
		err = png.Encode(&buf, resizedImg)
	case "gif":
		err = jpeg.Encode(&buf, resizedImg, &jpeg.Options{Quality: options.Quality})
	case "webp":
		err = jpeg.Encode(&buf, resizedImg, &jpeg.Options{Quality: options.Quality})
	default:
		err = jpeg.Encode(&buf, resizedImg, &jpeg.Options{Quality: options.Quality})
	}

	if err != nil {
		return nil, fmt.Errorf("failed to encode resized image: %w", err)
	}

	return buf.Bytes(), nil
}

func calculateNewDimensions(width, height, maxSize int) (int, int) {
	if width <= maxSize && height <= maxSize {
		return width, height
	}

	aspectRatio := float64(width) / float64(height)

	if width > height {
		newWidth := maxSize
		newHeight := int(float64(newWidth) / aspectRatio)
		return newWidth, newHeight
	} else {
		newHeight := maxSize
		newWidth := int(float64(newHeight) * aspectRatio)
		return newWidth, newHeight
	}
}

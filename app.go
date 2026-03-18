package main

import (
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type App struct {
	app *application.App
}

type FileFilter struct {
	Name       string   `json:"name"`
	Extensions []string `json:"extensions"`
}

type SaveFileRequest struct {
	Filename string       `json:"filename"`
	Data     string       `json:"data"`
	IsBinary bool         `json:"isBinary"`
	Filters  []FileFilter `json:"filters"`
}

func NewApp(app *application.App) *App {
	return &App{app: app}
}

func (a *App) SaveFile(request SaveFileRequest) (string, error) {
	if a.app == nil {
		return "", fmt.Errorf("application is not ready")
	}
	if strings.TrimSpace(request.Filename) == "" {
		return "", fmt.Errorf("filename is required")
	}

	savePath, err := a.app.Dialog.SaveFileWithOptions(&application.SaveFileDialogOptions{
		Title:    "Save file",
		Filename: filepath.Base(request.Filename),
		Filters:  buildFileFilters(request.Filters),
	}).PromptForSingleSelection()
	if err != nil {
		return "", err
	}
	if savePath == "" {
		return "", nil
	}

	var content []byte
	if request.IsBinary {
		content, err = base64.StdEncoding.DecodeString(request.Data)
		if err != nil {
			return "", fmt.Errorf("decode file data: %w", err)
		}
	} else {
		content = []byte(request.Data)
	}

	if err := os.WriteFile(savePath, content, 0o644); err != nil {
		return "", fmt.Errorf("write file: %w", err)
	}

	return savePath, nil
}

func buildFileFilters(filters []FileFilter) []application.FileFilter {
	if len(filters) == 0 {
		return nil
	}

	result := make([]application.FileFilter, 0, len(filters))
	for _, filter := range filters {
		patterns := make([]string, 0, len(filter.Extensions))
		for _, extension := range filter.Extensions {
			trimmed := strings.TrimSpace(strings.TrimPrefix(extension, "."))
			if trimmed == "" {
				continue
			}
			patterns = append(patterns, "*."+trimmed)
		}
		if len(patterns) == 0 {
			continue
		}
		result = append(result, application.FileFilter{
			DisplayName: filter.Name,
			Pattern:     strings.Join(patterns, ";"),
		})
	}

	return result
}

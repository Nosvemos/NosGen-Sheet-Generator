package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx context.Context
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

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) SaveFile(request SaveFileRequest) (string, error) {
	if a.ctx == nil {
		return "", fmt.Errorf("application context is not ready")
	}
	if strings.TrimSpace(request.Filename) == "" {
		return "", fmt.Errorf("filename is required")
	}

	savePath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Save file",
		DefaultFilename: filepath.Base(request.Filename),
		Filters:         buildRuntimeFilters(request.Filters),
	})
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

func buildRuntimeFilters(filters []FileFilter) []runtime.FileFilter {
	if len(filters) == 0 {
		return nil
	}

	result := make([]runtime.FileFilter, 0, len(filters))
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
		result = append(result, runtime.FileFilter{
			DisplayName: filter.Name,
			Pattern:     strings.Join(patterns, ";"),
		})
	}

	return result
}

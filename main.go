package main

import (
	"embed"
	"encoding/base64"
	"log"
	"mime"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

//go:embed all:dist
var assets embed.FS

func main() {
	app := application.New(application.Options{
		Name:        "nosgalaxy-gen",
		Description: "NosGalaxy Sprite Generator",
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})
	app.RegisterService(application.NewService(NewApp(app)))
	win := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:              "NosGalaxy Sprite Generator",
		Width:              1520,
		Height:             940,
		MinWidth:           1280,
		MinHeight:          760,
		EnableFileDrop:     true,
		BackgroundColour:   application.NewRGB(9, 11, 18),
		DevToolsEnabled:    true,
		UseApplicationMenu: true,
		URL:                "/",
	})

	win.OnWindowEvent(events.Common.WindowFilesDropped, func(event *application.WindowEvent) {
		files := event.Context().DroppedFiles()
		dropped := make([]map[string]string, 0, len(files))
		for _, path := range files {
			data, err := os.ReadFile(path)
			if err != nil {
				log.Printf("failed to read dropped file %q: %v", path, err)
				continue
			}

			name := filepath.Base(path)
			contentType := mime.TypeByExtension(filepath.Ext(name))
			if contentType == "" {
				contentType = "application/octet-stream"
			}
			dropped = append(dropped, map[string]string{
				"name": name,
				"type": contentType,
				"data": base64.StdEncoding.EncodeToString(data),
			})
		}
		if len(dropped) > 0 {
			app.Event.Emit("files-dropped", map[string]any{"files": dropped})
		}
	})

	err := app.Run()
	if err != nil {
		log.Fatal(err)
	}
}

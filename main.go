package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:dist
var assets embed.FS

func main() {
	app := application.New(application.Options{
		Name:        "NosGen",
		Description: "Sprite atlas editor for PNG frame sets",
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})
	app.RegisterService(application.NewService(NewApp(app)))
	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:             "NosGen",
		Width:             1520,
		Height:            940,
		MinWidth:          1280,
		MinHeight:         760,
		BackgroundColour:  application.NewRGB(9, 11, 18),
		DevToolsEnabled:   true,
		UseApplicationMenu: true,
		URL:               "/",
	})

	err := app.Run()
	if err != nil {
		log.Fatal(err)
	}
}

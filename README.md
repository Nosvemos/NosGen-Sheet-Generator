# NosGen

NosGen is a sprite atlas editor for PNG frame sets. Import frames, place per-frame points, build point groups, preview animation, and export a packed atlas with clean JSON data.

## Features
- Import PNG frames or open an existing atlas (PNG + JSON).
- Visual timeline with playback controls (FPS, speed, reverse, loop).
- Point tools: add, select, rename, delete, and per-frame adjustments.
- Auto-fill points using linear, tangent, circle, ellipse, or square models.
- Point groups with indexed entries and group preview playback.
- Two modes: Character (points + groups) and Animation (timeline export).
- Export PNG + JSON with pivot space (top-left, bottom-left, center).
- Export quality scaling + optional smoothing.
- Undo/redo history with configurable limit.
- Hotkey editor and settings modal.
- Dark theme default with theme selector.
- i18n scaffolding for future localization.

## UI Layout
**Left: Point Studio**
- Project settings, point tools, points list, selected point editor.
- Keyframes and auto-fill tools.
- Point groups and group editor.

**Center: Scene**
- Frame/Atlas view, grid, zoom/pan.
- Timeline controls with play/pause and frame navigation.

**Right: Atlas Pipeline**
- Atlas import (new frames or edit current atlas).
- Sprite settings, atlas layout, export quality.
- Export actions.

## Quick Start
```bash
npm install
npm run dev
```
Open the app, import PNG frames, place points, then export PNG + JSON.

## Import & Export
**Import**
- New Atlas: PNG frames (+ optional points JSON).
- Edit Current: atlas PNG + JSON.

**Export**
- Atlas PNG: `<project>_atlas.png`
- Data JSON: `<project>_data.json`

On desktop builds (Neutralino), export uses a Save dialog so you can choose the location. In the browser, modern Chromium-based browsers will also show a Save dialog; otherwise files download to the default downloads folder.
Metadata includes a `scale` number (default 1) for game-side sizing.

## Modes
**Character**
- Points, auto-fill, and groups enabled.
- Export includes point data.

**Animation**
- Focused on playback and animation export.
- Export includes animation metadata (fps, speed, loop, selected frames).

## Pivot Conversion
Points are stored in top-left space. Export uses the selected pivot:
- Top-left: `exportX = x`, `exportY = y`
- Bottom-left: `exportX = x`, `exportY = frameHeight - y`
- Center: `exportX = x - frameWidth / 2`, `exportY = y - frameHeight / 2`

## Desktop (Neutralino)
Run as a desktop app using Neutralinojs.

```bash
npm run neu:update
npm run neu:dev
```

Build a release package:
```bash
npm run neu:build
```

Windows output:
- `dist/nosgen/nosgen-win_x64.exe`
- `dist/nosgen/resources.neu` (must be next to the exe)

## Customization
- Hotkeys and history limit are configurable in the Settings modal.
- Export quality can be tuned via scale and smoothing.

## License
MIT (if you want a different license, update this section).

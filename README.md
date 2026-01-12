# NosGen

Sprite atlas editor for PNG frame sets. Build a packed atlas, preview playback, place per-frame points, create point groups, and export clean PNG + JSON.

## Highlights
- Import PNG frames or an existing atlas (PNG + JSON).
- Build an atlas with rows + padding, preview the atlas layout.
- Frame playback with FPS, speed, reverse, loop, and timeline controls.
- Add points on any frame; the point is created across all frames.
- Edit points per-frame, rename or delete globally.
- Auto-fill points using linear, tangent, circle, ellipse, or square models.
- Point groups with indexed entries and group preview playback.
- Two modes: Character (points + groups) and Animation (timeline export).
- Export with selectable pivot origin: top-left, bottom-left, or center.
- Export image quality/scale control and optional smoothing.
- Dark theme by default with a light/dark selector.
- i18n scaffolding is in place for future multi-language support.

## Layout (3 Panels)
**Left - Point Studio**
- Select/Add mode, pivot origin selector.
- Points list, selected point editor, keyframes list.
- Auto-fill controls and group editor.

**Center - Scene**
- Frame/Atlas view, canvas editing, grid, zoom and pan.
- Blender-style playback bar with navigation, reverse, loop, FPS, speed.

**Right - Atlas Pipeline**
- New atlas import (PNGs + optional points JSON).
- Edit current atlas (PNG + JSON).
- Sprite settings, atlas settings, export quality.
- Export PNG + JSON.

## Workflow
1. Import PNG frames (right panel).
2. Switch to Add mode and click on the frame to place points.
3. Rename points on the left; drag or edit X/Y on the frame.
4. Tune rows/padding and sprite direction.
5. Export PNG + JSON.

## Modes
**Character**
- Points, auto-fill, and groups enabled.
- Export includes point data.

**Animation**
- Focused on playback and animation export.
- Export includes animation metadata (fps, speed, loop, selected frames).

## Data Model (Internal)
- Frame positions are stored in top-left coordinates.
- A new point is created in every frame (same id + name).
- Point positions are per-frame and can be moved independently.
- Renaming and deleting apply globally across frames.
- Groups store per-index point lists (by id, exported as names).

## Pivot Conversions
Coordinates are stored as top-left internally. Export uses the selected pivot:

- Top-left:
  - `exportX = x`
  - `exportY = y`
- Bottom-left:
  - `exportX = x`
  - `exportY = frameHeight - y`
- Center:
  - `exportX = x - frameWidth / 2`
  - `exportY = y - frameHeight / 2`

## Atlas Layout
Atlas size is derived from:
- `rows` (user input)
- `padding` (user input)
- `cellWidth/Height` = max frame size
- `columns = ceil(frameCount / rows)`

Smaller frames are centered inside their cell.

## Export Names
Exports are based on project name:
- Atlas PNG: `<project>_atlas.png`
- Data JSON: `<project>_data.json`

## Export JSON (Simplified)
```json
{
  "meta": {
    "app": "NosGen",
    "image": "hero_atlas.png",
    "size": { "w": 1024, "h": 512 },
    "rows": 4,
    "columns": 6,
    "padding": 6,
    "pivot": "top-left",
    "spriteDirection": "clockwise",
    "mode": "character"
  },
  "frames": [
    {
      "name": "run_01.png",
      "x": 6,
      "y": 6,
      "w": 128,
      "h": 128,
      "points": [
        { "name": "hand", "x": 12, "y": 88 }
      ]
    }
  ]
}
```

## Import JSON
- Matches frames by `name` (or legacy fields like `filename`/`id`).
- `meta.pivot` or `meta.pivotMode` controls coordinate conversion.
- Supports grouped point lists and animation metadata when present.

## Development
```bash
npm install
npm run dev
```

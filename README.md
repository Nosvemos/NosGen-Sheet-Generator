# NosGen

Sprite sheet atlas editor for PNG frame sets. Build an atlas, preview playback, place points per frame, and export a clean PNG + JSON.

## Highlights
- Import multiple PNGs and build an atlas with rows + padding.
- Play the atlas timeline with FPS, reverse, and speed control.
- Add points on any frame, then move them per-frame.
- Points are created across all frames and share the same name/id.
- Rename or delete a point globally across the full frame set.
- Export with selectable pivot origin: top-left, bottom-left, or center.
- Dark theme by default with a light/dark selector.
- i18n scaffolding is in place for future multi-language support.

## Layout (3 Panels)
**Left - Point Studio**
- Select/Add mode, center point shortcut.
- Pivot origin selector.
- Point list for the current frame.
- Edit name + X/Y for the selected point.

**Center - Scene**
- Frame/Atlas tabs.
- Canvas for editing points (frame view) or previewing the atlas.
- Blender-style playback bar with navigation, reverse, loop, FPS, and speed.

**Right - Atlas Pipeline**
- PNG import, JSON import.
- Atlas rows + padding.
- Export PNG + JSON.

## Workflow
1. Import PNG frames (right panel).
2. Switch to Add mode and click on the frame to place points.
3. Rename points on the left; drag or edit X/Y on the frame.
4. Tune rows/padding.
5. Export PNG + JSON.

## Data Model (Internal)
- Frame positions are stored in top-left coordinates.
- A new point is created in every frame (same id + name).
- Point positions are per-frame and can be moved independently.
- Renaming and deleting apply globally across frames.

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

## Export JSON (Simplified)
```json
{
  "meta": {
    "app": "NosGen",
    "image": "sprite-atlas.png",
    "size": { "w": 1024, "h": 512 },
    "rows": 4,
    "columns": 6,
    "padding": 6,
    "pivot": "top-left"
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
- Points are replaced on matching frames.

## Development
```bash
npm install
npm run dev
```

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

On desktop builds (Wails), export uses a native Save dialog so you can choose the location. In the browser, modern Chromium-based browsers will also show a Save dialog; otherwise files download to the default downloads folder.
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

## Desktop (Wails)
Run as a desktop app using Wails v3 (`v3.0.0-alpha.74`).

```bash
npm run wails:dev
```

Build a release package:
```bash
npm run wails:build
```

Regenerate Wails bindings after changing Go service methods:
```bash
npm run wails:generate
```

Build outputs:
- `build/bin/nosgen.exe` (Windows)
- `build/bin/nosgen` (Linux)
- `build/bin/nosgen.app` (macOS)
- `dist/release/*` zipped release artifacts created by `npm run wails:build`

## GitHub Actions
The repository includes a GitHub Actions workflow at `.github/workflows/build-release.yml`.

- Pushes to `main` run an automated desktop build.
- Pushing a tag like `v0.1.0` builds release artifacts and uploads them to a GitHub Release.
- Manual runs also support a `version` input. When provided, the workflow updates `package.json`, `package-lock.json`, and `build/config.yml`, commits the version bump, then builds and publishes the release from that commit.

## Customization
- Hotkeys and history limit are configurable in the Settings modal.
- Export quality can be tuned via scale and smoothing.

## Performance & Quality Improvements
- **Tight Packing**: New shelf and tight grid packing algorithms reduce wasted atlas space compared to the legacy uniform grid. Frame sizes are respected individually instead of forcing all cells to the largest frame.
- **Checkerboard Pattern Caching**: The stage background checkerboard is now rendered with cached canvas patterns instead of per-frame loops, improving render performance.
- **Export Quality Control**: WebP export now supports a configurable quality parameter. KTX2 encoding supports a tunable UASTC quality level.
- **Lanczos Resampling**: The CLI uses `sharp` with Lanczos3 kernel for high-quality downscaling/upscaling.

## CLI Usage
NosGen can be run headless from the command line, making it ideal for AI agents and automated build pipelines. The CLI supports **all** UI features: points, auto-fill, point groups, animation metadata, pivot modes, sprite direction, import/re-export, and multiple packing algorithms.

```bash
npm run cli -- <command> [options]
```

### Subcommands
| Command | Description |
|---------|-------------|
| `pack` | Pack frames into a spritesheet (normal mode) |
| `character` | Pack frames with points and point groups |
| `animation` | Pack frames with animation metadata |
| `import` | Import an existing atlas (PNG+JSON) and re-export |
| `init-config` | Generate a sample JSON config file |

### Global Options
| Flag | Description | Default |
|------|-------------|---------|
| `-i, --input <dir>` | Input directory with PNG frames | `.` |
| `-o, --output <dir>` | Output directory | `./output` |
| `-n, --name <name>` | Base name for exported files | `sprite` |
| `-c, --config <path>` | JSON config file path | — |
| `--rows <number>` | Rows for grid packing (`uniform`/`tight`) | auto |
| `--padding <number>` | Padding between frames | `2` |
| `--scale <number>` | Export scale multiplier | `1` |
| `--format <png\|webp>` | Output image format | `png` |
| `--webp-quality <0-100>` | WebP quality | `90` |
| `--smoothing` | Enable Lanczos3 smoothing when scaling | false |
| `--pivot <top-left\|bottom-left\|center>` | Pivot space | `top-left` |
| `--mode <uniform\|tight\|shelf>` | Packing algorithm | `shelf` |
| `-h, --help` | Show help | — |

### Packing Modes
- **shelf** (recommended): Automatic shelf packing. Frames are sorted by height and placed into shelves. Minimizes wasted space without requiring a row count.
- **tight**: Grid-based but each column and row sizes to its largest frame.
- **uniform**: Legacy fixed-cell grid where every cell is the size of the largest frame.

### Examples

#### Normal Pack
```bash
npm run cli -- pack -i ./frames -o ./dist -n hero --mode shelf --padding 4
```

#### Character Mode (with Points & Groups)
```bash
# Using a config file
npm run cli -- character -c hero-config.json
```

#### Animation Mode
```bash
npm run cli -- animation -i ./frames -c anim-config.json --fps 24
```

#### Import & Re-export
```bash
npm run cli -- import -a old_atlas.png -d old_data.json -o ./dist --scale 2 --format webp
```

#### Generate Sample Config
```bash
npm run cli -- init-config --mode character -o ./my-config.json
```

### Config File Format
The config file mirrors the full editor state. All UI features are configurable via JSON.

#### Normal Mode Config
```json
{
  "input": "./assets/frames",
  "output": "./dist",
  "name": "player",
  "mode": "normal",
  "packing": {
    "mode": "shelf",
    "padding": 2
  },
  "export": {
    "scale": 1,
    "format": "png",
    "webpQuality": 90,
    "smoothing": true,
    "pivot": "top-left"
  }
}
```

#### Character Mode Config (Points + Groups + Auto-fill)
```json
{
  "input": "./assets/frames",
  "output": "./dist",
  "name": "hero",
  "mode": "character",
  "packing": {
    "mode": "shelf",
    "padding": 2
  },
  "export": {
    "scale": 1,
    "format": "png",
    "smoothing": true,
    "pivot": "center"
  },
  "spriteDirection": "clockwise",
  "points": [
    {
      "name": "head",
      "color": "hsl(0 70% 55%)",
      "keyframes": [
        { "frameIndex": 0, "x": 32, "y": 10 },
        { "frameIndex": 3, "x": 34, "y": 12 },
        { "frameIndex": 5, "x": 32, "y": 10 }
      ],
      "autoFill": {
        "shape": "linear",
        "enabled": true
      }
    },
    {
      "name": "hand_right",
      "keyframes": [
        { "frameIndex": 0, "x": 50, "y": 40 },
        { "frameIndex": 2, "x": 55, "y": 35 },
        { "frameIndex": 4, "x": 50, "y": 40 }
      ],
      "autoFill": {
        "shape": "ellipse",
        "enabled": true,
        "spriteDirection": "clockwise"
      }
    }
  ],
  "pointGroups": [
    {
      "name": "body_parts",
      "entries": [
        ["head", "hand_right"],
        ["head", "hand_right"],
        ["head", "hand_right"]
      ]
    }
  ]
}
```

**Point Definition Options:**
- `positions`: Explicit `{x, y}` for every frame (array index = frame index)
- `keyframes` + `autoFill`: Define keyframes and let the CLI interpolate/auto-fill all frames

**Supported Auto-fill Shapes:**
- `linear`: Linear interpolation between keyframes
- `tangent`: Catmull-Rom spline interpolation
- `ellipse`: Elliptical path fit (supports rotation)
- `circle`: Circular path fit
- `square`: Square/rectangular path fit

#### Animation Mode Config
```json
{
  "input": "./assets/frames",
  "output": "./dist",
  "name": "enemy_walk",
  "mode": "animation",
  "packing": {
    "mode": "tight",
    "rows": 2,
    "padding": 4
  },
  "export": {
    "scale": 1,
    "format": "webp",
    "webpQuality": 85,
    "pivot": "bottom-left"
  },
  "animation": {
    "name": "walk",
    "fps": 12,
    "speed": 1.5,
    "loop": true,
    "frameSelection": ["walk_01", "walk_02", "walk_03"]
  }
}
```

`frameSelection` supports wildcards (`*`, `?`). Example: `["idle_*", "walk_0?"]`.

#### Import / Re-export Config
```json
{
  "output": "./dist",
  "name": "upscaled",
  "export": {
    "scale": 2,
    "format": "png",
    "smoothing": true
  },
  "import": {
    "atlas": "./old_atlas.png",
    "data": "./old_data.json"
  }
}
```

When importing, the original mode, points, groups, and animation metadata are automatically preserved unless explicitly overridden in the config.

### AI Agent Integration
Because the CLI is fully non-interactive and config-driven, AI agents can generate spritesheets automatically:

1. Export or generate frames into a directory.
2. Generate a config file (or use `init-config`).
3. Run `npm run cli -- character -c config.json`.
4. Consume the resulting `<name>_atlas.<format>` and `<name>_data.json` in your engine.

Points and groups can be defined procedurally in the config, enabling AI-driven rigging and animation pipeline automation.

## License
MIT (if you want a different license, update this section).

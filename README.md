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
- JSON output modes: `pretty`, `minified`, or `compact` (smallest); import auto-detects all three.
- Atlas packing modes in the editor and CLI: `shelf` (compact), `tight`, `uniform`.
- Export quality scaling + optional smoothing, plus WebP and KTX2 quality controls.
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
- Bundle ZIP: `<project>_bundle.zip` (PNG + WebP + KTX2 atlas + JSON)
- Frames ZIP: `<project>_frames.zip` (source frames as PNG)

On desktop builds (Wails), export uses a native Save dialog so you can choose the location. In the browser, modern Chromium-based browsers will also show a Save dialog; otherwise files download to the default downloads folder.
Metadata includes a `scale` number (default 1) for game-side sizing.

### JSON Output Modes
The export quality panel (and the CLI `--json` flag) offers three shapes:
- **pretty** — verbose schema, 2-space indented. Human friendly, largest.
- **minified** — same schema, no whitespace. ~40–60% smaller.
- **compact** — compact schema, no whitespace. Smallest.

Import (both "Edit Current" in the UI and the CLI `import` command) auto-detects the format, so compact and verbose files are interchangeable.

The compact schema keeps `meta` readable but collapses the bulky per-frame data. Point names are stored once in a `points` table and referenced by index; groups reference the same indices:

```jsonc
{
  "meta": { "app": "NosGen", "format": "compact", "mode": "character", "pivot": "center", ... },
  "points": ["head", "hand"],          // name table
  "groups": { "body": [[0, 1], [0, 1]] }, // indices into points
  "frames": [
    ["frame_01", 52, 10, 64, 64, [[0, -12, -24], [1, -2, -2]]]
    // [name, x, y, w, h] or [name, x, y, w, h, [[nameIdx, px, py], ...]]
  ]
}
```

`meta.format === "compact"` marks the schema; importers expand it back to the verbose shape losslessly.

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
- `dist-cli/nosgen-cli[.exe]` + `node_modules` (headless CLI, via `npm run cli:exe`)
- `dist/release/*` zipped release artifacts created by `npm run wails:build` (includes `nosgen-cli-*` when `dist-cli` is present)

## GitHub Actions
The repository includes a GitHub Actions workflow at `.github/workflows/build-release.yml`.

- Pushes to `main` run an automated desktop build (plus the headless CLI executable).
- Pushing a tag like `v0.1.0` builds release artifacts (desktop app + `nosgen-cli-*`) and uploads them to a GitHub Release.
- Manual runs also support a `version` input. When provided, the workflow updates `package.json`, `package-lock.json`, and `build/config.yml`, commits the version bump, then builds and publishes the release from that commit.

## Customization
- Hotkeys and history limit are configurable in the Settings modal.
- Export quality can be tuned via scale and smoothing.

## Performance & Quality Improvements
- **Tight Packing**: New shelf and tight grid packing algorithms reduce wasted atlas space compared to the legacy uniform grid. Frame sizes are respected individually instead of forcing all cells to the largest frame.
- **Checkerboard Pattern Caching**: The stage background checkerboard is now rendered with cached canvas patterns instead of per-frame loops, improving render performance.
- **Export Quality Control**: WebP export now supports a configurable quality parameter. KTX2 encoding supports a tunable UASTC quality level.
- **Lanczos Resampling**: The CLI uses `sharp` with Lanczos3 kernel for high-quality downscaling/upscaling.
- **Editor/CLI Packing Parity**: The editor export now honors `shelf`/`tight`/`uniform` packing (previously the UI only emitted uniform grids), and the atlas preview matches the exported layout.
- **Compact JSON**: Optional compact/minified data export with auto-detecting import keeps data files small for large sprite sets.
- **Shared Math Core**: Auto-fill, interpolation, and pivot math live in a single `sprite-math` module shared by the editor and CLI, so the two cannot drift.

## Testing
Unit tests (Vitest) cover the shared math, atlas packing/placement, and the compact JSON round-trip.

```bash
npm test        # run once
npm run test:watch
```

## CLI Usage
NosGen can be run headless from the command line, making it ideal for AI agents and automated build pipelines. The CLI supports **all** UI features: points, auto-fill, point groups, animation metadata, pivot modes, sprite direction, import/re-export, and multiple packing algorithms.

```bash
npm run cli -- <command> [options]
```

### Standalone CLI Executable (no Node required)
Releases include a prebuilt headless executable so you can run NosGen without installing Node.js:

- `nosgen-cli-v<version>-windows-amd64.zip`
- `nosgen-cli-v<version>-linux-amd64.tar.gz`
- `nosgen-cli-v<version>-macos-universal.zip`

Each archive contains `nosgen-cli` (the executable) plus a `node_modules/` folder holding the `sharp` image runtime. **Keep them together** — the executable loads `sharp` from the adjacent `node_modules`. Then run it like the npm CLI:

```bash
# Windows
nosgen-cli.exe pack -i ./frames -o ./dist -n hero --mode shelf --json compact

# Linux / macOS
./nosgen-cli pack -i ./frames -o ./dist -n hero --mode shelf --json compact
```

Build the executable locally (output in `dist-cli/`):
```bash
npm run cli:exe
```
This bundles the CLI with esbuild, wraps it as a Node Single Executable Application, and installs the platform `sharp` runtime beside it. The GitHub Actions release workflow builds one per OS automatically alongside the desktop app.

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
| `--format <png\|webp\|ktx2>` | Output image format | `png` |
| `--webp-quality <0-100>` | WebP quality | `90` |
| `--ktx2-quality <0-3>` | KTX2 UASTC quality level | `2` |
| `--smoothing` | Enable Lanczos3 smoothing when scaling | false |
| `--bundle` | Also write `<name>_bundle.zip` with PNG, WebP, KTX2, and JSON | false |
| `--bundle-formats <list>` | Comma-separated bundle image formats (`png`, `webp`, `ktx2`) | `png,webp,ktx2` |
| `--frames-zip` | Also write `<name>_frames.zip` with source frames as PNG | false |
| `--pivot <top-left\|bottom-left\|center>` | Pivot space | `top-left` |
| `--mode <uniform\|tight\|shelf>` | Packing algorithm | `shelf` |
| `--json <pretty\|minified\|compact>` | JSON output shape | `pretty` |
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

#### UI Export Parity
```bash
npm run cli -- pack -i ./frames -o ./dist -n hero --format webp --bundle --frames-zip
```

This produces the same export surfaces available in the editor: single atlas image, data JSON, bundle ZIP, and frames ZIP.

For faster bundle exports, limit expensive formats:

```bash
npm run cli -- pack -i ./frames -o ./dist -n hero --bundle --bundle-formats png,webp
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
    "ktx2Quality": 2,
    "smoothing": true,
    "bundle": false,
    "bundleFormats": ["png", "webp", "ktx2"],
    "framesZip": false,
    "pivot": "top-left",
    "jsonMode": "compact"
  }
}
```

`export.jsonMode` accepts `pretty` (default), `minified`, or `compact`; the `--json` flag overrides it.

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
    "bundle": true,
    "framesZip": true,
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

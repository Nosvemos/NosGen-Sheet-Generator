<div align="center">

# 🌌 NosGalaxy Gen

### Professional Sprite Atlas Packer, Keyframe Rigging Editor & Game Engine Pipeline

[![Build Status](https://img.shields.io/github/actions/workflow/status/Nosvemos/nosgalaxy_sprite_generator/build-release.yml?branch=main&style=flat-square&logo=github)](https://github.com/Nosvemos/nosgalaxy_sprite_generator/actions)
[![Wails Version](https://img.shields.io/badge/Wails-v3.0.0--alpha.74-007ACC?style=flat-square&logo=go)](https://v3.wails.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

*Import PNG frame sequences, rig and interpolate keyframe points, build attachment groups, and export production-ready PNG sprite sheets with native Raylib & JSON metadata.*

[Quick Start](#-quick-start) • [Core Capabilities](#-core-capabilities) • [Desktop Application](#-desktop-application-wails-v3) • [CLI & Pipeline Automation](#-cli--pipeline-automation) • [JSON Metadata Schemas](#-json-metadata-schemas) • [Project Structure](#-project-structure)

</div>

---

## 🌟 Core Capabilities

| Feature | Description |
| :--- | :--- |
| **Ship Mode (Keyframe Rigging)** | Rig attachment points (e.g. `turret`, `thruster_l`) with keyframe animation, point grouping, and rotation tracking (`clockwise` / `counterclockwise`). |
| **Animation Mode** | Dedicated animation pipeline with timeline playback controls, custom FPS, speed modifiers, loop flags, and wildcard frame filtering. |
| **Normal Mode** | High-speed, standalone PNG sprite sheet packing without keyframes or metadata overlays. |
| **Auto-Fill Curve Fitting** | Interpolate point motion across keyframes using **Linear**, **Tangent (Catmull-Rom)**, **Circle**, **Ellipse**, and **Square** mathematical models. |
| **MaxRects & Shelf Packing** | High-efficiency 2D packing algorithms (**MaxRects**, **Shelf**, **Tight**, **Uniform**) to minimize atlas whitespace. |
| **Raylib & Engine Metadata** | Native JSON payload formatting built specifically for **Raylib** and custom C/C++ game engine loaders alongside standard `pretty` JSON. |

| **Stage Minimap & Controls** | Interactive canvas minimap, pixel grid toggle, magnet snapping, origin crosshairs, and smooth pan/zoom controls. |
| **CLI & AI Agent Automation** | Fully non-interactive headless CLI (`nosgen-cli`) and prebuilt standalone executables for CI/CD and AI agent pipelines. |
| **Desktop Native (Wails v3)** | High-performance, low-footprint desktop application powered by Go + Wails v3. |

---

## ⚡ Quick Start

### Web / Development Server

```bash
# Install node dependencies
npm install

# Start Vite local development server
npm run dev
```

Open `http://localhost:5173` in your browser to launch the web editor.

### Available Scripts

| Script | Command / Action |
| :--- | :--- |
| `npm run dev` | Launch Vite local dev server with hot reload |
| `npm run build` | Typecheck (`tsc -b`) and build web distribution bundle |
| `npm run test` | Run Vitest unit test suite |
| `npm run test:watch` | Run Vitest in interactive watch mode |
| `npm run lint` | Run ESLint across project source code |
| `npm run cli` | Execute headless CLI via `tsx` |
| `npm run cli:exe` | Compile standalone single-executable CLI binary into `dist-cli/` |
| `npm run wails:dev` | Launch Wails v3 desktop application in live-reload dev mode |
| `npm run wails:build` | Build production Wails desktop app for current OS |
| `npm run wails:generate` | Regenerate TypeScript bindings from Go service methods |

---

## 🖥️ Desktop Application (Wails v3)

NosGalaxy Gen runs natively as a desktop application powered by **Wails v3** (Go backend + React frontend).

```bash
# Launch desktop app in live-reload dev mode
npm run wails:dev

# Build production desktop binary for current OS
npm run wails:build

# Regenerate TypeScript bindings from Go service methods
npm run wails:generate
```

### Production Binary Locations
- **Windows**: `build/bin/nosgalaxy-gen.exe`
- **Linux**: `build/bin/nosgalaxy-gen`
- **macOS**: `build/bin/nosgalaxy-gen.app`

---

## 🛠️ CLI & Pipeline Automation

NosGalaxy Gen provides complete feature parity in a headless command-line interface. It is ideal for build scripts, game pipelines, and automated AI workflows.

### Running via npm
```bash
npm run cli -- <command> [options]
```

### Standalone Executable (Zero Node.js Dependency)
Prebuilt standalone executables (`nosgen-cli` / `nosgen-cli.exe`) are bundled with Node Single Executable Application (SEA) and ship alongside the `sharp` image processing library:

```bash
# Windows
nosgen-cli.exe pack -i ./frames -o ./dist -n hero --mode maxrects --json raylib

# Linux / macOS
./nosgen-cli ship -i ./ship_frames -c ship-config.json -o ./dist --json raylib
```

> [!NOTE]
> You can build the standalone CLI executable locally at any time via `npm run cli:exe`. Output files will be generated in `dist-cli/`.

### CLI Subcommands

| Command | Description |
| :--- | :--- |
| `pack` | Pack source PNG frames into an atlas (Normal Mode) |
| `ship` | Pack frames with attachment points, keyframe interpolation, and point groups |
| `animation` | Pack frames with animation timeline metadata (FPS, loop, frame selection) |
| `import` | Import an existing atlas (`.png` + `.json`) and re-export with new settings |
| `init-config` | Generate a sample JSON job configuration template |

*(Note: `character` is supported as a CLI alias for `ship` for backwards compatibility).*

### Primary CLI Options

| Flag | Description | Default |
| :--- | :--- | :--- |
| `-i, --input <dir>` | Path to folder containing source PNG frames | `.` |
| `-o, --output <dir>` | Target output directory | `./output` |
| `-n, --name <name>` | Base filename for output atlas and JSON | `sprite` |
| `-c, --config <path>` | Path to job JSON configuration file | — |
| `-a, --atlas <path>` | Path to existing atlas PNG (required for `import`) | — |
| `-d, --data <path>` | Path to existing data JSON (required for `import`) | — |
| `--mode <shelf\|maxrects\|tight\|uniform>` | Texture packing algorithm (or `<normal\|ship\|animation>` for `init-config`) | `shelf` |
| `--rows <number>` | Number of grid rows for packing | `auto` |
| `--padding <number>` | Pixel padding between frames | `2` |
| `--scale <number>` | Downscaling or upscaling multiplier | `1` |
| `--smoothing` | Apply Lanczos3 resampling during scaling | `false` |
| `--pivot <top-left\|bottom-left\|center>` | Pivot coordinate origin system | `top-left` |
| `--rotation <clockwise\|counterclockwise>` | Rotation orientation direction | `clockwise` |
| `--json <pretty\|raylib>` | JSON output schema shape | `pretty` |
| `--bundle` | Export `<name>_bundle.zip` archive | `false` |
| `--frames-zip` | Export `<name>_frames.zip` with source frames | `false` |

---

## 📊 JSON Metadata Schemas

NosGalaxy Gen offers multiple JSON output formats tailored for different game engines and storage efficiency.

### 1. `raylib` Schema (Optimized for Raylib / Game Engines)
Formats frame bounding boxes into `rects`, pivots into `{x, y}`, and points into structured key-value maps:

```json
{
  "meta": {
    "app": "NosGalaxy",
    "version": "1.0",
    "image": "player_ship_atlas.png",
    "frameSize": [64, 64],
    "padding": 2,
    "scale": 1,
    "pivot": "center",
    "rotation": "clockwise",
    "mode": "ship"
  },
  "rects": [[0, 0], [356, 0]],
  "points": {
    "cockpit": [[0, -12], [0, -10]],
    "thruster_main": [[0, 24], [0, 26]]
  },
  "point_groups": {
    "weapons": [["hardpoint_l", "hardpoint_r"]]
  }
}
```

### 2. `pretty` Schema (Standard Format)
Standard formatted JSON payload:

```json
{
  "meta": {
    "app": "NosGalaxy",
    "image": "player_ship_atlas.png",
    "size": { "w": 512, "h": 512 },
    "padding": 2,
    "scale": 1,
    "pivot": "top-left",
    "mode": "ship"
  },
  "frames": [
    {
      "name": "ship_idle_01",
      "x": 0,
      "y": 0,
      "w": 64,
      "h": 64,
      "points": [
        { "name": "cockpit", "x": 32, "y": 20 }
      ]
    }
  ]
}
```
│       ├── atlas-format.ts  # Raylib & Pretty JSON schema codecs

│       ├── sprite-math.ts   # Curve fitting (Linear, Tangent, Circle, Ellipse, Square)
│       ├── editor-reducer.ts# Undo/Redo state reducer & differential patching
│       └── texture-codecs.ts# Canvas encoding & texture helpers
```

---

## 🧪 Testing & Verification

Comprehensive test suites (powered by Vitest) cover layout math, curve fitting, packing algorithms, JSON formats, and CLI argument parsing:

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linter
npm run lint
```

---

## 🚢 CI/CD & Release Pipeline

The repository uses GitHub Actions (`.github/workflows/build-release.yml`) for automated building and publishing:
- **On Push to `main`**: Runs automated build verification across OS environments.
- **On Release Tag (`v*`)**: Automatically compiles production binaries for **Windows x64** (`nosgalaxy-gen.exe`), **Linux x64** (`nosgalaxy-gen`), and **macOS Universal** (`nosgalaxy-gen.app`), along with standalone CLI executables (`nosgen-cli-*`).

---

## 📄 License

Distributed under the [MIT License](LICENSE).

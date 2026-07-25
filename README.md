<div align="center">

# 🌌 NosGalaxy Gen

### Professional Sprite Atlas Packer, Keyframe Rigging Editor & Game Engine Pipeline

[![Build Status](https://img.shields.io/github/actions/workflow/status/Nosvemos/nosgalaxy_sprite_generator/build-release.yml?branch=main&style=flat-square&logo=github)](https://github.com/Nosvemos/nosgalaxy_sprite_generator/actions)
[![Wails Version](https://img.shields.io/badge/Wails-v3.0.0--alpha.74-007ACC?style=flat-square&logo=go)](https://v3.wails.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

*Import PNG frame sequences, rig and interpolate keyframe points, build attachment groups, and export production-ready PNG sprite sheets with native Raylib & JSON metadata.*

[Quick Start](#-quick-start) • [Core Capabilities](#-core-capabilities) • [Desktop Application](#-desktop-application-wails-v3) • [CLI & Pipeline Automation](#-cli--pipeline-automation) • [JSON Metadata Schemas](#-json-metadata-schemas)

</div>

---

## 🌟 Core Capabilities

| Feature | Description |
| :--- | :--- |
| **Ship Mode (Keyframe Rigging)** | Rig attachment points (e.g. `turret`, `thruster_l`) with keyframe animation, point grouping, and rotation tracking (`clockwise` / `counterclockwise`). |
| **Animation Mode** | Dedicated animation pipeline with timeline playback controls, custom FPS, speed modifiers, loop flags, and wildcard frame filtering. |
| **Auto-Fill Curve Fitting** | Interpolate point motion across keyframes using **Linear**, **Tangent (Catmull-Rom)**, **Circle**, **Ellipse**, and **Square** mathematical models. |
| **MaxRects & Shelf Packing** | High-efficiency 2D packing algorithms (**MaxRects**, **Shelf**, **Tight**, **Uniform**) to minimize atlas whitespace. |
| **Raylib Export Support** | Native JSON payload formatting built specifically for **Raylib** and custom C/C++ game engine loaders alongside standard `pretty` JSON. |
| **Stage Minimap & Controls** | Interactive canvas minimap, pixel grid toggle, origin crosshairs, and smooth pan/zoom controls. |
| **CLI & AI Agent Automation** | Fully non-interactive headless CLI (`nosgen-cli`) and prebuilt standalone executables for CI/CD and AI agent pipelines. |
| **Desktop Native (Wails v3)** | High-performance, low-footprint desktop application powered by Go 1.26 + Wails v3. |

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

---

## 🖥️ Desktop Application (Wails v3)

NosGalaxy Gen runs natively as a desktop application powered by **Wails v3**.

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
| `--mode <maxrects\|shelf\|tight\|uniform>` | Texture packing algorithm | `shelf` |
| `--json <pretty\|raylib>` | JSON output schema shape | `pretty` |
| `--pivot <top-left\|bottom-left\|center>` | Pivot coordinate origin system | `top-left` |
| `--rotation <clockwise\|counterclockwise>` | Rotation orientation direction | `clockwise` |
| `--scale <number>` | Downscaling or upscaling multiplier | `1` |
| `--smoothing` | Apply Lanczos3 resampling during scaling | `false` |
| `--bundle` | Export `<name>_bundle.zip` archive | `false` |
| `--frames-zip` | Export `<name>_frames.zip` with source frames | `false` |

---

## 📊 JSON Metadata Schemas

NosGalaxy Gen offers two JSON output formats tailored for different game engines.

### 1. `raylib` Schema (Optimized for Raylib / Game Engines)
Formats frame bounding boxes into `rect`, pivots into `{x, y}`, and points into structured key-value maps:

```json
{
  "meta": {
    "app": "NosGalaxy",
    "version": "1.0",
    "image": "player_ship_atlas.png",
    "size": { "w": 512, "h": 512 },
    "padding": 2,
    "scale": 1,
    "pivot": "center",
    "rotation": "clockwise",
    "mode": "ship"
  },
  "groups": {
    "weapons": [["hardpoint_l", "hardpoint_r"]]
  },
  "frames": [
    {
      "name": "ship_idle_01",
      "rect": { "x": 0, "y": 0, "w": 64, "h": 64 },
      "pivot": { "x": 32, "y": 32 },
      "points": {
        "cockpit": { "x": 0, "y": -12 },
        "thruster_main": { "x": 0, "y": 24 }
      }
    }
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

---

## 📐 Packing Algorithms

- **`maxrects`**: Advanced 2D bin packing algorithm using maximal rectangles heuristic. Maximizes space efficiency for irregular sprite sets.
- **`shelf`** (Recommended): Height-sorted shelf packing. Automatically builds shelves to minimize wasted vertical space.
- **`tight`**: Grid packing where each row and column scales to its largest item.
- **`uniform`**: Fixed cell dimensions based on maximum frame bounds.

---

## 🧪 Testing & Verification

Comprehensive test suites (powered by Vitest) cover layout math, curve fitting, packing algorithms, and CLI argument parsing:

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

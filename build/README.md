# Build Directory

This directory contains Wails-specific build assets.

- `appicon.png`: shared app icon source
- `darwin/*`: macOS plist overrides
- `windows/*`: Windows manifest and version metadata

Build output binaries are written to `build/bin` and are ignored by git.

Release packaging also includes the headless CLI artifacts when `dist-cli/`
exists. The CLI can produce the same export surfaces as the editor:

- single atlas image (`png`, `webp`, or `ktx2`)
- data JSON (`pretty`, `minified`, or `compact`)
- bundle ZIP (`--bundle`, optional `--bundle-formats png,webp`)
- source frames ZIP (`--frames-zip`)

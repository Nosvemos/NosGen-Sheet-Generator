// Build a standalone NosGen CLI executable (nosgen-cli[.exe]) using Node's
// Single Executable Application (SEA) support.
//
// sharp ships a native libvips binary that cannot be embedded into a single
// file, so the runtime layout is:
//
//   dist-cli/
//     nosgen-cli(.exe)        <- the executable (real node + embedded JS blob)
//     node_modules/sharp/...  <- sharp + its native deps, loaded from disk
//
// The embedded JS reassigns `require` to a disk resolver rooted at the
// executable's directory, so `require("sharp")` (left external by esbuild)
// resolves `<exe-dir>/node_modules/sharp`, and sharp then loads its own
// @img/* native packages from the same node_modules tree.
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  chmodSync,
} from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const rootDir = process.cwd();
const outDir = path.join(rootDir, "dist-cli");
const isWindows = process.platform === "win32";
const exeName = isWindows ? "nosgen-cli.exe" : "nosgen-cli";
const exePath = path.join(outDir, exeName);
const bundlePath = path.join(outDir, "cli.cjs");
const blobPath = path.join(outDir, "nosgen-cli.blob");
const seaConfigPath = path.join(outDir, "sea-config.json");

const sharpVersion =
  JSON.parse(
    require("node:fs").readFileSync(path.join(rootDir, "package.json"), "utf8")
  ).dependencies?.sharp ?? "0.33.5";

// Reassign the module's `require` to a disk resolver based on the executable
// location. `require` is a CommonJS wrapper parameter, so reassigning it is
// legal and makes every downstream require() (sharp + node builtins) use real
// on-disk resolution instead of SEA's builtin-only require.
const banner = [
  'const __seaModule = require("node:module");',
  'const __seaPath = require("node:path");',
  "require = __seaModule.createRequire(",
  '  __seaPath.join(__seaPath.dirname(process.execPath), "nosgen-cli.cjs")',
  ");",
].join("\n");

const run = (cmd, args) =>
  execFileSync(cmd, args, { stdio: "inherit", cwd: rootDir });

// npm is a .cmd shim on Windows, so it must go through a shell to resolve.
const runNpm = (args) =>
  execFileSync("npm", args, {
    stdio: "inherit",
    cwd: rootDir,
    shell: true,
  });

console.log("• cleaning dist-cli");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

console.log("• bundling CLI with esbuild (sharp external)");
await build({
  entryPoints: [path.join(rootDir, "src", "cli.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  outfile: bundlePath,
  external: ["sharp"],
  banner: { js: banner },
});

console.log("• generating SEA blob");
writeFileSync(
  seaConfigPath,
  JSON.stringify(
    {
      main: bundlePath,
      output: blobPath,
      disableExperimentalSEAWarning: true,
      useSnapshot: false,
      useCodeCache: false,
    },
    null,
    2
  )
);
run(process.execPath, ["--experimental-sea-config", seaConfigPath]);

console.log("• copying node runtime -> executable");
copyFileSync(process.execPath, exePath);
if (!isWindows) {
  chmodSync(exePath, 0o755);
}

console.log("• injecting blob with postject");
const postjectBin = require.resolve("postject/dist/cli.js");
const postjectArgs = [
  postjectBin,
  exePath,
  "NODE_SEA_BLOB",
  blobPath,
  "--sentinel-fuse",
  "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2",
];
if (process.platform === "darwin") {
  postjectArgs.push("--macho-segment-name", "NODE_SEA");
}
run(process.execPath, postjectArgs);

if (process.platform === "darwin") {
  console.log("• re-signing macOS binary");
  try {
    run("codesign", ["--sign", "-", exePath]);
  } catch {
    console.warn("  codesign failed (continuing; ad-hoc sign unavailable)");
  }
}

console.log("• installing sharp runtime beside executable");
runNpm([
  "install",
  `sharp@${sharpVersion.replace(/^[^\d]*/, "")}`,
  "--prefix",
  outDir,
  "--no-save",
  "--no-package-lock",
  "--include=optional",
]);

// Drop files the runtime does not need to keep the artifact lean.
rmSync(bundlePath, { force: true });
rmSync(blobPath, { force: true });
rmSync(seaConfigPath, { force: true });
rmSync(path.join(outDir, "package.json"), { force: true });
rmSync(path.join(outDir, "package-lock.json"), { force: true });

console.log(`\n✓ Built ${path.relative(rootDir, exePath)}`);
console.log("  Distribute the executable together with its node_modules dir.");

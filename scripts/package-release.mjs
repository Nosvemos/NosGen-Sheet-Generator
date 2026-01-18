import JSZip from "jszip";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const packageJsonPath = path.join(rootDir, "package.json");
const neutralinoConfigPath = path.join(rootDir, "neutralino.config.json");
const distDir = path.join(rootDir, "dist");

const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
const neutralinoConfig = JSON.parse(await readFile(neutralinoConfigPath, "utf8"));

const version = packageJson.version || "0.0.0";
const binaryName =
  neutralinoConfig?.cli?.binaryName || packageJson.name || "app";

const bundleDir = path.join(distDir, binaryName);
const resourcesPath = path.join(bundleDir, "resources.neu");
let resourcesData;
try {
  resourcesData = await readFile(resourcesPath);
} catch (error) {
  console.error(`Missing resources.neu at ${resourcesPath}`);
  process.exit(1);
}

const outputDir = path.join(distDir, "release");
await mkdir(outputDir, { recursive: true });

const entries = await readdir(bundleDir);
const binaries = [];
for (const name of entries) {
  if (!name.startsWith(`${binaryName}-`)) {
    continue;
  }
  if (name === "resources.neu") {
    continue;
  }
  if (name.endsWith(".zip")) {
    continue;
  }
  const fullPath = path.join(bundleDir, name);
  const fileStat = await stat(fullPath);
  if (fileStat.isFile()) {
    binaries.push({ name, fullPath });
  }
}

if (binaries.length === 0) {
  console.error(`No platform binaries found in ${bundleDir}`);
  process.exit(1);
}

for (const binary of binaries) {
  const binaryData = await readFile(binary.fullPath);
  const baseName = binary.name.endsWith(".exe")
    ? binary.name.slice(0, -4)
    : binary.name;
  const label = baseName.replace(`${binaryName}-`, "");
  const zipName = `${binaryName}-v${version}-${label}.zip`;
  const zip = new JSZip();
  zip.file(binary.name, binaryData);
  zip.file("resources.neu", resourcesData);
  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  const zipPath = path.join(outputDir, zipName);
  await writeFile(zipPath, zipBuffer);
  console.log(`Created ${zipPath}`);
}

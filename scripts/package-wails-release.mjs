import JSZip from "jszip";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const packageJsonPath = path.join(rootDir, "package.json");
const wailsConfigPath = path.join(rootDir, "wails.json");
const buildBinDir = path.join(rootDir, "build", "bin");
const outputDir = path.join(rootDir, "dist", "release");

const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
const wailsConfig = JSON.parse(await readFile(wailsConfigPath, "utf8"));

const version = packageJson.version || "0.0.0";
const outputName = wailsConfig.outputfilename || packageJson.name || "app";

const addEntryToZip = async (zip, entryPath, zipPath) => {
  const entryStat = await stat(entryPath);
  if (entryStat.isDirectory()) {
    const childEntries = await readdir(entryPath);
    await Promise.all(
      childEntries.map((child) =>
        addEntryToZip(zip, path.join(entryPath, child), path.posix.join(zipPath, child))
      )
    );
    return;
  }

  const data = await readFile(entryPath);
  zip.file(zipPath, data);
};

const entries = await readdir(buildBinDir, { withFileTypes: true }).catch(() => []);
const artifacts = entries.filter((entry) => {
  if (!entry.name.startsWith(outputName)) {
    return false;
  }
  if (entry.name.endsWith(".zip")) {
    return false;
  }
  return entry.isFile() || entry.isDirectory();
});

if (artifacts.length === 0) {
  console.error(`No Wails build artifacts found in ${buildBinDir}`);
  process.exit(1);
}

await mkdir(outputDir, { recursive: true });

for (const artifact of artifacts) {
  const artifactPath = path.join(buildBinDir, artifact.name);
  const label = artifact.name.replace(/\.(exe|app)$/i, "") || artifact.name;
  const zipName = `${label}-v${version}.zip`;
  const zip = new JSZip();

  await addEntryToZip(zip, artifactPath, artifact.name);

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const zipPath = path.join(outputDir, zipName);
  await writeFile(zipPath, zipBuffer);
  console.log(`Created ${zipPath}`);
}

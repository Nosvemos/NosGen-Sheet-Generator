const sharp = require("sharp");
async function main() {
  await Promise.all([
    sharp({ create: { width: 64, height: 64, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } } }).png().toFile("test-frames/frame_01.png"),
    sharp({ create: { width: 48, height: 80, channels: 4, background: { r: 0, g: 255, b: 0, alpha: 1 } } }).png().toFile("test-frames/frame_02.png"),
    sharp({ create: { width: 96, height: 48, channels: 4, background: { r: 0, g: 0, b: 255, alpha: 1 } } }).png().toFile("test-frames/frame_03.png"),
    sharp({ create: { width: 32, height: 32, channels: 4, background: { r: 255, g: 255, b: 0, alpha: 1 } } }).png().toFile("test-frames/frame_04.png"),
    sharp({ create: { width: 64, height: 64, channels: 4, background: { r: 255, g: 128, b: 0, alpha: 1 } } }).png().toFile("test-frames/frame_05.png"),
  ]);
  console.log("Frames created");
}
main().catch(console.error);

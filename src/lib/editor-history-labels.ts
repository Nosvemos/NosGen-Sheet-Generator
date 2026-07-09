import type { EditorState } from "@/lib/editor-reducer";

const HISTORY_LABEL_OVERRIDES: Partial<Record<keyof EditorState, string>> = {
  frames: "Frames updated",
  currentFrameIndex: "Frame changed",
  selectedPointId: "Point selected",
  editorMode: "Tool changed",
  pivotMode: "Pivot changed",
  viewMode: "View changed",
  appMode: "App mode changed",
  theme: "Theme changed",
  rows: "Rows updated",
  padding: "Padding updated",
  showGrid: "Grid toggled",
  showPoints: "Points toggled",
  frameZoom: "Zoom updated",
  panOffset: "Panned view",
  autoFillShape: "Auto fill shape",
  autoFillSmoothing: "Auto fill smoothing",
  spriteDirection: "Sprite direction",
  fps: "FPS updated",
  speed: "Speed updated",
  reverse: "Reverse toggled",
  loop: "Loop toggled",
  isPlaying: "Playback toggled",
  isKeyframesOpen: "Keyframes panel",
  exportScale: "Export scale",
  exportSmoothing: "Export smoothing",
  exportSize: "Export size",
  exportFormat: "Export format",
  exportJsonMode: "JSON export mode",
  atlasPackingMode: "Atlas packing mode",
  webpQuality: "WebP quality",
  ktx2Quality: "KTX2 quality",
  isSpriteSettingsOpen: "Sprite settings",
  isAtlasSettingsOpen: "Atlas settings",
  isExportQualityOpen: "Export quality",
  isSettingsOpen: "Settings",
  supportLegacyAtlas: "Legacy atlas support",
  historyLimit: "History limit",
  hotkeys: "Hotkeys updated",
  pointGroups: "Point groups updated",
  selectedGroupId: "Point group selected",
  newGroupName: "Group name",
  groupEntrySelection: "Group entry",
  isGroupPreviewActive: "Group preview",
  isGroupPreviewPlaying: "Group playback",
  groupPreviewIndex: "Group preview frame",
  isPointsOpen: "Points panel",
  isPointGroupsOpen: "Point groups panel",
  isProjectSettingsOpen: "Project settings",
  isMagnetEnabled: "Magnet snap",
  projectName: "Project name",
  animationName: "Animation name",
  animationFrameSelection: "Animation frames",
};

export const formatHistoryLabel = (key: keyof EditorState) => {
  const override = HISTORY_LABEL_OVERRIDES[key];
  if (override) {
    return override;
  }
  const label = String(key)
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim();
  return label ? `Update ${label}` : "Update";
};

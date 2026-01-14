export type HotkeyAction =
  | "undo"
  | "redo"
  | "playPause"
  | "nextFrame"
  | "prevFrame"
  | "firstFrame"
  | "lastFrame"
  | "toggleGrid"
  | "togglePoints";

export type HotkeyMap = Record<HotkeyAction, string>;

export const DEFAULT_HISTORY_LIMIT = 50;

export const DEFAULT_HOTKEYS: HotkeyMap = {
  undo: "Ctrl+Z",
  redo: "Ctrl+Y",
  playPause: "Space",
  nextFrame: "ArrowRight",
  prevFrame: "ArrowLeft",
  firstFrame: "Home",
  lastFrame: "End",
  toggleGrid: "G",
  togglePoints: "P",
};

type HotkeyEvent = {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
};

const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta"]);

const formatKey = (key: string) => {
  if (key === " ") {
    return "Space";
  }
  if (key.length === 1) {
    return key.toUpperCase();
  }
  return key;
};

export const formatHotkey = (event: HotkeyEvent) => {
  const key = formatKey(event.key);
  if (MODIFIER_KEYS.has(key)) {
    return null;
  }
  const parts: string[] = [];
  if (event.ctrlKey) {
    parts.push("Ctrl");
  }
  if (event.metaKey) {
    parts.push("Cmd");
  }
  if (event.altKey) {
    parts.push("Alt");
  }
  if (event.shiftKey) {
    parts.push("Shift");
  }
  parts.push(key);
  return parts.join("+");
};

export const isEditableTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  if (!element) {
    return false;
  }
  const tag = element.tagName;
  if (!tag) {
    return false;
  }
  if (element.isContentEditable) {
    return true;
  }
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    Boolean(element.closest("[data-hotkey-input]"))
  );
};

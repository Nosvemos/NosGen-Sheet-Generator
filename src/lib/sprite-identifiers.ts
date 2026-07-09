export const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `pt-${Math.random().toString(36).slice(2, 10)}`;
};

export const normalizeExportName = (value: string, fallback: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }
  const safe = trimmed
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 64);
  return safe || fallback;
};

export const createPointColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue} 70% 55%)`;
};

const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

// Stable color per name. Used by the CLI so re-runs are deterministic.
export const deterministicColor = (name: string): string => {
  const hue = hashString(name) % 360;
  return `hsl(${hue} 70% 55%)`;
};

import { useEffect, useState } from "react";
import type { RefObject } from "react";

type StageSize = { width: number; height: number };

type UseStageSizingParams = {
  stageRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
};

export const useStageSizing = ({ stageRef, canvasRef }: UseStageSizingParams) => {
  const [stageSize, setStageSize] = useState<StageSize>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const element = stageRef.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setStageSize({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height),
        });
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [stageRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(stageSize.width * dpr));
    canvas.height = Math.max(1, Math.floor(stageSize.height * dpr));
    canvas.style.width = `${stageSize.width}px`;
    canvas.style.height = `${stageSize.height}px`;
  }, [canvasRef, stageSize]);

  return stageSize;
};

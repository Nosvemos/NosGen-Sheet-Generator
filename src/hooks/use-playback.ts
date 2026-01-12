import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";

type UsePlaybackParams = {
  isPlaying: boolean;
  framesLength: number;
  fps: number;
  speed: number;
  reverse: boolean;
  loop: boolean;
  setCurrentFrameIndex: Dispatch<SetStateAction<number>>;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
};

export const usePlayback = ({
  isPlaying,
  framesLength,
  fps,
  speed,
  reverse,
  loop,
  setCurrentFrameIndex,
  setIsPlaying,
}: UsePlaybackParams) => {
  useEffect(() => {
    if (!isPlaying || framesLength === 0) {
      return;
    }
    const safeFps = Math.max(1, fps);
    const intervalMs = 1000 / (safeFps * speed);
    const timer = window.setInterval(() => {
      setCurrentFrameIndex((prev) => {
        let next = reverse ? prev - 1 : prev + 1;
        if (next < 0 || next >= framesLength) {
          if (loop) {
            next = reverse ? framesLength - 1 : 0;
          } else {
            setIsPlaying(false);
            return prev;
          }
        }
        return next;
      });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [
    isPlaying,
    framesLength,
    fps,
    speed,
    reverse,
    loop,
    setCurrentFrameIndex,
    setIsPlaying,
  ]);
};

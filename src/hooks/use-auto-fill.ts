import { useCallback, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import type {
  AutoFillModel,
  AutoFillShape,
  FrameData,
  FramePoint,
  SpriteDirection,
} from "@/lib/editor-types";
import {
  clamp,
  computeCircleFit,
  computeEllipseFit,
  computeSquareFit,
  interpolateLinear,
  interpolateTangent,
  squarePointAt,
} from "@/lib/editor-helpers";

type UseAutoFillParams = {
  frames: FrameData[];
  selectedPointId: string | null;
  selectedPoint: FramePoint | null;
  autoFillShape: AutoFillShape;
  spriteDirection: SpriteDirection;
  setFrames: Dispatch<SetStateAction<FrameData[]>>;
};

export const useAutoFill = ({
  frames,
  selectedPointId,
  selectedPoint,
  autoFillShape,
  spriteDirection,
  setFrames,
}: UseAutoFillParams) => {
  const selectedPointKeyframes = useMemo(() => {
    if (!selectedPointId) {
      return [];
    }
    const keyframes = frames.flatMap((frame, frameIndex) => {
      const point = frame.points.find((item) => item.id === selectedPointId);
      if (point && point.isKeyframe) {
        return [
          {
            frameIndex,
            x: point.x,
            y: point.y,
          },
        ];
      }
      return [];
    });
    return keyframes.sort((a, b) => a.frameIndex - b.frameIndex);
  }, [frames, selectedPointId]);

  const selectedAutoFillModel = useMemo<AutoFillModel | null>(() => {
    if (selectedPointKeyframes.length < 2 || frames.length === 0) {
      return null;
    }
    if (autoFillShape === "linear") {
      return { shape: "linear", points: selectedPointKeyframes };
    }
    if (autoFillShape === "tangent") {
      return { shape: "tangent", points: selectedPointKeyframes };
    }
    if (autoFillShape === "circle") {
      const circle = computeCircleFit(
        selectedPointKeyframes,
        frames.length,
        spriteDirection
      );
      return circle ? { shape: "circle", ...circle } : null;
    }
    if (autoFillShape === "square") {
      const square = computeSquareFit(
        selectedPointKeyframes,
        frames.length,
        spriteDirection
      );
      return square ? { shape: "square", ...square } : null;
    }
    const ellipse = computeEllipseFit(
      selectedPointKeyframes,
      frames.length,
      spriteDirection
    );
    return ellipse ? { shape: "ellipse", ...ellipse } : null;
  }, [autoFillShape, frames.length, selectedPointKeyframes, spriteDirection]);

  const selectedAutoFillPositions = useMemo(() => {
    if (!selectedAutoFillModel || frames.length === 0) {
      return null;
    }
    const totalFrames = frames.length;
    const directionSign = spriteDirection === "clockwise" ? 1 : -1;
    const positions = Array.from({ length: totalFrames }, (_, index) => {
      if (selectedAutoFillModel.shape === "ellipse") {
        const cosRot = Math.cos(selectedAutoFillModel.rotation);
        const sinRot = Math.sin(selectedAutoFillModel.rotation);
        const angle =
          directionSign * (index / totalFrames) * Math.PI * 2 +
          selectedAutoFillModel.phase;
        const localX = selectedAutoFillModel.rx * Math.cos(angle);
        const localY = selectedAutoFillModel.ry * Math.sin(angle);
        return {
          x: selectedAutoFillModel.cx + localX * cosRot - localY * sinRot,
          y: selectedAutoFillModel.cy + localX * sinRot + localY * cosRot,
        };
      }
      if (selectedAutoFillModel.shape === "circle") {
        const angle =
          directionSign * (index / totalFrames) * Math.PI * 2 +
          selectedAutoFillModel.phase;
        return {
          x: selectedAutoFillModel.cx + selectedAutoFillModel.r * Math.cos(angle),
          y: selectedAutoFillModel.cy + selectedAutoFillModel.r * Math.sin(angle),
        };
      }
      if (selectedAutoFillModel.shape === "square") {
        const turn =
          directionSign * (index / totalFrames) + selectedAutoFillModel.phase;
        return squarePointAt(
          selectedAutoFillModel.cx,
          selectedAutoFillModel.cy,
          selectedAutoFillModel.size,
          turn
        );
      }
      if (selectedAutoFillModel.shape === "tangent") {
        return interpolateTangent(
          selectedAutoFillModel.points,
          index,
          totalFrames
        );
      }
      return interpolateLinear(selectedAutoFillModel.points, index, totalFrames);
    });
    selectedPointKeyframes.forEach((keyframe) => {
      if (keyframe.frameIndex >= 0 && keyframe.frameIndex < positions.length) {
        positions[keyframe.frameIndex] = { x: keyframe.x, y: keyframe.y };
      }
    });
    return positions;
  }, [
    frames.length,
    selectedAutoFillModel,
    selectedPointKeyframes,
    spriteDirection,
  ]);

  const handleAutoFill = useCallback(() => {
    if (!selectedPoint || !selectedAutoFillPositions || frames.length === 0) {
      return;
    }
    setFrames((prev) =>
      prev.map((frame, index) => {
        const point = frame.points.find((item) => item.id === selectedPoint.id);
        if (!point || point.isKeyframe) {
          return frame;
        }
        const target = selectedAutoFillPositions[index];
        if (!target) {
          return frame;
        }
        const nextX = clamp(Math.round(target.x), 0, frame.width);
        const nextY = clamp(Math.round(target.y), 0, frame.height);
        return {
          ...frame,
          points: frame.points.map((item) =>
            item.id === selectedPoint.id
              ? { ...item, x: nextX, y: nextY }
              : item
          ),
        };
      })
    );
  }, [frames.length, selectedAutoFillPositions, selectedPoint, setFrames]);

  return {
    selectedPointKeyframes,
    selectedAutoFillModel,
    selectedAutoFillPositions,
    handleAutoFill,
  };
};

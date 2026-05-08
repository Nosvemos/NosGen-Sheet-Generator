import { useEffect, useRef, useState, type CSSProperties } from "react";
import { EditorProvider } from "@/context/editor-context";
import { LeftSidebarContainer } from "@/components/editor/LeftSidebarContainer";
import { MainStageContainer } from "@/components/editor/MainStageContainer";
import { RightSidebarContainer } from "@/components/editor/RightSidebarContainer";
import { useEditorPanels } from "@/hooks/use-editor-panels";

const LEFT_SIDEBAR_MIN_WIDTH = 260;
const LEFT_SIDEBAR_MAX_WIDTH = 560;

export function EditorApp() {
  const panels = useEditorPanels();
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(280);
  const dragStartRef = useRef<{ pointerX: number; width: number } | null>(null);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragStartRef.current) {
        return;
      }
      const deltaX = event.clientX - dragStartRef.current.pointerX;
      const nextWidth = Math.max(
        LEFT_SIDEBAR_MIN_WIDTH,
        Math.min(LEFT_SIDEBAR_MAX_WIDTH, dragStartRef.current.width + deltaX)
      );
      setLeftSidebarWidth(nextWidth);
    };
    const handlePointerUp = () => {
      if (!dragStartRef.current) {
        return;
      }
      dragStartRef.current = null;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, []);

  return (
    <EditorProvider value={panels}>
      <div
        className="h-screen w-full divide-y divide-border/60 overflow-hidden p-0 lg:grid lg:grid-cols-[var(--left-sidebar-width)_8px_minmax(0,1fr)_320px] lg:divide-x lg:divide-y-0 lg:gap-0"
        style={
          ({
            "--left-sidebar-width": `${leftSidebarWidth}px`,
          } as CSSProperties)
        }
      >
        <LeftSidebarContainer />
        <div
          role="separator"
          aria-orientation="vertical"
          className="hidden cursor-col-resize border-x border-border/60 bg-background/70 transition-colors hover:bg-accent/20 lg:block"
          onPointerDown={(event) => {
            dragStartRef.current = {
              pointerX: event.clientX,
              width: leftSidebarWidth,
            };
            document.body.style.userSelect = "none";
            document.body.style.cursor = "col-resize";
          }}
        />
        <MainStageContainer />
        <RightSidebarContainer />
      </div>
    </EditorProvider>
  );
}

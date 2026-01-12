import { LeftSidebar } from "@/components/editor/LeftSidebar";
import { useEditorContext } from "@/context/editor-context";

export function LeftSidebarContainer() {
  const { leftSidebar } = useEditorContext();
  return <LeftSidebar {...leftSidebar} />;
}

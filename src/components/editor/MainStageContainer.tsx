import { MainStage } from "@/components/editor/MainStage";
import { useEditorContext } from "@/context/editor-context";

export function MainStageContainer() {
  const { mainStage } = useEditorContext();
  return <MainStage {...mainStage} />;
}

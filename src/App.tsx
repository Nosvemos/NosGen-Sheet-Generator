import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/ui/toast";
import { EditorApp } from "@/components/editor/EditorApp";

function App() {
  return (
    <TooltipProvider>
      <ToastProvider>
        <EditorApp />
      </ToastProvider>
    </TooltipProvider>
  );
}

export default App;

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { I18nProvider } from "@/lib/i18n";
import { app, events, init as initNeutralino } from "@neutralinojs/lib";

if (typeof window !== "undefined" && "NL_OS" in window) {
  initNeutralino();
  events.on("windowClose", () => {
    app.exit();
  });
}

const storedTheme = window.localStorage.getItem("sg-theme");
const initialTheme = storedTheme === "light" ? "light" : "dark";
document.documentElement.classList.toggle("dark", initialTheme === "dark");
document.documentElement.style.colorScheme = initialTheme;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
);

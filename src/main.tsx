import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installGlobalErrorLogging } from "./lib/logger";
import { ErrorBoundary } from "./components/ErrorBoundary";

installGlobalErrorLogging();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

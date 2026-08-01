import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installGlobalErrorLogging } from "./lib/logger";

installGlobalErrorLogging();

createRoot(document.getElementById("root")!).render(<App />);

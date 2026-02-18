import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { initializeSheetConfigs } from "./services/googleSheetsService";

// Initialize dynamic sheet configurations
initializeSheetConfigs().catch(console.error);

createRoot(document.getElementById("root")!).render(<App />);

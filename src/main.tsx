import { createRoot } from "react-dom/client";
import moment from "moment";
import "moment/locale/es";
import App from "./App";
import { validateEnv } from "@/lib/env";

moment.locale("es");

validateEnv();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(<App />);

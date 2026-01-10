import { createRoot } from "react-dom/client";
import App from "./App";
import { validateEnv } from "@/lib/env";

validateEnv();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(<App />);

// Service Worker Registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('Service Worker registrado con éxito:', registration);
    })
    .catch(error => {
      console.log('Error al registrar el Service Worker:', error);
    });
}

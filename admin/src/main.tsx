import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@fontsource/ibm-plex-mono/700.css";

import App from "./App";
import "./styles.css";

if (
  "serviceWorker" in
  navigator
) {
  window.addEventListener(
    "load",
    () => {
      void navigator.serviceWorker.register(
        "/sw.js",
      );
    },
  );
}

createRoot(
  document.getElementById(
    "root",
  )!,
).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

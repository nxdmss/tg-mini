import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@fontsource/ibm-plex-mono/700.css";

import "./index.css";
import "./cursors.css";
import "./searchTypography.css";
import "./brandRuntime";

import Router from "./router";
import { CartProvider } from "./cart";
import { initTelegram } from "./telegram";

initTelegram();
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, { once: true });
}

const rootElement =
  document.getElementById("root");

if (!rootElement) {
  throw new Error(
    'Root element with id="root" was not found.',
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <CartProvider>
      <Router />
    </CartProvider>
  </StrictMode>,
);

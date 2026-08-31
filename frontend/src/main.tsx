import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@fontsource/ibm-plex-mono/700.css";

import "./index.css";

import Router from "./router";
import { CartProvider } from "./cart";
import { initTelegram } from "./telegram";
import { mountPiskaEgg } from "./piskaEgg";

initTelegram();
mountPiskaEgg();

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

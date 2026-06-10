import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Router from "./router";
import { CartProvider } from "./cart";
import { initTelegram } from "./telegram";

initTelegram();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CartProvider>
      <Router />
    </CartProvider>
  </StrictMode>,
);

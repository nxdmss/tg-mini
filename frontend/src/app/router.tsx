import { createBrowserRouter } from "react-router-dom";
import HomePage from "../pages/HomePage";
import ProductPage from "../pages/ProductPage";
import CartPage from "../pages/CartPage";

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/product/:id", element: <ProductPage /> },
  { path: "/cart", element: <CartPage /> },
]);
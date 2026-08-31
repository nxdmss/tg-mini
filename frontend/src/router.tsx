import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import App from "./App";
import Admin from "./pages/Admin";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/admin"
          element={<Admin />}
        />

        {/*
          ONE persistent storefront route.
          App parses /, /catalog, /product/:id,
          /shop/:slug and /shop/:slug/product/:id itself.

          Because this Route never changes, React never destroys
          the catalog when ProductDetail opens.
        */}
        <Route
          path="/*"
          element={<App />}
        />
      </Routes>
    </BrowserRouter>
  );
}

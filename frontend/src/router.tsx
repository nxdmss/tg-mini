import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import App from "./App";
import Admin from "./pages/Admin";

function NotFound() {
  return (
    <Navigate
      to="/"
      replace
    />
  );
}

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<App />}
        />

        <Route
          path="/catalog"
          element={<App />}
        />

        <Route
          path="/product/:id"
          element={<App />}
        />

        <Route
          path="/shop/:shopSlug"
          element={<App />}
        />

        <Route
          path="/shop/:shopSlug/product/:id"
          element={<App />}
        />

        <Route
          path="/admin"
          element={<Admin />}
        />

        <Route
          path="*"
          element={
            <NotFound />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

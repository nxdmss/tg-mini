import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import App from "./App";
import Admin from "./pages/Admin";

import {
  AdminGate,
} from "./components/AdminGate";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/admin"
          element={
            <AdminGate>
              <Admin />
            </AdminGate>
          }
        />

        {/*
          One persistent storefront route.
          This preserves the seamless catalog/product behavior.
        */}
        <Route
          path="/*"
          element={<App />}
        />
      </Routes>
    </BrowserRouter>
  );
}

import {
  lazy,
  Suspense,
} from "react";

import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import App from "./App";

import {
  AdminGate,
} from "./components/AdminGate";

/*
 * Admin and its large CSS/API graph are not part of the storefront startup.
 * The chunk is requested only after AdminGate has allowed access.
 */
const Admin = lazy(
  () =>
    import(
      "./pages/Admin"
    ),
);

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/admin"
          element={
            <AdminGate>
              <Suspense
                fallback={
                  <div
                    style={{
                      minHeight:
                        "100dvh",
                      background:
                        "#fff",
                    }}
                  />
                }
              >
                <Admin />
              </Suspense>
            </AdminGate>
          }
        />

        {/* Keep one persistent storefront instance. */}
        <Route
          path="/*"
          element={<App />}
        />
      </Routes>
    </BrowserRouter>
  );
}

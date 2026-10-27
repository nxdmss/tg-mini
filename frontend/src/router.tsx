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
import { AdminSectionNav } from "./components/AdminSectionNav";

import {
  AdminGate,
} from "./components/AdminGate";

/*
 * Admin and its large CSS/API graph are not part of the storefront startup.
 * The chunk is requested only after AdminGate has allowed access.
 */
const VisitorAnalytics = lazy(async () => ({ default: (await import("./components/VisitorAnalytics")).VisitorAnalytics }));
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
                <><AdminSectionNav /><Admin /></>
              </Suspense>
            </AdminGate>
          }
        />

        <Route path="/admin/visitors" element={<AdminGate><Suspense fallback={null}><AdminSectionNav /><main className="admin-page"><div className="container admin"><VisitorAnalytics /></div></main></Suspense></AdminGate>} />
        {/* Keep one persistent storefront instance. */}
        <Route
          path="/*"
          element={<App />}
        />
      </Routes>
    </BrowserRouter>
  );
}

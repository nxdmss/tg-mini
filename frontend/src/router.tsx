import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App";

const ADMIN_URL = "https://admin.swagystan.ru/";

function AdminRedirect() {
  useEffect(() => {
    window.location.replace(ADMIN_URL);
  }, []);

  return <a href={ADMIN_URL}>Открыть админку</a>;
}

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminRedirect />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
}

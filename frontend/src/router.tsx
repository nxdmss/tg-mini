import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Admin from "./pages/Admin";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
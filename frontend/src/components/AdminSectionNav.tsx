import { NavLink } from "react-router-dom";
import "./AdminSectionNav.css";

export function AdminSectionNav() {
  return (
    <nav className="admin-section-nav">
      <NavLink to="/admin" end>КАТАЛОГ И ЗАКАЗЫ</NavLink>
      <NavLink to="/admin/visitors">ПОСЕТИТЕЛИ</NavLink>
    </nav>
  );
}

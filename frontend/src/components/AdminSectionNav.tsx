import { NavLink } from "react-router-dom";
import "./AdminSectionNav.css";

export function AdminSectionNav() {
  return (
    <nav className="admin-section-nav" aria-label="Разделы админки">
      <NavLink to="/admin" end>Управление</NavLink>
      <NavLink to="/admin/visitors">Посетители</NavLink>
    </nav>
  );
}

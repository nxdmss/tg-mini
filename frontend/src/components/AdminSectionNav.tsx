import { NavLink, Link } from "react-router-dom";
import "./AdminSectionNav.css";
export function AdminSectionNav(){return <header className="swag-admin-nav"><Link to="/admin" className="swag-admin-nav__logo" aria-label="Товары"><img src="/logo.png" alt="SWAGYSTAN"/></Link><nav aria-label="Разделы админки"><NavLink to="/admin" end>Товары</NavLink><NavLink to="/admin/orders">Заказы</NavLink><NavLink to="/admin/visitors">Посетители</NavLink></nav><Link to="/catalog" className="swag-admin-nav__site">Магазин ↗</Link></header>;}

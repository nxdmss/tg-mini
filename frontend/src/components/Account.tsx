import { useEffect, useState } from "react";
import { getMe, getMyOrders, getApiErrorMessage, isWebLoggedIn, login, logout, register } from "../api";
import type { AuthUser, Order } from "../types";
import "./Account.css";

const statusNames: Record<Order["status"], string> = { PENDING: "ОФОРМЛЕН", PAID: "ОПЛАЧЕН", SHIPPED: "ОТПРАВЛЕН", DONE: "ДОСТАВЛЕН", CANCELLED: "ОТМЕНЁН" };
export function Account() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  async function refresh() {
    setBusy(true); setError("");
    try {
      const me = await getMe();
      setUser(me);
      try { setOrders(await getMyOrders()); }
      catch (e) { setError(getApiErrorMessage(e)); }
    } catch {
      setUser(null); setOrders([]);
      if (isWebLoggedIn()) { logout(); setError("СЕССИЯ ИСТЕКЛА. ВОЙДИ СНОВА."); }
    } finally { setBusy(false); }
  }
  useEffect(() => { void refresh(); }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      if (mode === "login") await login({ email, password });
      else await register({ email, password, name: name.trim() || undefined });
      await refresh();
    } catch (e) { setError(getApiErrorMessage(e)); setBusy(false); }
  }
  return <main className="container swag-account">
    <div className="swag-account__heading"><h1>ЛИЧНЫЙ КАБИНЕТ</h1><span>SWAGYSTAN / ACCOUNT</span></div>
    {busy ? <p className="swag-account__muted">ЗАГРУЗКА...</p> : user ? <>
      <section className="swag-account__section">
        <div className="swag-account__label">01 / ПРОФИЛЬ</div>
        <div className="swag-account__profile"><strong>{user.name || user.firstName || "ПОКУПАТЕЛЬ"}</strong><span>{user.email || "EMAIL НЕ УКАЗАН"}</span>{user.phone && <span>{user.phone}</span>}</div>
      </section>
      <section className="swag-account__section">
        <div className="swag-account__label">02 / МОИ ЗАКАЗЫ</div>
        {orders.length === 0 ? <p className="swag-account__muted">ЗАКАЗОВ ПОКА НЕТ</p> : orders.map(order => <article className="swag-account__order" key={order.id}>
          <div className="swag-account__orderhead"><strong>ЗАКАЗ № {order.id.slice(0, 8).toUpperCase()}</strong><span>{statusNames[order.status] || order.status}</span></div>
          {order.createdAt && <small>{new Date(order.createdAt).toLocaleDateString("ru-RU")}</small>}
          {order.items.map(item => <div className="swag-account__item" key={item.id}>
            {item.product?.images?.[0]?.url && <img src={item.product.images[0].url} alt="" />}
            <div><strong>{item.product?.name || "ТОВАР"}</strong><small>РАЗМЕР {item.size} · {item.quantity} ШТ.</small></div>
            <span>{(item.price * item.quantity).toLocaleString("ru-RU")} ₽</span>
          </div>)}
          <div className="swag-account__total">ИТОГО <strong>{order.items.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString("ru-RU")} ₽</strong></div>
        </article>)}
      </section>
      <section className="swag-account__section"><div className="swag-account__label">03 / СОХРАНЁННОЕ</div><a href="/favorites" className="swag-account__link">ИЗБРАННОЕ <span>↗</span></a></section>
      <button className="swag-account__exit" type="button" onClick={() => { logout(); setUser(null); setOrders([]); setError(""); }}>ВЫЙТИ ИЗ АККАУНТА ↗</button>
    </> : <section className="swag-account__section swag-account__auth">
      <div className="swag-account__label">{mode === "login" ? "ВХОД" : "РЕГИСТРАЦИЯ"}</div>
      <form onSubmit={submit}>
        {mode === "register" && <label>ИМЯ<input autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="КАК ТЕБЯ ЗОВУТ" /></label>}
        <label>EMAIL<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="EMAIL" /></label>
        <label>ПАРОЛЬ<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="ПАРОЛЬ" /></label>
        <button type="submit" className="swag-account__submit">{mode === "login" ? "ВОЙТИ ↗" : "СОЗДАТЬ АККАУНТ ↗"}</button>
      </form>
      <button type="button" className="swag-account__switch" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "НЕТ АККАУНТА? ЗАРЕГИСТРИРОВАТЬСЯ" : "УЖЕ ЕСТЬ АККАУНТ? ВОЙТИ"}</button>
    </section>}
    {error && <p className="swag-account__error" role="alert">{error}</p>}
  </main>;
}

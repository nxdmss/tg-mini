import { useEffect, useState } from "react";
import { api, authHeaders, getMe, getMyOrders, getApiErrorMessage, isWebLoggedIn, login, logout, register } from "../api";
import axios from "axios";
import { NumericText } from "./NumericText";
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

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const displayName = user?.name?.trim() || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || "Твой профиль";
  async function saveName(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const { data } = await api.patch<AuthUser>("/auth/me", { name: name.trim() }, { headers: authHeaders() });
      setUser(data); setEditing(false);
    } catch (e) { setError(getApiErrorMessage(e)); }
    finally { setSaving(false); }
  }

  async function refresh() {
    setBusy(true); setError("");
    try {
      const me = await getMe();
      setUser(me);
      try { setOrders(await getMyOrders()); }
      catch (e) { setError(getApiErrorMessage(e)); }
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        setUser(null); setOrders([]);
        if (isWebLoggedIn()) { logout(); setError("Войди снова"); }
      } else setError(getApiErrorMessage(e));
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
    <div className="swag-account__heading"><h1>КАБИНЕТ</h1></div>
    {busy ? <p className="swag-account__muted">ЗАГРУЗКА...</p> : user ? <>
      <section className="swag-account__hero">
        <div className="swag-account__identity">
          <h2>{displayName}</h2>
          {user.email && <p>{user.email}</p>}
          {user.phone && <p>{user.phone}</p>}
        </div>
        {editing ? <form className="swag-account__edit" onSubmit={saveName}>
          <label htmlFor="profile-name">Имя</label>
          <input id="profile-name" autoComplete="name" required maxLength={80} value={name} onChange={e => setName(e.target.value)} autoFocus />
          <div><button disabled={saving || !name.trim()} type="submit">{saving ? "СОХРАНЕНИЕ…" : "СОХРАНИТЬ"}</button>
          <button disabled={saving} type="button" onClick={() => setEditing(false)}>ОТМЕНА</button></div>
        </form> : <button className="swag-account__edit-trigger" onClick={() => { setName(user.name?.trim() || [user.firstName, user.lastName].filter(Boolean).join(" ")); setEditing(true); }}>ИЗМЕНИТЬ ИМЯ ↗</button>}
      </section>
      <nav className="swag-account__nav" aria-label="Разделы кабинета">
        <a href="#account-orders">ЗАКАЗЫ <span><NumericText text={String(orders.length)} /></span></a>
        <a href="/favorites">ИЗБРАННОЕ <span>↗</span></a>
      </nav>
      <section className="swag-account__section">
        <h2 id="account-orders" className="swag-account__label">МОИ ЗАКАЗЫ</h2>
        {orders.length === 0 ? <div className="swag-account__empty"><p>Пока без заказов</p><a href="/catalog">В КАТАЛОГ ↗</a></div> : orders.map(order => <article className="swag-account__order" key={order.id}>
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
      <button className="swag-account__exit" type="button" onClick={() => { logout(); setUser(null); setOrders([]); setError(""); }}>ВЫЙТИ ↗</button>
    </> : <section className="swag-account__section swag-account__auth">
      <div className="swag-account__label">{mode === "login" ? "ВХОД" : "РЕГИСТРАЦИЯ"}</div>
      <form onSubmit={submit}>
        {mode === "register" && <label>ИМЯ<input autoComplete="name" required maxLength={80} value={name} onChange={e => setName(e.target.value)} placeholder="КАК ТЕБЯ ЗОВУТ" /></label>}
        <label>EMAIL<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="EMAIL" /></label>
        <label>ПАРОЛЬ<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="ПАРОЛЬ" /></label>
        <button type="submit" className="swag-account__submit">{mode === "login" ? "ВОЙТИ ↗" : "СОЗДАТЬ АККАУНТ ↗"}</button>
      </form>
      <button type="button" className="swag-account__switch" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "СОЗДАТЬ АККАУНТ" : "ВОЙТИ"}</button>
    </section>}
    {error && <p className="swag-account__error" role="alert">{error}</p>}
  </main>;
}

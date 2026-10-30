import { useEffect, useState } from "react";
import { api, getMe, getMyOrders, getApiErrorMessage, isWebLoggedIn, login, logout, register, verifyRegistration } from "../api";
import axios from "axios";
import type { AuthUser, Order } from "../types";
import "./Account.css";

const statusNames: Record<Order["status"], string> = { PENDING: "ОФОРМЛЕН", PAID: "ОПЛАЧЕН", SHIPPED: "ОТПРАВЛЕН", DONE: "ДОСТАВЛЕН", CANCELLED: "ОТМЕНЁН" };
export function Account() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "reset" | "verify">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState("");
  const [resendAt, setResendAt] = useState(0);
  const [sending, setSending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  function switchMode(next: typeof mode) { setMode(next); setShowPassword(false); setCode(""); setPassword(""); setError(""); setNotice(""); }
  async function resend() {
    if (Date.now() < resendAt) { setError("Повторная отправка доступна через минуту"); return; }
    setSending(true); setError("");
    try {
      if (mode === "verify") await register({ email, password, name });
      else await api.post("/auth/password/forgot", { email });
      setResendAt(Date.now() + 60000); setNotice("Код запрошен. Проверь почту и спам.");
    } catch (e) { setError(getApiErrorMessage(e)); }
    finally { setSending(false); }
  }

  const displayName = user?.name?.trim() || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || "Твой профиль";
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
    event.preventDefault(); setSending(true); setError(""); setNotice("");
    try {
      if (mode === "login") { await login({ email, password }); await refresh(); }
      else if (mode === "register") {
        await register({ email, password, name: name.trim() });
        setMode("verify"); setCode(""); setResendAt(Date.now() + 60000);
      } else if (mode === "verify") { await verifyRegistration(email, code); setPassword(""); await refresh(); }
      else if (mode === "forgot") {
        await api.post("/auth/password/forgot", { email });
        setMode("reset"); setCode(""); setPassword(""); setResendAt(Date.now() + 60000);
        setNotice("Если аккаунт существует, код придёт на почту.");
      } else {
        await api.post("/auth/password/reset", { email, code, password });
        switchMode("login"); setNotice("Пароль изменён. Войди снова.");
      }
    } catch (e) { setError(getApiErrorMessage(e)); }
    finally { setSending(false); }
  }
  const authTitle = {
    login: "ВХОД", register: "РЕГИСТРАЦИЯ", verify: "ПОДТВЕРДИ ПОЧТУ",
    forgot: "ВОССТАНОВЛЕНИЕ", reset: "НОВЫЙ ПАРОЛЬ",
  }[mode];
  const submitLabel = {
    login: "ВОЙТИ", register: "ПОЛУЧИТЬ КОД", verify: "ПОДТВЕРДИТЬ",
    forgot: "ПОЛУЧИТЬ КОД", reset: "СОХРАНИТЬ ПАРОЛЬ",
  }[mode];
  const confirming = mode === "verify" || mode === "reset";

  return (
    <main className={`container swag-account${user ? "" : " swag-account--auth"}`}>
      {busy ? <p className="swag-account__muted" role="status">ЗАГРУЗКА…</p> : user ? <>
        <div className="swag-account__heading"><h1>КАБИНЕТ</h1></div>
        <section className="swag-account__hero">
          <div className="swag-account__identity">
            <h2>{displayName}</h2>
            {user.email && <p>{user.email}</p>}
            {user.phone && <p>{user.phone}</p>}
          </div>

        </section>
        {error && <p className="swag-account__error" role="alert">{error}</p>}
        <nav className="swag-account__nav" aria-label="Разделы кабинета">
          <a href="/favorites">ИЗБРАННОЕ <span aria-hidden="true">↗</span></a>
        </nav>
        <section className="swag-account__section" aria-labelledby="account-orders">
          <h2 id="account-orders" className="swag-account__label">МОИ ЗАКАЗЫ</h2>
          {orders.length === 0 ? <div className="swag-account__empty">
            <p>Пока без заказов</p>
          </div> : orders.map(order => <article className="swag-account__order" key={order.id}>
            <div className="swag-account__orderhead">
              <strong>ЗАКАЗ № {order.id.slice(0, 8).toUpperCase()}</strong>
              <span>{statusNames[order.status] || order.status}</span>
            </div>
            {order.createdAt && <small>{new Date(order.createdAt).toLocaleDateString("ru-RU")}</small>}
            {order.items.map(item => <div className="swag-account__item" key={item.id}>
              {item.product?.images?.[0]?.url && <img src={item.product.images[0].url} alt="" loading="lazy" />}
              <div><strong>{item.product?.name || "ТОВАР"}</strong><small>РАЗМЕР {item.size} · {item.quantity} ШТ.</small></div>
              <span>{(item.price * item.quantity).toLocaleString("ru-RU")} ₽</span>
            </div>)}
            <div className="swag-account__total"><span>ИТОГО</span><strong>{order.items.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString("ru-RU")} ₽</strong></div>
          </article>)}
        </section>
        <button className="swag-account__exit" type="button" onClick={() => {
          logout(); setUser(null); setOrders([]); setError(""); setShowPassword(false);
        }}>ВЫЙТИ ИЗ АККАУНТА</button>
      </> : <section className="swag-account__auth" aria-labelledby="account-auth-title">
        <h1 id="account-auth-title" className="swag-account__auth-title">{authTitle}</h1>
        {confirming && <p className="swag-account__destination">{email}</p>}
        <form onSubmit={submit} aria-busy={sending}>
          {mode === "register" && <div className="swag-account__field">
            <label htmlFor="account-name">ИМЯ</label>
            <input id="account-name" autoComplete="name" placeholder="Как к тебе обращаться" required maxLength={80} value={name} onChange={e => setName(e.target.value)} />
          </div>}
          {!confirming && <div className="swag-account__field">
            <label htmlFor="account-email">EMAIL</label>
            <input id="account-email" type="email" autoComplete="email" placeholder="you@example.com" autoCapitalize="none" spellCheck={false} required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} />
          </div>}
          {confirming && <div className="swag-account__field">
            <label htmlFor="account-code">КОД ИЗ ПИСЬМА</label>
            <input id="account-code" className="swag-account__code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} aria-describedby="account-code-hint" />
            <p id="account-code-hint" className="swag-account__hint">Действует 10 минут</p>
          </div>}
          {mode !== "forgot" && mode !== "verify" && <div className="swag-account__field">
            <div className="swag-account__field-heading">
              <label htmlFor="account-password">{mode === "reset" ? "НОВЫЙ ПАРОЛЬ" : "ПАРОЛЬ"}</label>
              {mode === "login" && <button disabled={sending} type="button" className="swag-account__text-button" onClick={() => switchMode("forgot")}>Забыли?</button>}
            </div>
            <div className="swag-account__password">
              <input id="account-password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder={mode === "login" ? "Твой пароль" : "Не меньше 8 символов"} required minLength={mode === "login" ? 6 : 8} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? "СКРЫТЬ" : "ПОКАЗАТЬ"}</button>
            </div>
          </div>}
          {error && <p className="swag-account__error" role="alert">{error}</p>}
          {notice && <p className="swag-account__notice" role="status">{notice}</p>}
          <button disabled={sending} type="submit" className="swag-account__submit">{sending ? "ПОДОЖДИ…" : submitLabel}<span aria-hidden="true">↗</span></button>
        </form>
        <div className="swag-account__auth-actions">
          {confirming && <button disabled={sending} type="button" className="swag-account__switch" onClick={resend}>ОТПРАВИТЬ ЕЩЁ РАЗ</button>}
          <button disabled={sending} type="button" className="swag-account__switch" onClick={() => switchMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "СОЗДАТЬ АККАУНТ" : "К ВХОДУ"}</button>
        </div>
      </section>}
    </main>
  );
}

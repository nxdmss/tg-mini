import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import { checkAdminAccess } from "../adminAccessApi";
import { getApiErrorMessage, login } from "../api";
import "./AdminGate.css";

type AccessState = "checking" | "allowed" | "denied";

export function AdminGate({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState<AccessState>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void checkAdminAccess()
      .then(() => {
        if (active) setAccess("allowed");
      })
      .catch((reason: unknown) => {
        if (!active) return;
        if (axios.isAxiosError(reason) && reason.response?.status === 403) {
          setError("Аккаунт найден, но у него нет прав администратора.");
        } else if (axios.isAxiosError(reason) && reason.response?.status === 401) {
          setError("Сессия истекла. Войди снова.");
        } else if (!(reason instanceof Error && reason.message === "ADMIN_AUTH_REQUIRED")) {
          setError(getApiErrorMessage(reason));
        }
        setAccess("denied");
      });
    return () => {
      active = false;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await login({ email: email.trim(), password });
      await checkAdminAccess();
      setPassword("");
      setAccess("allowed");
    } catch (reason) {
      if (axios.isAxiosError(reason) && reason.response?.status === 403) {
        setError("Нет прав администратора. Добавь этот email в ADMIN_EMAILS на сервере или выдай аккаунту роль ADMIN/MANAGER.");
      } else {
        setError(getApiErrorMessage(reason));
      }
      setAccess("denied");
    } finally {
      setSubmitting(false);
    }
  }

  if (access === "checking") {
    return <div className="admin-gate__loading" aria-label="Проверка доступа" />;
  }

  if (access === "denied") {
    return (
      <main className="admin-gate">
        <section className="admin-gate__panel">
          <p className="admin-gate__eyebrow">SWAGYSTAN / ADMIN</p>
          <h1>УПРАВЛЕНИЕ</h1>
          <p className="admin-gate__description">
            Вход через браузер. Используй email и пароль аккаунта SWAGYSTAN.
          </p>
          <form className="admin-gate__form" onSubmit={submit}>
            <label>
              EMAIL
              <input type="email" autoComplete="username" autoCapitalize="none"
                spellCheck={false} required maxLength={254} value={email}
                onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              ПАРОЛЬ
              <input type="password" autoComplete="current-password" required
                minLength={6} maxLength={72} value={password}
                onChange={(event) => setPassword(event.target.value)} />
            </label>
            {error && <p className="admin-gate__error" role="alert">{error}</p>}
            <button type="submit" disabled={submitting}>
              {submitting ? "ПРОВЕРКА…" : "ВОЙТИ В АДМИНКУ"}
              <span aria-hidden="true">↗</span>
            </button>
          </form>
          <div className="admin-gate__links">
            <Link to="/account">Создать аккаунт / восстановить пароль</Link>
            <Link to="/">Вернуться в магазин</Link>
          </div>
        </section>
      </main>
    );
  }
  return <>{children}</>;
}

import { useState } from "react";
import type { FormEvent } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  getApiErrorMessage,
  register,
} from "../api";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (password.length < 6) {
      setError(
        "Пароль должен содержать минимум 6 символов.",
      );

      return;
    }

    setLoading(true);

    try {
      await register({
        name: name.trim() || undefined,
        email,
        password,
      });

      navigate("/");
    } catch (error) {
      setError(
        getApiErrorMessage(error),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
        background: "#fff",
        color: "#111",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "420px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <Link
          to="/"
          style={{
            color: "#111",
            textDecoration: "none",
            marginBottom: "20px",
          }}
        >
          ← Магазин
        </Link>

        <h1
          style={{
            fontSize: "32px",
            margin: 0,
          }}
        >
          Регистрация
        </h1>

        <p
          style={{
            margin: "0 0 16px",
            color: "#666",
          }}
        >
          Создайте аккаунт для заказов через сайт
        </p>

        <input
          type="text"
          placeholder="Имя"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          autoComplete="name"
          style={{
            height: "52px",
            padding: "0 16px",
            border: "1px solid #ddd",
            borderRadius: "12px",
            fontSize: "16px",
          }}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          required
          autoComplete="email"
          style={{
            height: "52px",
            padding: "0 16px",
            border: "1px solid #ddd",
            borderRadius: "12px",
            fontSize: "16px",
          }}
        />

        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          required
          minLength={6}
          autoComplete="new-password"
          style={{
            height: "52px",
            padding: "0 16px",
            border: "1px solid #ddd",
            borderRadius: "12px",
            fontSize: "16px",
          }}
        />

        {error && (
          <div
            style={{
              padding: "12px 14px",
              background: "#f5f5f5",
              borderRadius: "10px",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            height: "52px",
            border: 0,
            borderRadius: "12px",
            background: "#111",
            color: "#fff",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          {loading
            ? "Создаем..."
            : "Создать аккаунт"}
        </button>

        <div
          style={{
            textAlign: "center",
          }}
        >
          Уже есть аккаунт?{" "}
          <Link
            to="/login"
            style={{
              color: "#111",
            }}
          >
            Войти
          </Link>
        </div>
      </form>
    </main>
  );
}
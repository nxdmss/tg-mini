import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  Navigate,
} from "react-router-dom";

import {
  checkAdminAccess,
} from "../adminAccessApi";

type AccessState =
  | "checking"
  | "allowed"
  | "denied";

export function AdminGate({
  children,
}: {
  children: ReactNode;
}) {
  const [
    access,
    setAccess,
  ] =
    useState<AccessState>(
      "checking",
    );

  useEffect(() => {
    let active = true;

    void checkAdminAccess()
      .then(() => {
        if (active) {
          setAccess(
            "allowed",
          );
        }
      })
      .catch(() => {
        if (active) {
          setAccess(
            "denied",
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (access === "denied") {
    return (
      <main style={{padding: 32, fontFamily: '"IBM Plex Mono", monospace'}}>
        <h1>НУЖЕН ВХОД АДМИНИСТРАТОРА</h1>
        <p>Войди в учётную запись администратора или открой админку через Telegram.</p>
        <Link to="/account">ПЕРЕЙТИ К ВХОДУ</Link>
      </main>
    );
  }

  if (
    access ===
    "checking"
  ) {
    return (
      <div
        style={{
          minHeight:
            "100dvh",
          background:
            "#fff",
        }}
      />
    );
  }

  return <>{children}</>;
}

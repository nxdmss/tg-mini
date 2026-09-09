import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  Navigate,
} from "react-router-dom";

import {
  getAdminShops,
} from "../shopAdminApi";

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

    /*
     * IMPORTANT:
     * Never cache admin access in module/global state.
     * Every mount of /admin must be verified against backend again,
     * because Telegram account/session can change while the webview lives.
     */
    void getAdminShops()
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

  if (
    access ===
    "denied"
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
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

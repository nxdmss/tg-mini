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

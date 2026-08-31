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

let cachedAccess:
  AccessState = "checking";

let accessPromise:
  Promise<boolean> | null =
    null;

async function verifyAdmin() {
  if (
    cachedAccess ===
    "allowed"
  ) {
    return true;
  }

  if (
    cachedAccess ===
    "denied"
  ) {
    return false;
  }

  if (!accessPromise) {
    accessPromise =
      getAdminShops()
        .then(() => {
          cachedAccess =
            "allowed";

          return true;
        })
        .catch(() => {
          cachedAccess =
            "denied";

          return false;
        })
        .finally(() => {
          accessPromise =
            null;
        });
  }

  return accessPromise;
}

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
      cachedAccess,
    );

  useEffect(() => {
    if (
      access !==
      "checking"
    ) {
      return;
    }

    let active = true;

    void verifyAdmin().then(
      (allowed) => {
        if (!active) {
          return;
        }

        setAccess(
          allowed
            ? "allowed"
            : "denied",
        );
      },
    );

    return () => {
      active = false;
    };
  }, [access]);

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

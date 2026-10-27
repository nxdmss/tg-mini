import { api } from "./api";

const KEY = "swagystan:visitor-id";

function trackingAllowed(): boolean {
  return navigator.doNotTrack !== "1" &&
    !(navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl;
}

function visitorId(): string | null {
  try {
    let id = localStorage.getItem(KEY);
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export async function sendVisitorPing(path: string): Promise<void> {
  if (!trackingAllowed() || document.hidden) return;
  const id = visitorId();
  if (!id) return;
  try {
    await api.post("/visitors/ping", { visitorId: id, path }, { timeout: 7000 });
  } catch {
    // Analytics must never interfere with shopping.
  }
}

import { useEffect, useState } from "react";
import { api } from "../api";
import { getTelegramAdminHeaders } from "../adminAuth";
import "./VisitorAnalytics.css";
import "../pages/Admin.css";

type Visit = { id: string; startedAt: string; lastSeen: string; path: string };
type Visitor = {
  id: string; firstSeen: string; lastSeen: string;
  lastPath: string; visitCount: number; visits: Visit[];
};
type Dashboard = {
  total: number; online: number; newToday: number;
  returning: number; onlineWindowMinutes: number; visitors: Visitor[];
};

function date(value: string) {
  return new Date(value).toLocaleString("ru-RU");
}

export function VisitorAnalytics() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const response = await api.get<Dashboard>("/visitors/admin", {
          headers: getTelegramAdminHeaders(),
          timeout: 10000,
        });
        if (active) { setData(response.data); setError(""); }
      } catch {
        if (active) setError("Не удалось загрузить статистику. Проверь доступ и API.");
      }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  return (
    <div className="admin-stack">
      <section className="admin-box">
        <div className="admin-box__head"><h2>Посетители SWAGYSTAN</h2><span className="admin-pill">ОБНОВЛЕНИЕ 30 С</span></div>
        {error && <p role="alert">{error}</p>}
        <div className="visitor-stats">
          {([
            ["ОНЛАЙН · 5 МИН", data?.online],
            ["УНИКАЛЬНЫХ ВСЕГО", data?.total],
            ["НОВЫХ СЕГОДНЯ", data?.newToday],
            ["ПОВТОРНЫХ", data?.returning],
          ] as const).map(([label, value]) => (
            <div className="visitor-stat" key={label}>
              <span>{label}</span><strong>{value ?? "—"}</strong>
            </div>
          ))}
        </div>
        <p className="visitor-note">Уникальный посетитель = один браузер. Повторный визит = возвращение через 30 минут или позже. Онлайн = активность за последние 5 минут. Без IP и отпечатков устройств.</p>
      </section>
      <section className="admin-box">
        <div className="admin-box__head"><h2>Последние посетители</h2><span className="admin-pill">ДО 100</span></div>
        {!data && !error && <p>ЗАГРУЗКА...</p>}
        {data?.visitors.length === 0 && <p>ПОКА НЕТ ПОСЕЩЕНИЙ</p>}
        {data?.visitors.map((visitor) => {
          const isOnline = Date.now() - new Date(visitor.lastSeen).getTime() < 5 * 60_000;
          return (
            <div className="visitor-row" key={visitor.id}>
              <button type="button" className="visitor-row__button" onClick={() => setExpanded(expanded === visitor.id ? null : visitor.id)} aria-expanded={expanded === visitor.id}>
                <span className="visitor-row__id">{visitor.id.slice(0, 8).toUpperCase()} {isOnline ? "● ОНЛАЙН" : ""}</span>
                <span>{visitor.visitCount > 1 ? "ПОВТОРНЫЙ" : "НОВЫЙ"} · {visitor.visitCount} ВИЗИТ.</span>
                <span>Первый: {date(visitor.firstSeen)}</span>
                <span>Последний: {date(visitor.lastSeen)}</span>
                <span>{visitor.lastPath} {expanded === visitor.id ? "−" : "+"}</span>
              </button>
              {expanded === visitor.id && (
                <div className="visitor-history">
                  <strong>ИСТОРИЯ ВИЗИТОВ (ПОСЛЕДНИЕ 10)</strong>
                  {visitor.visits.map(visit => (
                    <div key={visit.id}>{date(visit.startedAt)} — {date(visit.lastSeen)} · {visit.path}</div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}

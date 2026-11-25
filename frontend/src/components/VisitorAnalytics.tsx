import { useEffect, useState } from "react";
import { api } from "../api";
import { getAdminAccessHeaders } from "../adminAccessApi";
import "./VisitorAnalytics.css";
import "../pages/AdminStudio.css";

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

function Avatar({ id }: { id: string }) {
  let seed = 0;
  for (const ch of id) seed = (Math.imul(seed, 31) + ch.charCodeAt(0)) >>> 0;
  const cells = Array.from({ length: 15 }, (_, i) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return { x: i % 3, y: Math.floor(i / 3), on: seed > 0x70000000 };
  });
  return <svg className="visitor-avatar" viewBox="0 0 7 7" aria-hidden="true">{cells.filter(c => c.on).map(c => <g key={c.y * 3 + c.x}><rect x={c.x + 1} y={c.y + 1} width="1" height="1"/>{c.x !== 2 && <rect x={5 - c.x} y={c.y + 1} width="1" height="1"/>}</g>)}</svg>;
}
const online = (v: Visitor, minutes: number) => Date.now() - new Date(v.lastSeen).getTime() < minutes * 60_000;
function page(path: string) {
  const p = path.split(/[?#]/)[0];
  return ({"/":"Главная","/catalog":"Каталог","/favorites":"Избранное","/cart":"Корзина","/about":"О нас","/account":"Кабинет"} as Record<string,string>)[p] ?? (p.startsWith("/product/") ? "Товар" : p);
}
export function VisitorAnalytics() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const response = await api.get<Dashboard>("/visitors/admin", {
          headers: getAdminAccessHeaders(),
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
    <div className="swag-admin-stats">
      <section className="swag-admin-stats__section">
        <div className="swag-admin-stats__head"><h2>Посетители SWAGYSTAN</h2><span className="swag-admin-stats__meta">ОБНОВЛЕНИЕ 30 С</span></div>
        {error && <p className="swag-admin__error" role="alert">{error}</p>}
        <div className="visitor-stats">
          {([
            ["ОНЛАЙН", data?.online],
            ["УНИКАЛЬНЫХ ВСЕГО", data?.total],
            ["НОВЫХ СЕГОДНЯ", data?.newToday],
            ["ПОВТОРНЫХ", data?.returning],
          ] as const).map(([label, value]) => (
            <div className="visitor-stat" key={label}>
              <span>{label}</span><strong>{value ?? "—"}</strong>
            </div>
          ))}
        </div>
        <p className="visitor-note">Один персонаж = один браузер. LVL = число визитов. Онлайн — активность за последние {data?.onlineWindowMinutes ?? 5} мин.</p>
      </section>
      <section className="swag-admin-stats__section">
        <div className="swag-admin-stats__head"><h2>Последние посетители</h2><span className="swag-admin-stats__meta">ДО 100</span></div>
        {!data && !error && <p className="swag-admin__muted">Загрузка…</p>}
        {data?.visitors.length === 0 && <p className="swag-admin__muted">Пока нет посещений</p>}
        <div className="visitor-filters">{[["all","Все"],["online","Онлайн"],["new","Новые"],["returning","Вернулись"]].map(([key,label]) => <button type="button" key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}</div>
        <div className="visitor-grid">
        {data?.visitors.filter(v => filter === "all" || (filter === "online" ? online(v,data.onlineWindowMinutes) : filter === "new" ? v.visitCount === 1 : v.visitCount > 1)).sort((a,b) => Number(online(b,data.onlineWindowMinutes)) - Number(online(a,data.onlineWindowMinutes)) || Date.parse(b.lastSeen)-Date.parse(a.lastSeen)).map(visitor => {
          const isOnline = online(visitor,data.onlineWindowMinutes);
          return <article className="visitor-card" key={visitor.id}>
            <button type="button" className="visitor-card__button" aria-expanded={expanded === visitor.id} onClick={() => setExpanded(expanded === visitor.id ? null : visitor.id)}>
              <Avatar id={visitor.id}/>
              <span className="visitor-card__identity"><strong>#{visitor.id.slice(0,8).toUpperCase()}</strong><span><i className={isOnline ? "visitor-dot active" : "visitor-dot"}/>{isOnline ? "Онлайн" : "Офлайн"}</span></span>
              <span className="visitor-level">LVL {visitor.visitCount}</span>
              <span className="visitor-card__page">{page(visitor.lastPath)}</span>
              <span className="visitor-card__time">{date(visitor.lastSeen)}</span>
              <span className="visitor-card__expand">{expanded === visitor.id ? "−" : "+"}</span>
            </button>
            {expanded === visitor.id && <div className="visitor-timeline"><p>Первый визит: {date(visitor.firstSeen)}</p><strong>История · последние 10 визитов</strong>{[...visitor.visits].sort((a,b)=>Date.parse(b.startedAt)-Date.parse(a.startedAt)).map(visit => <div key={visit.id}><b>{page(visit.path)}</b><small>{date(visit.startedAt)} — {date(visit.lastSeen)}</small></div>)}</div>}
          </article>;
        })}
        </div>
      </section>
    </div>
  );
}

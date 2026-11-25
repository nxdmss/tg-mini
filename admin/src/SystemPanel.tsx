import { useEffect, useState } from 'react';

type Snapshot = {
  timestamp: string;
  backend: 'online';
  database: 'online' | 'offline';
  cpu: { percent: number | null; cores: number; load1m: number; scope: string };
  memory: { total: number; used: number; available: number; scope: string } | null;
  disk: { total: number; used: number; available: number; scope: string } | null;
  uptimeSeconds: number | null;
};

const apiUrl = (import.meta.env.VITE_API_URL || 'https://api.swagystan.ru').replace(/\/+$/, '');
const size = (bytes: number) => (bytes / 1024 ** 3).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + ' ГБ';
const pct = (used: number, total: number) => Math.min(100, Math.max(0, Math.round(used / total * 100)));
const duration = (seconds: number) => Math.floor(seconds / 86400) + ' д ' + Math.floor(seconds % 86400 / 3600) + ' ч';

function Meter({ title, value, detail }: { title: string; value: number | null; detail: string }) {
  return <div className="system-metric">
    <div className="system-metric__top"><span>{title}</span><strong>{value === null ? '—' : value + '%'}</strong></div>
    <div className="system-track"><div className="system-track__fill" style={{ width: (value ?? 0) + '%' }} /></div>
    <small>{detail}</small>
  </div>;
}

export function SystemPanel({ token }: { token: string }) {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let current = true;
    const load = async () => {
      try {
        const response = await fetch(apiUrl + '/system/status', {
          headers: { Authorization: 'Bearer ' + token }, cache: 'no-store',
        });
        if (!response.ok) throw new Error(response.status === 404
          ? 'SYSTEM ждёт обновления backend на сервере.'
          : response.status === 401 || response.status === 403
            ? 'Нет доступа к системным данным.'
            : 'API: ' + response.status);
        const next = await response.json() as Snapshot;
        if (current) { setData(next); setError(''); }
      } catch (reason) {
        if (current) { setData(null); setError(reason instanceof Error ? reason.message : 'Нет соединения с сервером.'); }
      } finally { if (current) setLoading(false); }
    };
    void load();
    const id = window.setInterval(() => { if (!document.hidden) void load(); }, 15000);
    return () => { current = false; window.clearInterval(id); };
  }, [token]);

  return <main className="system">
    <div className="system-heading"><div><h1>SYSTEM</h1><p>Состояние инфраструктуры SWAGYSTAN</p></div>
      <span className="system-updated">{data ? 'Обновлено ' + new Date(data.timestamp).toLocaleTimeString('ru-RU') : ''}</span>
    </div>
    {loading && !data && <p className="system-note">Подключение...</p>}
    {error && <p className="system-note system-note--error">{error}</p>}
    {data && <>
      <div className="system-status">
        <div><span className="system-dot" /> API <strong>ONLINE</strong></div>
        <div><span className={'system-dot' + (data.database === 'offline' ? ' system-dot--down' : '')} /> POSTGRES <strong>{data.database.toUpperCase()}</strong></div>
      </div>
      <div className="system-metrics">
        <Meter title="CPU · BACKEND" value={data.cpu.percent} detail={'Контейнер backend · ' + data.cpu.cores + ' видимых CPU'} />
        <Meter title="RAM" value={data.memory ? pct(data.memory.used, data.memory.total) : null}
          detail={data.memory ? size(data.memory.used) + ' / ' + size(data.memory.total) : 'Нет данных'} />
        <Meter title="SSD" value={data.disk ? pct(data.disk.used, data.disk.total) : null}
          detail={data.disk ? size(data.disk.used) + ' / ' + size(data.disk.total) : 'Нет данных'} />
      </div>
      <div className="system-footer">
        <span>UPTIME <strong>{data.uptimeSeconds === null ? '—' : duration(data.uptimeSeconds)}</strong></span>
        <span>LOAD 1M <strong>{data.cpu.load1m.toFixed(2)}</strong></span>
      </div>
      <p className="system-note">CPU — расход контейнера backend. RAM — память, видимая Linux. SSD — файловая система контейнера; она может отличаться от диска виртуальной машины. Данные обновляются каждые 15 секунд.</p>
    </>}
  </main>;
}

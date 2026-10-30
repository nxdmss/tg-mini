import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from 'react';
import { fitWindow, initialWindow, resizeWindow } from './windowGeometry';
import type { Edge, Rect } from './windowGeometry';
import './CartWindow.css';

const edges: Edge[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
const viewportSize = () => ({ width: window.innerWidth, height: window.innerHeight });

function WindowIcon({ kind }: { kind: 'minimize' | 'maximize' | 'restore' | 'close' }) {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    {kind === 'minimize' && <path d="M3 11h10" />}
    {kind === 'maximize' && <rect x="3" y="3" width="10" height="10" />}
    {kind === 'restore' && <><path d="M6 3h7v7" /><rect x="3" y="6" width="7" height="7" /></>}
    {kind === 'close' && <path d="m4 4 8 8M12 4l-8 8" />}
  </svg>;
}

export function CartWindow({ title, count, reopenToken, onClose, onBack, locked, children }: {
  title: string; count: number; reopenToken: number; onClose: () => void;
  onBack?: () => void; locked: boolean; children: ReactNode;
}) {
  const [viewport, setViewport] = useState(viewportSize);
  const [rect, setRect] = useState(() => initialWindow(viewportSize()));
  const [maximized, setMaximized] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const titlebar = useRef<HTMLDivElement>(null);
  const dock = useRef<HTMLButtonElement>(null);
  const interaction = useRef<{ id: number; x: number; y: number; rect: Rect; edge?: Edge } | null>(null);
  const titleId = useId();
  const mobile = viewport.width < 760;
  const modal = !minimized && (mobile || maximized);

  useEffect(() => {
    const previousFocus = document.activeElement;
    return () => { if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true }); };
  }, []);

  useEffect(() => {
    const update = () => {
      const next = viewportSize();
      setViewport(next);
      setRect(current => fitWindow(current, next));
      interaction.current = null;
    };
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => { setMinimized(false); }, [reopenToken]);
  useEffect(() => {
    const target = minimized ? dock.current : titlebar.current;
    target?.focus({ preventScroll: true });
  }, [minimized, reopenToken, title]);

  useEffect(() => {
    if (!modal) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [modal]);

  function start(event: PointerEvent<HTMLElement>, edge?: Edge) {
    if (mobile || maximized || event.button !== 0) return;
    if (!edge && (event.target as HTMLElement).closest('button')) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    interaction.current = { id: event.pointerId, x: event.clientX, y: event.clientY, rect, edge };
  }
  function move(event: PointerEvent<HTMLElement>) {
    const active = interaction.current;
    if (!active || active.id !== event.pointerId) return;
    const dx = event.clientX - active.x, dy = event.clientY - active.y;
    setRect(active.edge ? resizeWindow(active.rect, active.edge, dx, dy, viewport)
      : fitWindow({ ...active.rect, x: active.rect.x + dx, y: active.rect.y + dy }, viewport));
  }
  function stop() { interaction.current = null; }
  function keyboardMove(event: KeyboardEvent<HTMLElement>, edge?: Edge) {
    if (event.target !== event.currentTarget || mobile || maximized) return;
    const distance = event.shiftKey ? 24 : 8;
    const dx = event.key === 'ArrowLeft' ? -distance : event.key === 'ArrowRight' ? distance : 0;
    const dy = event.key === 'ArrowUp' ? -distance : event.key === 'ArrowDown' ? distance : 0;
    if (!dx && !dy) return;
    event.preventDefault();
    setRect(current => edge ? resizeWindow(current, edge, dx, dy, viewport)
      : fitWindow({ ...current, x: current.x + dx, y: current.y + dy }, viewport));
  }
  function keys(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape' && !locked) { event.stopPropagation(); onClose(); }
    if (event.key !== 'Tab' || !modal) return;
    const focusable = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') ?? []).filter(el => el.offsetParent !== null);
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }

  const style: CSSProperties = mobile ? { inset: 0, width: '100%', height: '100dvh' }
    : maximized ? { left: 0, top: 0, width: viewport.width, height: viewport.height }
    : { left: rect.x, top: rect.y, width: rect.width, height: rect.height };

  return <>
    {modal && <div className="cart-window-backdrop" aria-hidden="true" />}
    <section ref={panel} role="dialog" aria-modal={modal || undefined} aria-labelledby={titleId}
      className={`cart-window${maximized ? ' cart-window--maximized' : ''}${mobile ? ' cart-window--mobile' : ''}`}
      style={style} hidden={minimized} onKeyDown={keys}>
      <div ref={titlebar} className="cart-window__titlebar" tabIndex={0}
        title={mobile ? undefined : 'Перетащи окно. Двойной щелчок — развернуть. Стрелки — переместить.'}
        onPointerDown={event => start(event)} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}
        onKeyDown={event => keyboardMove(event)}
        onDoubleClick={event => { if (!mobile && !(event.target as HTMLElement).closest('button')) setMaximized(value => !value); }}>
        <div className="cart-window__caption">
          {onBack && <button type="button" className="cart-window__control" disabled={locked} onClick={onBack} aria-label="Назад в корзину" title="Назад в корзину">←</button>}
          <h2 id={titleId}>{title}</h2>
          {count > 0 && <span className="cart-window__count">{count}</span>}
        </div>
        <div className="cart-window__controls">
          <button type="button" className="cart-window__control" onClick={() => setMinimized(true)} aria-label="Свернуть корзину" title="Свернуть"><WindowIcon kind="minimize" /></button>
          {!mobile && <button type="button" className="cart-window__control" onClick={() => setMaximized(value => !value)} aria-label={maximized ? 'Вернуть размер окна' : 'Развернуть корзину на весь экран'} title={maximized ? 'Вернуть размер' : 'На весь экран'}><WindowIcon kind={maximized ? 'restore' : 'maximize'} /></button>}
          <button type="button" className="cart-window__control" disabled={locked} onClick={onClose} aria-label="Закрыть корзину" title="Закрыть"><WindowIcon kind="close" /></button>
        </div>
      </div>
      <div className="cart-window__content">{children}</div>
      {!mobile && !maximized && edges.map(edge => <div key={edge} role="button" tabIndex={edge === 'se' ? 0 : -1}
        aria-label="Изменить размер окна стрелками" className={`cart-window__resize cart-window__resize--${edge}`}
        onPointerDown={event => start(event, edge)} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}
        onKeyDown={event => keyboardMove(event, edge)} />)}
    </section>
    {minimized && <div className="cart-window-dock">
      <button ref={dock} type="button" className="cart-window-dock__open" onClick={() => setMinimized(false)} aria-label="Раскрыть корзину">КОРЗИНА{count > 0 && <span>{count}</span>}<WindowIcon kind="restore" /></button>
      <button type="button" className="cart-window__control" disabled={locked} onClick={onClose} aria-label="Закрыть корзину"><WindowIcon kind="close" /></button>
    </div>}
  </>;
}

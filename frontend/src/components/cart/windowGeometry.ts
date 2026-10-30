export type Rect = { x: number; y: number; width: number; height: number };
export type Viewport = { width: number; height: number };
export type Edge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));
const margin = 12;

export function fitWindow(rect: Rect, viewport: Viewport): Rect {
  const availableWidth = Math.max(1, viewport.width - margin * 2);
  const availableHeight = Math.max(1, viewport.height - margin * 2);
  const width = clamp(rect.width, Math.min(380, availableWidth), availableWidth);
  const height = clamp(rect.height, Math.min(320, availableHeight), availableHeight);
  return { width, height,
    x: clamp(rect.x, Math.min(margin, viewport.width - width), Math.max(0, viewport.width - width - margin)),
    y: clamp(rect.y, Math.min(margin, viewport.height - height), Math.max(0, viewport.height - height - margin)),
  };
}

export function initialWindow(viewport: Viewport): Rect {
  const width = Math.min(960, viewport.width - 24);
  const height = Math.min(820, viewport.height * .90);
  return fitWindow({ x: (viewport.width - width) / 2, y: (viewport.height - height) / 2, width, height }, viewport);
}

export function resizeWindow(rect: Rect, edge: Edge, dx: number, dy: number, viewport: Viewport): Rect {
  const next = { ...rect };
  const minWidth = Math.min(380, Math.max(1, viewport.width - 24));
  const minHeight = Math.min(320, Math.max(1, viewport.height - 24));
  if (edge.includes('e')) next.width = clamp(rect.width + dx, minWidth, Math.max(minWidth, viewport.width - margin - rect.x));
  if (edge.includes('s')) next.height = clamp(rect.height + dy, minHeight, Math.max(minHeight, viewport.height - margin - rect.y));
  if (edge.includes('w')) {
    next.x = clamp(rect.x + dx, margin, rect.x + rect.width - minWidth);
    next.width = rect.width + rect.x - next.x;
  }
  if (edge.includes('n')) {
    next.y = clamp(rect.y + dy, margin, rect.y + rect.height - minHeight);
    next.height = rect.height + rect.y - next.y;
  }
  return fitWindow(next, viewport);
}

/**
 * Shared low-priority hover photo preloader.
 * Decodes the actual responsive image before it may replace the primary photo.
 * Browser HTTP cache persists the resource; our bounded promise map deduplicates
 * requests while visitors move across cards.
 */
type Job = {
  key: string;
  url: string;
  srcSet?: string;
  sizes: string;
  urgent: boolean;
  done: (success: boolean) => void;
};

const cached = new Map<string, Promise<boolean>>();
const queue: Job[] = [];
const MAX_CONCURRENT = 3;
const MAX_CACHED = 64;
let active = 0;

function loadImage(job: Job): Promise<boolean> {
  return new Promise((resolve) => {
    const image = new Image();
    let finished = false;
    const finish = (success: boolean) => {
      if (finished) return;
      finished = true;
      image.onload = null;
      image.onerror = null;
      resolve(success);
    };

    image.decoding = "async";
    image.fetchPriority = job.urgent ? "high" : "low";
    if (job.srcSet) image.setAttribute("srcset", job.srcSet);
    image.sizes = job.sizes;
    image.onload = () => {
      if (typeof image.decode === "function") {
        void image.decode().then(
          () => finish(true),
          () => finish(image.naturalWidth > 0),
        );
      } else {
        finish(image.naturalWidth > 0);
      }
    };
    image.onerror = () => finish(false);
    image.src = job.url;
    if (image.complete && image.naturalWidth > 0) {
      image.onload();
    }
  });
}

function pump() {
  while (active < MAX_CONCURRENT && queue.length) {
    const job = queue.shift();
    if (!job) break;
    active += 1;
    void loadImage(job).then(
      (loaded) => job.done(loaded),
      () => job.done(false),
    ).finally(() => {
      active -= 1;
      pump();
    });
  }
}

export function preloadHoverImage(
  url: string,
  srcSet: string | undefined,
  sizes: string,
  urgent = false,
): Promise<boolean> {
  const key = [url, srcSet ?? "", sizes].join("\n");
  const existing = cached.get(key);
  if (existing) {
    if (urgent) {
      const index = queue.findIndex((job) => job.key === key);
      if (index > 0) {
        const [job] = queue.splice(index, 1);
        job.urgent = true;
        queue.unshift(job);
      } else if (index === 0) {
        queue[0].urgent = true;
      }
      pump();
    }
    return existing;
  }

  let resolveJob!: (success: boolean) => void;
  const promise = new Promise<boolean>((resolve) => {
    resolveJob = resolve;
  });
  cached.set(key, promise);
  const job: Job = {
    key, url, srcSet, sizes, urgent,
    done: resolveJob,
  };
  if (urgent) queue.unshift(job);
  else queue.push(job);

  // Bound in-memory bookkeeping; the browser remains responsible for HTTP cache.
  while (cached.size > MAX_CACHED) {
    const oldest = cached.keys().next().value;
    if (oldest === undefined) break;
    cached.delete(oldest);
  }
  pump();
  return promise;
}

// One IntersectionObserver for the catalog, rather than one per product card.
const nearCallbacks = new Map<Element, () => void>();
let nearObserver: IntersectionObserver | null = null;

export function onCardNearViewport(
  target: Element,
  onNear: () => void,
): () => void {
  if (typeof IntersectionObserver === "undefined") {
    onNear();
    return () => {};
  }
  if (!nearObserver) {
    nearObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const callback = nearCallbacks.get(entry.target);
        nearCallbacks.delete(entry.target);
        nearObserver?.unobserve(entry.target);
        callback?.();
      }
    }, { rootMargin: "360px 0px", threshold: 0 });
  }
  nearCallbacks.set(target, onNear);
  nearObserver.observe(target);
  return () => {
    nearCallbacks.delete(target);
    nearObserver?.unobserve(target);
  };
}

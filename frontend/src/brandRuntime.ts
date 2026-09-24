const ZULF_RE = /\bZULF\b/gi;
const SWAG_RE = /\bSWA6Y5TAN\b/g;

const STYLE_ID = "swagystan-brand-runtime-style";

function installBrandStyles() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    /*
     * Zulfia — handwritten / signature.
     * iPhone/macOS: Snell Roundhand.
     * Windows/Android: graceful script fallbacks.
     */
    .brand-zulfia {
      display: inline-block !important;
      font-family:
        "Snell Roundhand",
        "Segoe Script",
        "Brush Script MT",
        "URW Chancery L",
        cursive !important;
      font-size: 1.38em !important;
      font-weight: 400 !important;
      font-style: normal !important;
      line-height: 0.92 !important;
      letter-spacing: 0.01em !important;
      text-transform: none !important;
      white-space: nowrap;
      transform: translateY(0.02em);
      transform-origin: center;
    }

    /*
     * SWAGYSTAN — razor / demon-action wordmark.
     * Intentionally ugly-sharp: high-contrast serifs, hard italic,
     * compressed width, tall silhouette and sliced duplicate layers.
     */
    .brand-swagystan {
      position: relative !important;
      display: inline-block !important;
      font-family:
        "Bodoni 72 Smallcaps",
        "Bodoni 72",
        "Didot",
        "Bodoni MT",
        "Times New Roman",
        serif !important;
      font-size: 1.14em !important;
      font-weight: 900 !important;
      font-style: italic !important;
      line-height: 0.82 !important;
      letter-spacing: -0.045em !important;
      text-transform: uppercase !important;
      white-space: nowrap;
      transform:
        skewX(-17deg)
        scaleX(0.9)
        scaleY(1.24)
        translateY(-0.015em);
      transform-origin: center;
      -webkit-text-stroke: 0.65px currentColor;
      paint-order: stroke fill;
      text-shadow:
        0.02em 0 0 currentColor,
        -0.018em 0 0 currentColor,
        0 -0.018em 0 currentColor;
      isolation: isolate;
    }

    .brand-swagystan::before,
    .brand-swagystan::after {
      content: attr(data-brand-word);
      position: absolute;
      inset: 0;
      color: currentColor;
      pointer-events: none;
      user-select: none;
      -webkit-text-stroke: 0.35px currentColor;
    }

    /* Upper torn blade-slice. */
    .brand-swagystan::before {
      transform: translate(-0.045em, -0.035em);
      clip-path: polygon(
        0 0,
        100% 0,
        100% 42%,
        88% 38%,
        74% 47%,
        61% 38%,
        48% 46%,
        34% 37%,
        19% 46%,
        0 39%
      );
      opacity: 0.48;
      z-index: -1;
    }

    /* Lower opposing slice makes the word feel cut / weapon-like. */
    .brand-swagystan::after {
      transform: translate(0.055em, 0.035em);
      clip-path: polygon(
        0 58%,
        18% 53%,
        31% 62%,
        46% 54%,
        60% 63%,
        75% 54%,
        89% 62%,
        100% 57%,
        100% 100%,
        0 100%
      );
      opacity: 0.38;
      z-index: -1;
    }

    @media (max-width: 700px) {
      .brand-zulfia {
        font-size: 1.32em !important;
      }

      .brand-swagystan {
        font-size: 1.08em !important;
        letter-spacing: -0.05em !important;
        transform:
          skewX(-16deg)
          scaleX(0.88)
          scaleY(1.2)
          translateY(-0.01em);
      }
    }
  `;

  document.head.appendChild(style);
}

function normalizeText(value: string) {
  return value
    .replace(ZULF_RE, "Zulfia")
    .replace(SWAG_RE, "SWAGYSTAN");
}

function classForText(value: string) {
  const normalized = value.trim();

  if (/^Zulfia$/i.test(normalized)) {
    return "brand-zulfia";
  }

  if (/^(SWAGYSTAN|SWA6Y5TAN)$/i.test(normalized)) {
    return "brand-swagystan";
  }

  return null;
}

function normalizeAttributes(element: HTMLElement) {
  const attributes = [
    "aria-label",
    "title",
    "placeholder",
    "alt",
  ];

  for (const name of attributes) {
    const current = element.getAttribute(name);

    if (!current) {
      continue;
    }

    const next = normalizeText(current);

    if (next !== current) {
      element.setAttribute(name, next);
    }
  }

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    const next = normalizeText(element.value);

    if (next !== element.value) {
      element.value = next;
    }
  }
}

function normalizeTextNode(node: Text) {
  const current = node.nodeValue ?? "";
  const next = normalizeText(current);

  if (next !== current) {
    node.nodeValue = next;
  }

  const parent = node.parentElement;

  if (!parent) {
    return;
  }

  const brandClass = classForText(parent.textContent ?? "");

  if (brandClass) {
    parent.classList.add(brandClass);

    if (brandClass === "brand-zulfia") {
      parent.classList.remove("brand-swagystan");
    } else {
      parent.classList.remove("brand-zulfia");
      parent.setAttribute("data-brand-word", "SWAGYSTAN");
    }
  }
}

function normalizeElement(root: ParentNode) {
  if (root instanceof HTMLElement) {
    normalizeAttributes(root);
  }

  const elements = root.querySelectorAll?.<HTMLElement>("*");

  elements?.forEach((element) => {
    normalizeAttributes(element);

    const brandClass = classForText(element.textContent ?? "");

    /*
     * Apply typography to leaf-ish nodes only.
     * This avoids skewing a whole layout/container.
     */
    if (
      brandClass &&
      element.children.length === 0
    ) {
      element.classList.add(brandClass);

      if (brandClass === "brand-zulfia") {
        element.classList.remove("brand-swagystan");
      } else {
        element.classList.remove("brand-zulfia");
        element.setAttribute("data-brand-word", "SWAGYSTAN");
      }
    }
  });

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
  );

  const nodes: Text[] = [];

  let current = walker.nextNode();

  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }

  nodes.forEach(normalizeTextNode);
}

function normalizeDocumentTitle() {
  document.title = normalizeText(document.title);
}

function run() {
  installBrandStyles();
  normalizeDocumentTitle();
  normalizeElement(document.body);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "characterData") {
        normalizeTextNode(mutation.target as Text);
        continue;
      }

      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          normalizeTextNode(node as Text);
          return;
        }

        if (node instanceof HTMLElement) {
          normalizeElement(node);
        }
      });
    }

    normalizeDocumentTitle();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", run, {
    once: true,
  });
} else {
  run();
}

const ZULF_RE = /\bZULF\b/gi;
const SWAG_RE = /\b(?:SWA6Y5TAN|SWAGYSTAN)\b/gi;

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
      font-size: 1.79em !important;
      font-weight: 400 !important;
      font-style: normal !important;
      line-height: 0.92 !important;
      letter-spacing: -0.006em !important;
      text-transform: none !important;
      white-space: nowrap;
      transform: translateY(0.02em);
      transform-origin: center;
    }

    /*
     * SWAGYSTAN — DMC5 / Kalina Ann direction.
     * Wider, airier and more alive than the previous compressed version.
     */
    @font-face {
      font-family: "SWAGYSTAN DMC5";
      src:
        url("/fonts/dmc5-kalina-ann.woff2") format("woff2"),
        url("/fonts/dmc5-kalina-ann.woff") format("woff"),
        url("/fonts/dmc5-kalina-ann.ttf") format("truetype"),
        url("/fonts/dmc5-kalina-ann.otf") format("opentype");
      font-style: normal;
      font-weight: 400;
      font-display: swap;
    }

    .brand-swagystan {
      position: relative !important;
      display: inline-block !important;
      font-family:
        "SWAGYSTAN DMC5",
        "Bodoni 72",
        "Didot",
        "Times New Roman",
        serif !important;
      font-size: 2.08em !important;
      font-weight: 400 !important;
      font-style: normal !important;
      line-height: 0.66 !important;
      letter-spacing: -0.072em !important;
      text-transform: none !important;
      white-space: nowrap;
      transform:
        skewX(-7deg)
        scaleX(1.18)
        scaleY(1.30)
        translateY(-0.105em);
      transform-origin: left center;
      -webkit-text-stroke: 0.08px currentColor;
      paint-order: stroke fill;
      text-shadow:
        0.006em 0.004em 0 currentColor;
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
      opacity: 0.14;
      z-index: -1;
    }

    .brand-swagystan::before {
      transform: translate(-0.016em, -0.012em);
      clip-path: polygon(
        0 0,
        100% 0,
        100% 47%,
        78% 43%,
        58% 48%,
        37% 43%,
        17% 48%,
        0 44%
      );
    }

    .brand-swagystan::after {
      transform: translate(0.018em, 0.014em);
      clip-path: polygon(
        0 56%,
        19% 52%,
        39% 57%,
        59% 52%,
        79% 57%,
        100% 53%,
        100% 100%,
        0 100%
      );
    }


    /*
     * Store selector — editorial diagonal composition.
     * Keeps the original buttons/click handlers; only layout changes.
     */
    .brand-store-deck {
      position: relative !important;
      display: grid !important;
      grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
      grid-template-rows: auto auto !important;
      width: 100% !important;
      max-width: 1120px;
      margin: 0 auto !important;
      padding: 18px 0 30px !important;
      gap: 0 !important;
      overflow: visible !important;
      align-items: center !important;
    }

    .brand-store-deck::before {
      content: "";
      position: absolute;
      left: 8%;
      right: 8%;
      top: 50%;
      height: 1px;
      background: currentColor;
      opacity: 0.14;
      transform: rotate(-4deg);
      transform-origin: center;
      pointer-events: none;
    }

    .brand-store-slot {
      min-width: 0 !important;
      width: auto !important;
      position: relative !important;
      z-index: 1;
    }

    .brand-store-slot--swagystan {
      grid-column: 1 / 10 !important;
      grid-row: 1 !important;
      justify-self: stretch !important;
    }

    .brand-store-slot--zulfia {
      grid-column: 7 / 13 !important;
      grid-row: 2 !important;
      justify-self: stretch !important;
      margin-top: -8px !important;
    }

    .brand-store-card {
      position: relative !important;
      display: flex !important;
      width: 100% !important;
      min-height: 72px !important;
      box-sizing: border-box !important;
      border: 0 !important;
      border-radius: 0 !important;
      background: transparent !important;
      color: inherit !important;
      box-shadow: none !important;
      overflow: visible !important;
      isolation: isolate;
      transition:
        opacity 160ms ease,
        transform 180ms cubic-bezier(0.16, 1, 0.3, 1) !important;
    }

    .brand-store-card--swagystan {
      justify-content: flex-start !important;
      align-items: center !important;
      padding: 18px 46px 16px 18px !important;
      border-top: 1px solid currentColor !important;
      text-align: left !important;
    }

    .brand-store-card--zulfia {
      justify-content: flex-end !important;
      align-items: center !important;
      padding: 12px 16px 15px 34px !important;
      border-bottom: 1px solid currentColor !important;
      text-align: right !important;
    }

    .brand-store-card::after {
      position: absolute;
      font-family: "IBM Plex Mono", monospace;
      font-size: 8px;
      font-weight: 500;
      line-height: 1;
      letter-spacing: 0.16em;
      opacity: 0.38;
      pointer-events: none;
    }

    .brand-store-card--swagystan::after {
      content: "01 / STORE";
      top: 9px;
      right: 2px;
    }

    .brand-store-card--zulfia::after {
      content: "02 / STORE";
      bottom: 7px;
      left: 2px;
    }

    .brand-store-card:hover,
    .brand-store-card:focus-visible {
      transform: translateY(-2px) !important;
    }

    .brand-store-card:active {
      transform: translateY(0) scale(0.99) !important;
    }

    @media (max-width: 700px) {
      .brand-zulfia {
        font-size: 0.95em !important;
      }

      .brand-swagystan {
        font-size: 2.22em !important;
        letter-spacing: -0.064em !important;
        transform:
          skewX(-6deg)
          scaleX(1.16)
          scaleY(1.27)
          translateY(-0.09em);
      }


      .brand-store-deck {
        display: flex !important;
        flex-direction: column !important;
        align-items: stretch !important;
        padding: 14px 0 24px !important;
      }

      .brand-store-deck::before {
        left: 12%;
        right: 12%;
        top: 52%;
        transform: rotate(-7deg);
      }

      .brand-store-slot--swagystan {
        width: 92% !important;
        align-self: flex-start !important;
      }

      .brand-store-slot--zulfia {
        width: 64% !important;
        align-self: flex-end !important;
        margin-top: -6px !important;
      }

      .brand-store-card {
        min-height: 62px !important;
      }

      .brand-store-card--swagystan {
        padding: 16px 26px 13px 10px !important;
      }

      .brand-store-card--zulfia {
        padding: 10px 10px 12px 18px !important;
      }
    }
  `;

  document.head.appendChild(style);
}

function normalizeText(value: string) {
  return value
    .replace(ZULF_RE, "Zulfia")
    .replace(SWAG_RE, "swagystan");
}

function classForText(value: string) {
  const normalized = value.trim();

  if (/^Zulfia$/i.test(normalized)) {
    return "brand-zulfia";
  }

  if (/^(swagystan|SWA6Y5TAN)$/i.test(normalized)) {
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
      parent.setAttribute("data-brand-word", "swagystan");
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
        element.setAttribute("data-brand-word", "swagystan");
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


function directBranch(
  ancestor: HTMLElement,
  element: HTMLElement,
) {
  let current: HTMLElement = element;

  while (
    current.parentElement &&
    current.parentElement !== ancestor
  ) {
    current = current.parentElement;
  }

  return current;
}

function lowestCommonAncestor(
  first: HTMLElement,
  second: HTMLElement,
) {
  const ancestors = new Set<HTMLElement>();
  let current: HTMLElement | null = first;

  while (current) {
    ancestors.add(current);
    current = current.parentElement;
  }

  current = second;

  while (current) {
    if (ancestors.has(current)) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

function brandButton(
  brandElement: HTMLElement,
) {
  return brandElement.closest<HTMLElement>(
    'button, a, [role="button"]',
  );
}

function decorateShopDeck() {
  const swagBrands = [
    ...document.querySelectorAll<HTMLElement>(
      ".brand-swagystan",
    ),
  ];

  const zulfiaBrands = [
    ...document.querySelectorAll<HTMLElement>(
      ".brand-zulfia",
    ),
  ];

  for (const swagBrand of swagBrands) {
    const swagButton = brandButton(swagBrand);

    if (!swagButton) {
      continue;
    }

    for (const zulfiaBrand of zulfiaBrands) {
      const zulfiaButton = brandButton(zulfiaBrand);

      if (
        !zulfiaButton ||
        zulfiaButton === swagButton
      ) {
        continue;
      }

      const deck = lowestCommonAncestor(
        swagButton,
        zulfiaButton,
      );

      if (
        !deck ||
        deck === document.body ||
        deck === document.documentElement
      ) {
        continue;
      }

      const interactiveCount =
        deck.querySelectorAll(
          'button, a, [role="button"]',
        ).length;

      /*
       * A real shop switcher is a compact control.
       * This keeps product/admin areas from being decorated accidentally.
       */
      if (
        interactiveCount < 2 ||
        interactiveCount > 8
      ) {
        continue;
      }

      const swagSlot = directBranch(
        deck,
        swagButton,
      );
      const zulfiaSlot = directBranch(
        deck,
        zulfiaButton,
      );

      if (swagSlot === zulfiaSlot) {
        continue;
      }

      deck.classList.add(
        "brand-store-deck",
      );

      swagSlot.classList.add(
        "brand-store-slot",
        "brand-store-slot--swagystan",
      );
      zulfiaSlot.classList.add(
        "brand-store-slot",
        "brand-store-slot--zulfia",
      );

      swagButton.classList.add(
        "brand-store-card",
        "brand-store-card--swagystan",
      );
      zulfiaButton.classList.add(
        "brand-store-card",
        "brand-store-card--zulfia",
      );

      return;
    }
  }
}

function normalizeDocumentTitle() {
  document.title = normalizeText(document.title)
    .replace(/swagystan/gi, "SWAGYSTAN");
}

function run() {
  installBrandStyles();
  normalizeDocumentTitle();
  normalizeElement(document.body);
  decorateShopDeck();

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
    decorateShopDeck();
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

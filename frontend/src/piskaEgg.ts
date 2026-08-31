function isMainStorefront() {
  const path =
    window.location.pathname;

  return (
    path !== "/admin" &&
    !path.includes(
      "/product/",
    ) &&
    !path.startsWith(
      "/product/",
    )
  );
}

export function mountPiskaEgg() {
  if (
    typeof window ===
      "undefined" ||
    typeof document ===
      "undefined"
  ) {
    return;
  }

  const element =
    document.createElement(
      "span",
    );

  element.textContent =
    "piska";

  Object.assign(
    element.style,
    {
      position:
        "fixed",
      zIndex:
        "3",
      left:
        `${
          12 +
          Math.random() *
            72
        }%`,
      top:
        `${
          20 +
          Math.random() *
            64
        }%`,
      transform:
        `rotate(${
          -6 +
          Math.random() *
            12
        }deg)`,
      pointerEvents:
        "none",
      userSelect:
        "none",
      fontFamily:
        '"IBM Plex Mono", monospace',
      fontSize:
        "7px",
      fontWeight:
        "500",
      lineHeight:
        "1",
      letterSpacing:
        "0.06em",
      opacity:
        "0.065",
      color:
        "currentColor",
      mixBlendMode:
        "difference",
      whiteSpace:
        "nowrap",
    } satisfies Partial<
      CSSStyleDeclaration
    >,
  );

  document.body.appendChild(
    element,
  );

  const sync =
    () => {
      element.style.display =
        isMainStorefront()
          ? "block"
          : "none";
    };

  const originalPush =
    history.pushState.bind(
      history,
    );

  const originalReplace =
    history.replaceState.bind(
      history,
    );

  history.pushState =
    function (
      ...args: Parameters<
        History["pushState"]
      >
    ) {
      originalPush(
        ...args,
      );

      queueMicrotask(
        sync,
      );
    };

  history.replaceState =
    function (
      ...args: Parameters<
        History[
          "replaceState"
        ]
      >
    ) {
      originalReplace(
        ...args,
      );

      queueMicrotask(
        sync,
      );
    };

  window.addEventListener(
    "popstate",
    sync,
  );

  sync();
}

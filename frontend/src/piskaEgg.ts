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
        "50",

      left:
        "78%",
      top:
        "72%",

      transform:
        "rotate(-3deg)",

      pointerEvents:
        "none",
      userSelect:
        "none",

      fontFamily:
        '"IBM Plex Mono", monospace',
      fontSize:
        "8px",
      fontWeight:
        "500",
      lineHeight:
        "1",
      letterSpacing:
        "0.05em",

      color:
        "#777",

      opacity:
        "0.28",

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

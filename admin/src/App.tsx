import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  checkAdmin,
  clearAccessToken,
  getAccessToken,
  getAdminOrders,
  getApiErrorMessage,
  isAuthError,
  loginAdmin,
  saveAccessToken,
  updateAdminOrderStatus,
} from "./api";

import type {
  Order,
  OrderItem,
  OrderStatus,
} from "./types";

type Filter =
  | "all"
  | "new"
  | "work"
  | "done";

const FILTERS: Array<{
  key: Filter;
  label: string;
}> = [
  {
    key: "all",
    label: "ALL",
  },
  {
    key: "new",
    label: "NEW",
  },
  {
    key: "work",
    label: "WORK",
  },
  {
    key: "done",
    label: "DONE",
  },
];

const STATUS_LABELS: Record<
  OrderStatus,
  string
> = {
  PENDING: "NEW",
  PAID: "PAID",
  SHIPPED: "SHIP",
  DONE: "DONE",
  CANCELLED: "CANCEL",
};

const STATUS_ACTIONS: Array<{
  value: OrderStatus;
  label: string;
}> = [
  {
    value: "PENDING",
    label: "NEW",
  },
  {
    value: "PAID",
    label: "PAID",
  },
  {
    value: "SHIPPED",
    label: "SHIP",
  },
  {
    value: "DONE",
    label: "DONE",
  },
  {
    value: "CANCELLED",
    label: "CANCEL",
  },
];

function orderCode(
  order: Order,
) {
  return `SW_${order.number}`;
}

function orderTotal(
  order: Order,
) {
  return order.items.reduce(
    (
      total,
      item,
    ) =>
      total +
      item.price *
        item.quantity,
    0,
  );
}

function money(
  value: number,
) {
  return new Intl.NumberFormat(
    "ru-RU",
  ).format(value) + " ₽";
}

function orderTime(
  value: string,
) {
  const date = new Date(value);

  return new Intl.DateTimeFormat(
    "ru-RU",
    {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function statusClass(
  status: OrderStatus,
) {
  if (status === "PENDING") {
    return "new";
  }

  if (
    status === "PAID" ||
    status === "SHIPPED"
  ) {
    return "work";
  }

  if (status === "DONE") {
    return "done";
  }

  return "cancelled";
}

function inFilter(
  order: Order,
  filter: Filter,
) {
  if (filter === "all") {
    return true;
  }

  if (filter === "new") {
    return (
      order.status ===
      "PENDING"
    );
  }

  if (filter === "work") {
    return (
      order.status ===
        "PAID" ||
      order.status ===
        "SHIPPED"
    );
  }

  return (
    order.status === "DONE"
  );
}

function firstImage(
  item: OrderItem,
) {
  return (
    item.product.images[0]
      ?.url ?? null
  );
}

function Login({
  onSuccess,
}: {
  onSuccess: (
    token: string,
  ) => void;
}) {
  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    pending,
    setPending,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const submit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    setPending(true);
    setError("");

    try {
      const response =
        await loginAdmin(
          email.trim(),
          password,
        );

      await checkAdmin(
        response.accessToken,
      );

      saveAccessToken(
        response.accessToken,
      );

      onSuccess(
        response.accessToken,
      );
    } catch (submitError) {
      clearAccessToken();

      setError(
        getApiErrorMessage(
          submitError,
        ),
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="login">
      <form
        className="login__card"
        onSubmit={submit}
      >
        <div className="login__brand">
          SWAGYSTAN
        </div>

        <h1>ORDERS</h1>

        <label className="field">
          <span>EMAIL</span>

          <input
            autoComplete="username"
            inputMode="email"
            type="email"
            value={email}
            onChange={(
              event,
            ) =>
              setEmail(
                event.target
                  .value,
              )
            }
            required
          />
        </label>

        <label className="field">
          <span>PASSWORD</span>

          <input
            autoComplete="current-password"
            type="password"
            value={
              password
            }
            onChange={(
              event,
            ) =>
              setPassword(
                event.target
                  .value,
              )
            }
            minLength={6}
            required
          />
        </label>

        <button
          className="login__button"
          disabled={pending}
          type="submit"
        >
          {pending
            ? "..."
            : "ENTER"}
        </button>

        {error ? (
          <div className="login__error">
            {error}
          </div>
        ) : null}
      </form>
    </main>
  );
}

export default function App() {
  const [
    token,
    setToken,
  ] = useState<
    string | null
  >(() =>
    getAccessToken(),
  );

  const [
    authorized,
    setAuthorized,
  ] = useState(false);

  const [
    booting,
    setBooting,
  ] = useState(
    Boolean(token),
  );

  const [
    orders,
    setOrders,
  ] = useState<Order[]>(
    [],
  );

  const [
    filter,
    setFilter,
  ] = useState<Filter>(
    "all",
  );

  const [
    selectedId,
    setSelectedId,
  ] = useState<
    string | null
  >(null);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    updating,
    setUpdating,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    online,
    setOnline,
  ] = useState(
    navigator.onLine,
  );

  const [
    notificationState,
    setNotificationState,
  ] = useState(() => {
    if (
      typeof Notification ===
      "undefined"
    ) {
      return "unsupported";
    }

    return Notification.permission;
  });

  const highestKnown =
    useRef<number | null>(
      null,
    );

  const refreshing =
    useRef(false);

  const logout =
    useCallback(() => {
      clearAccessToken();
      setToken(null);
      setAuthorized(false);
      setOrders([]);
      setSelectedId(
        null,
      );
      highestKnown.current =
        null;
    }, []);

  const notifyOrder =
    useCallback(
      async (
        order: Order,
      ) => {
        if (
          typeof Notification ===
            "undefined" ||
          Notification.permission !==
            "granted"
        ) {
          return;
        }

        const title =
          orderCode(order);

        const body =
          `NEW · ${money(
            orderTotal(order),
          )}`;

        try {
          const registration =
            await navigator
              .serviceWorker
              .ready;

          await registration.showNotification(
            title,
            {
              body,
              icon: "/icon.svg",
              badge:
                "/icon.svg",
              tag:
                `order-${order.id}`,
              data: {
                url:
                  `/?order=${encodeURIComponent(
                    order.id,
                  )}`,
              },
            },
          );

          if (
            "vibrate" in
            navigator
          ) {
            navigator.vibrate(
              [
                80,
                60,
                80,
              ],
            );
          }
        } catch {
          // Notifications are optional.
        }
      },
      [],
    );

  const refreshOrders =
    useCallback(
      async (
        announceNew: boolean,
      ) => {
        if (
          !token ||
          refreshing.current
        ) {
          return;
        }

        refreshing.current =
          true;

        try {
          const next =
            await getAdminOrders(
              token,
            );

          const highest =
            next.reduce(
              (
                current,
                order,
              ) =>
                Math.max(
                  current,
                  order.number,
                ),
              0,
            );

          if (
            announceNew &&
            highestKnown.current !==
              null &&
            highest >
              highestKnown.current
          ) {
            const fresh =
              next
                .filter(
                  (order) =>
                    order.number >
                    highestKnown.current!,
                )
                .sort(
                  (
                    left,
                    right,
                  ) =>
                    right.number -
                    left.number,
                );

            if (
              fresh[0]
            ) {
              void notifyOrder(
                fresh[0],
              );
            }
          }

          highestKnown.current =
            highest;

          setOrders(next);
          setError("");
        } catch (
          refreshError
        ) {
          if (
            isAuthError(
              refreshError,
            )
          ) {
            logout();
            return;
          }

          setError(
            getApiErrorMessage(
              refreshError,
            ),
          );
        } finally {
          refreshing.current =
            false;
        }
      },
      [
        logout,
        notifyOrder,
        token,
      ],
    );

  useEffect(() => {
    const markOnline =
      () =>
        setOnline(true);

    const markOffline =
      () =>
        setOnline(false);

    window.addEventListener(
      "online",
      markOnline,
    );

    window.addEventListener(
      "offline",
      markOffline,
    );

    return () => {
      window.removeEventListener(
        "online",
        markOnline,
      );

      window.removeEventListener(
        "offline",
        markOffline,
      );
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setBooting(false);
      return;
    }

    let active = true;

    void (async () => {
      setBooting(true);

      try {
        await checkAdmin(
          token,
        );

        if (!active) {
          return;
        }

        setAuthorized(
          true,
        );
      } catch (
        verifyError
      ) {
        if (!active) {
          return;
        }

        clearAccessToken();
        setToken(null);
        setAuthorized(
          false,
        );

        setError(
          getApiErrorMessage(
            verifyError,
          ),
        );
      } finally {
        if (active) {
          setBooting(
            false,
          );
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (
      !authorized ||
      !token
    ) {
      return;
    }

    setLoading(true);

    void refreshOrders(
      false,
    ).finally(() =>
      setLoading(false),
    );

    const interval =
      window.setInterval(
        () => {
          void refreshOrders(
            true,
          );
        },
        5_000,
      );

    return () =>
      window.clearInterval(
        interval,
      );
  }, [
    authorized,
    refreshOrders,
    token,
  ]);

  useEffect(() => {
    if (
      orders.length ===
      0
    ) {
      return;
    }

    const params =
      new URLSearchParams(
        window.location.search,
      );

    const orderId =
      params.get(
        "order",
      );

    if (
      !orderId ||
      !orders.some(
        (order) =>
          order.id ===
          orderId,
      )
    ) {
      return;
    }

    setSelectedId(
      orderId,
    );

    params.delete(
      "order",
    );

    const query =
      params.toString();

    window.history.replaceState(
      {},
      "",
      query
        ? `/?${query}`
        : "/",
    );
  }, [orders]);

  const selected =
    useMemo(
      () =>
        orders.find(
          (order) =>
            order.id ===
            selectedId,
        ) ?? null,
      [
        orders,
        selectedId,
      ],
    );

  const visibleOrders =
    useMemo(
      () =>
        orders.filter(
          (order) =>
            inFilter(
              order,
              filter,
            ),
        ),
      [
        filter,
        orders,
      ],
    );

  const requestNotifications =
    async () => {
      if (
        typeof Notification ===
        "undefined"
      ) {
        setNotificationState(
          "unsupported",
        );
        return;
      }

      const permission =
        await Notification.requestPermission();

      setNotificationState(
        permission,
      );
    };

  const changeStatus =
    async (
      status: OrderStatus,
    ) => {
      if (
        !selected ||
        !token ||
        updating
      ) {
        return;
      }

      setUpdating(true);
      setError("");

      try {
        const updated =
          await updateAdminOrderStatus(
            token,
            selected.id,
            status,
          );

        setOrders(
          (current) =>
            current.map(
              (order) =>
                order.id ===
                updated.id
                  ? updated
                  : order,
            ),
        );
      } catch (
        updateError
      ) {
        if (
          isAuthError(
            updateError,
          )
        ) {
          logout();
          return;
        }

        setError(
          getApiErrorMessage(
            updateError,
          ),
        );
      } finally {
        setUpdating(false);
      }
    };

  if (booting) {
    return (
      <main className="splash">
        <div>
          SWAGYSTAN
        </div>
      </main>
    );
  }

  if (
    !token ||
    !authorized
  ) {
    return (
      <Login
        onSuccess={(
          nextToken,
        ) => {
          setError("");
          setToken(
            nextToken,
          );
        }}
      />
    );
  }

  return (
    <div className="app">
      <header className="top">
        <div>
          <div className="brand">
            SWAGYSTAN
          </div>

          <div className="title">
            ORDERS
          </div>

          <div className="live">
            <span
              className={
                online
                  ? "live__dot"
                  : "live__dot live__dot--off"
              }
            />

            {online
              ? "LIVE"
              : "OFFLINE"}
          </div>
        </div>

        <div className="top__actions">
          <button
            className={
              notificationState ===
              "granted"
                ? "icon icon--active"
                : "icon"
            }
            onClick={() => {
              void requestNotifications();
            }}
            title="Уведомления"
            type="button"
          >
            ◉
          </button>

          <button
            className="icon"
            disabled={loading}
            onClick={() => {
              setLoading(
                true,
              );

              void refreshOrders(
                false,
              ).finally(() =>
                setLoading(
                  false,
                ),
              );
            }}
            title="Обновить"
            type="button"
          >
            ↻
          </button>

          <button
            className="icon"
            onClick={logout}
            title="Выйти"
            type="button"
          >
            ×
          </button>
        </div>
      </header>

      <nav className="tabs">
        {FILTERS.map(
          (current) => (
            <button
              className={
                current.key ===
                filter
                  ? "tab active"
                  : "tab"
              }
              key={
                current.key
              }
              onClick={() =>
                setFilter(
                  current.key,
                )
              }
              type="button"
            >
              {
                current.label
              }
            </button>
          ),
        )}
      </nav>

      {error ? (
        <button
          className="error"
          onClick={() =>
            setError("")
          }
          type="button"
        >
          {error}
        </button>
      ) : null}

      <main className="list">
        {visibleOrders.length ===
        0 ? (
          <div className="empty">
            {loading
              ? "..."
              : "EMPTY"}
          </div>
        ) : (
          visibleOrders.map(
            (order) => (
              <OrderRow
                key={
                  order.id
                }
                order={
                  order
                }
                onOpen={() =>
                  setSelectedId(
                    order.id,
                  )
                }
              />
            ),
          )
        )}
      </main>

      {selected ? (
        <div
          className="backdrop"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedId(
                null,
              );
            }
          }}
        >
          <section className="sheet">
            <div className="sheet__head">
              <div>
                <h2>
                  {orderCode(
                    selected,
                  )}
                </h2>

                <div className="sheet__status">
                  {
                    STATUS_LABELS[
                      selected
                        .status
                    ]
                  }
                  {" · "}
                  {orderTime(
                    selected
                      .createdAt,
                  )}
                </div>
              </div>

              <button
                className="close"
                onClick={() =>
                  setSelectedId(
                    null,
                  )
                }
                type="button"
              >
                ×
              </button>
            </div>

            <div
              className={
                selected.items
                  .length ===
                1
                  ? "mosaic mosaic--one"
                  : "mosaic"
              }
            >
              {selected.items.map(
                (item) => (
                  <ProductCell
                    item={
                      item
                    }
                    key={
                      item.id
                    }
                    detail
                  />
                ),
              )}
            </div>

            <div className="total">
              {money(
                orderTotal(
                  selected,
                ),
              )}
            </div>

            <InfoRow
              label="CLIENT"
              value={
                selected.customerName ||
                "—"
              }
            />

            <InfoRow
              href={
                selected.phone
                  ? `tel:${selected.phone}`
                  : undefined
              }
              label="PHONE"
              value={
                selected.phone ||
                "—"
              }
            />

            <InfoRow
              href={
                selected.email
                  ? `mailto:${selected.email}`
                  : undefined
              }
              label="EMAIL"
              value={
                selected.email ||
                "—"
              }
            />

            <InfoRow
              label="DELIVERY"
              value={
                selected.deliveryMethod ||
                "—"
              }
            />

            <InfoRow
              label="ADDRESS"
              value={
                selected.address ||
                "—"
              }
            />

            {selected.comment ? (
              <InfoRow
                label="COMMENT"
                value={
                  selected.comment
                }
              />
            ) : null}

            <div className="actions">
              {STATUS_ACTIONS.map(
                (action) => (
                  <button
                    className={
                      selected.status ===
                      action.value
                        ? "act active"
                        : "act"
                    }
                    disabled={
                      updating
                    }
                    key={
                      action.value
                    }
                    onClick={() => {
                      void changeStatus(
                        action.value,
                      );
                    }}
                    type="button"
                  >
                    {
                      action.label
                    }
                  </button>
                ),
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function OrderRow({
  order,
  onOpen,
}: {
  order: Order;
  onOpen: () => void;
}) {
  const items =
    order.items.slice(
      0,
      4,
    );

  return (
    <button
      className="order"
      onClick={onOpen}
      type="button"
    >
      <span className="order__meta">
        <span className="order__number">
          {orderCode(
            order,
          )}
        </span>

        <span className="order__small">
          <i
            className={
              `dot ${statusClass(
                order.status,
              )}`
            }
          />

          {
            STATUS_LABELS[
              order.status
            ]
          }
        </span>
      </span>

      <span className="order__photos">
        {items.map(
          (item) => (
            <ProductCell
              item={
                item
              }
              key={
                item.id
              }
            />
          ),
        )}

        {items.length ===
        0 ? (
          <span className="photo photo--empty">
            SWA6
          </span>
        ) : null}
      </span>

      <span className="order__chevron">
        ›
      </span>
    </button>
  );
}

function ProductCell({
  item,
  detail = false,
}: {
  item: OrderItem;
  detail?: boolean;
}) {
  const image =
    firstImage(item);

  return (
    <span
      className={
        detail
          ? "photo photo--detail"
          : "photo"
      }
    >
      {image ? (
        <img
          alt={
            item.product.name
          }
          loading="lazy"
          src={image}
        />
      ) : (
        <span className="photo__fallback">
          SWA6
        </span>
      )}

      {item.quantity >
      1 ? (
        <span className="qty">
          ×
          {
            item.quantity
          }
        </span>
      ) : null}

      {detail ? (
        <span className="photo__caption">
          {
            item.product
              .name
          }
          {" · "}
          {item.size}
        </span>
      ) : null}
    </span>
  );
}

function InfoRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="info">
      <span>
        {label}
      </span>

      {href ? (
        <a href={href}>
          {value}
        </a>
      ) : (
        <b>
          {value}
        </b>
      )}
    </div>
  );
}

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
  setAdminOrderArchived,
  updateAdminOrderStatus,
} from "./api";

import type {
  Order,
  OrderItem,
  OrderStatus,
} from "./types";

type Filter =
  | "new"
  | "work"
  | "done"
  | "archive";

type OrderAction =
  | {
      type: "status";
      status: OrderStatus;
      label: string;
    }
  | {
      type: "archive";
      archived: boolean;
      label: string;
    };

const FILTERS: Array<{
  key: Filter;
  label: string;
}> = [
  {
    key: "new",
    label: "НОВЫЕ",
  },
  {
    key: "work",
    label: "В РАБОТЕ",
  },
  {
    key: "done",
    label: "ГОТОВО",
  },
  {
    key: "archive",
    label: "АРХИВ",
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

function itemTotal(
  item: OrderItem,
) {
  return (
    item.price *
    item.quantity
  );
}

function money(
  value: number,
) {
  return (
    new Intl.NumberFormat(
      "ru-RU",
    ).format(value) + " ₽"
  );
}

function orderTime(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "ru-RU",
    {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(new Date(value));
}

function itemsLabel(
  count: number,
) {
  if (
    count % 10 === 1 &&
    count % 100 !== 11
  ) {
    return `${count} товар`;
  }

  if (
    [2, 3, 4].includes(
      count % 10,
    ) &&
    ![12, 13, 14].includes(
      count % 100,
    )
  ) {
    return `${count} товара`;
  }

  return `${count} товаров`;
}

function inFilter(
  order: Order,
  filter: Filter,
) {
  if (filter === "archive") {
    return Boolean(
      order.archivedAt,
    );
  }

  if (order.archivedAt) {
    return false;
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
    order.status ===
      "DONE" ||
    order.status ===
      "CANCELLED"
  );
}

function nextAction(
  order: Order,
): OrderAction {
  if (order.archivedAt) {
    return {
      type: "archive",
      archived: false,
      label:
        "ВЕРНУТЬ ИЗ АРХИВА",
    };
  }

  if (
    order.status ===
    "PENDING"
  ) {
    return {
      type: "status",
      status: "PAID",
      label: "В РАБОТУ",
    };
  }

  if (
    order.status ===
      "PAID" ||
    order.status ===
      "SHIPPED"
  ) {
    return {
      type: "status",
      status: "DONE",
      label: "ГОТОВО",
    };
  }

  return {
    type: "archive",
    archived: true,
    label: "В АРХИВ",
  };
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
        <div className="brand">
          SWAGYSTAN
        </div>

        <h1>ЗАКАЗЫ</h1>

        <label className="field">
          <span>
            ПОЧТА
          </span>

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
          <span>
            ПАРОЛЬ
          </span>

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
            : "ВОЙТИ"}
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
    "new",
  );

  const [
    expandedId,
    setExpandedId,
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
      setExpandedId(null);
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

        try {
          const registration =
            await navigator
              .serviceWorker
              .ready;

          await registration.showNotification(
            `Новый заказ ${orderCode(
              order,
            )}`,
            {
              body:
                money(
                  orderTotal(
                    order,
                  ),
                ),
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
        } catch {
          // Уведомления не должны ломать заказы.
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
      orders.length === 0
    ) {
      return;
    }

    const params =
      new URLSearchParams(
        window.location.search,
      );

    const orderId =
      params.get("order");

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

    setExpandedId(
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

  const counts =
    useMemo(
      () =>
        Object.fromEntries(
          FILTERS.map(
            (item) => [
              item.key,
              orders.filter(
                (order) =>
                  inFilter(
                    order,
                    item.key,
                  ),
              ).length,
            ],
          ),
        ) as Record<
          Filter,
          number
        >,
      [orders],
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

  const advanceOrder =
    async (
      order: Order,
    ) => {
      if (
        !token ||
        updating
      ) {
        return;
      }

      const action =
        nextAction(order);

      setUpdating(true);
      setError("");

      try {
        const updated =
          action.type ===
          "status"
            ? await updateAdminOrderStatus(
                token,
                order.id,
                action.status,
              )
            : await setAdminOrderArchived(
                token,
                order.id,
                action.archived,
              );

        setOrders(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                updated.id
                  ? updated
                  : item,
            ),
        );

        setExpandedId(null);
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
        SWAGYSTAN
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
            ЗАКАЗЫ
          </div>
        </div>

        <div className="top__actions">
          <button
            className={
              notificationState ===
              "granted"
                ? "mini-button mini-button--active"
                : "mini-button"
            }
            onClick={() => {
              void requestNotifications();
            }}
            type="button"
          >
            УВЕД.
          </button>

          <button
            className="mini-button"
            onClick={logout}
            type="button"
          >
            ВЫХОД
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
              onClick={() => {
                setFilter(
                  current.key,
                );
                setExpandedId(
                  null,
                );
              }}
              type="button"
            >
              <span>
                {
                  current.label
                }
              </span>

              <b>
                {
                  counts[
                    current.key
                  ]
                }
              </b>
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
              : "ПУСТО"}
          </div>
        ) : (
          visibleOrders.map(
            (order) => (
              <OrderCard
                expanded={
                  expandedId ===
                  order.id
                }
                key={
                  order.id
                }
                onAction={() => {
                  void advanceOrder(
                    order,
                  );
                }}
                onToggle={() =>
                  setExpandedId(
                    (
                      current,
                    ) =>
                      current ===
                      order.id
                        ? null
                        : order.id,
                  )
                }
                order={
                  order
                }
                updating={
                  updating
                }
              />
            ),
          )
        )}
      </main>
    </div>
  );
}

function OrderCard({
  order,
  expanded,
  onToggle,
  onAction,
  updating,
}: {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
  onAction: () => void;
  updating: boolean;
}) {
  const action =
    nextAction(order);

  return (
    <article
      className={
        expanded
          ? "order-card order-card--expanded"
          : "order-card"
      }
    >
      <button
        className="order-card__head"
        onClick={onToggle}
        type="button"
      >
        <span className="order-card__number">
          {orderCode(
            order,
          )}
        </span>

        <span className="order-card__summary">
          <strong>
            {money(
              orderTotal(
                order,
              ),
            )}
          </strong>

          <span>
            {order.customerName ||
              "Без имени"}
          </span>

          <small>
            {itemsLabel(
              order.items.length,
            )}
            {" · "}
            {orderTime(
              order.createdAt,
            )}
          </small>
        </span>

        <span
          className={
            expanded
              ? "order-card__arrow order-card__arrow--open"
              : "order-card__arrow"
          }
        >
          ↓
        </span>
      </button>

      {expanded ? (
        <div className="order-detail">
          <section className="detail-section">
            <div className="section-title">
              ТОВАРЫ
            </div>

            <div className="items">
              {order.items.map(
                (item) => (
                  <div
                    className="item"
                    key={
                      item.id
                    }
                  >
                    <div className="item__main">
                      <strong>
                        {
                          item
                            .product
                            .name
                        }
                      </strong>

                      <span>
                        Размер{" "}
                        {
                          item.size
                        }
                        {" · "}
                        {
                          item.quantity
                        } шт.
                      </span>
                    </div>

                    <b>
                      {money(
                        itemTotal(
                          item,
                        ),
                      )}
                    </b>
                  </div>
                ),
              )}
            </div>
          </section>

          <section className="detail-section">
            <div className="section-title">
              КЛИЕНТ
            </div>

            <div className="detail-grid">
              {order.customerName ? (
                <DetailCell
                  label="ИМЯ"
                  value={
                    order.customerName
                  }
                />
              ) : null}

              {order.phone ? (
                <DetailCell
                  href={
                    `tel:${order.phone}`
                  }
                  label="ТЕЛЕФОН"
                  value={
                    order.phone
                  }
                />
              ) : null}

              {order.email ? (
                <DetailCell
                  href={
                    `mailto:${order.email}`
                  }
                  label="ПОЧТА"
                  value={
                    order.email
                  }
                />
              ) : null}
            </div>
          </section>

          {order.deliveryMethod ||
          order.address ? (
            <section className="detail-section">
              <div className="section-title">
                ДОСТАВКА
              </div>

              <div className="detail-grid">
                {order.deliveryMethod ? (
                  <DetailCell
                    label="СПОСОБ"
                    value={
                      order.deliveryMethod
                    }
                  />
                ) : null}

                {order.address ? (
                  <DetailCell
                    wide
                    label="АДРЕС"
                    value={
                      order.address
                    }
                  />
                ) : null}
              </div>
            </section>
          ) : null}

          {order.comment ? (
            <section className="detail-section">
              <div className="section-title">
                КОММЕНТАРИЙ
              </div>

              <div className="comment">
                {
                  order.comment
                }
              </div>
            </section>
          ) : null}

          <div className="order-total">
            <span>
              ИТОГО
            </span>

            <strong>
              {money(
                orderTotal(
                  order,
                ),
              )}
            </strong>
          </div>

          <button
            className="primary-action"
            disabled={
              updating
            }
            onClick={
              onAction
            }
            type="button"
          >
            {updating
              ? "..."
              : action.label}
          </button>
        </div>
      ) : null}
    </article>
  );
}

function DetailCell({
  label,
  value,
  href,
  wide = false,
}: {
  label: string;
  value: string;
  href?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={
        wide
          ? "detail-cell detail-cell--wide"
          : "detail-cell"
      }
    >
      <span>
        {label}
      </span>

      {href ? (
        <a href={href}>
          {value}
        </a>
      ) : (
        <strong>
          {value}
        </strong>
      )}
    </div>
  );
}

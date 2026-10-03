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
  deleteAdminOrder,
  deleteAdminOrderItem,
  getAccessToken,
  getAdminOrders,
  getApiErrorMessage,
  getPushPublicKey,
  isAuthError,
  loginAdmin,
  removePushSubscription,
  saveAccessToken,
  savePushSubscription,
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

type Stage =
  | "new"
  | "work"
  | "done"
  | "archive";

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

const STAGES: Array<{
  key: Stage;
  label: string;
}> = [
  {
    key: "new",
    label: "НОВЫЙ",
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

function urlBase64ToUint8Array(
  value: string,
) {
  const padding =
    "=".repeat(
      (4 -
        (value.length %
          4)) %
        4,
    );

  const base64 =
    (
      value +
      padding
    )
      .replace(
        /-/g,
        "+",
      )
      .replace(
        /_/g,
        "/",
      );

  const raw =
    window.atob(
      base64,
    );

  return Uint8Array.from(
    raw,
    (
      char,
    ) =>
      char.charCodeAt(
        0,
      ),
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(
    navigator.userAgent,
  );
}

function isStandalone() {
  const iosNavigator =
    navigator as Navigator & {
      standalone?:
        boolean;
    };

  return (
    window.matchMedia(
      "(display-mode: standalone)",
    ).matches ||
    iosNavigator.standalone ===
      true
  );
}

function orderStage(
  order: Order,
): Stage {
  if (order.archivedAt) {
    return "archive";
  }

  if (
    order.status ===
    "PENDING"
  ) {
    return "new";
  }

  if (
    order.status ===
      "PAID" ||
    order.status ===
      "SHIPPED"
  ) {
    return "work";
  }

  return "done";
}

function inFilter(
  order: Order,
  filter: Filter,
) {
  return (
    orderStage(order) ===
    filter
  );
}

function stageStatus(
  stage: Exclude<
    Stage,
    "archive"
  >,
): OrderStatus {
  if (stage === "new") {
    return "PENDING";
  }

  if (stage === "work") {
    return "PAID";
  }

  return "DONE";
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
          <span>ПОЧТА</span>

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
          <span>ПАРОЛЬ</span>

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
  ] = useState<
    | "unsupported"
    | "denied"
    | "disabled"
    | "enabled"
    | "loading"
  >(() => {
    if (
      typeof Notification ===
        "undefined" ||
      !(
        "serviceWorker" in
        navigator
      ) ||
      !(
        "PushManager" in
        window
      )
    ) {
      return "unsupported";
    }

    if (
      Notification.permission ===
      "denied"
    ) {
      return "denied";
    }

    return "disabled";
  });

  const refreshing =
    useRef(false);

  const logout =
    useCallback(() => {
      clearAccessToken();
      setToken(null);
      setAuthorized(false);
      setOrders([]);
      setExpandedId(null);
    }, []);

  const refreshOrders =
    useCallback(
      async () => {
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

    void refreshOrders().finally(() =>
      setLoading(false),
    );

    const interval =
      window.setInterval(
        () => {
          void refreshOrders();
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
      !authorized ||
      !token
    ) {
      return;
    }

    if (
      typeof Notification ===
        "undefined" ||
      !(
        "serviceWorker" in
        navigator
      ) ||
      !(
        "PushManager" in
        window
      )
    ) {
      setNotificationState(
        "unsupported",
      );
      return;
    }

    if (
      Notification.permission ===
      "denied"
    ) {
      setNotificationState(
        "denied",
      );
      return;
    }

    let active = true;

    void (async () => {
      try {
        const registration =
          await navigator
            .serviceWorker
            .ready;

        const subscription =
          await registration
            .pushManager
            .getSubscription();

        if (!active) {
          return;
        }

        setNotificationState(
          subscription
            ? "enabled"
            : "disabled",
        );

        if (
          subscription
        ) {
          await savePushSubscription(
            token,
            subscription.toJSON(),
          );
        }
      } catch {
        if (active) {
          setNotificationState(
            "disabled",
          );
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [
    authorized,
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

    const targetOrder =
      orders.find(
        (order) =>
          order.id ===
          orderId,
      );

    if (
      !orderId ||
      !targetOrder
    ) {
      return;
    }

    setFilter(
      orderStage(
        targetOrder,
      ),
    );

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
      if (!token) {
        return;
      }

      if (
        typeof Notification ===
          "undefined" ||
        !(
          "serviceWorker" in
          navigator
        ) ||
        !(
          "PushManager" in
          window
        )
      ) {
        setNotificationState(
          "unsupported",
        );
        setError(
          "Push-уведомления не поддерживаются на этом устройстве.",
        );
        return;
      }

      if (
        isIos() &&
        !isStandalone()
      ) {
        setError(
          "На iPhone сначала открой admin.swagystan.ru в Safari → Поделиться → На экран «Домой», затем открой приложение с иконки.",
        );
        return;
      }

      setError("");

      try {
        if (
          notificationState ===
          "enabled"
        ) {
          setNotificationState(
            "loading",
          );

          const registration =
            await navigator
              .serviceWorker
              .ready;

          const existing =
            await registration
              .pushManager
              .getSubscription();

          if (existing) {
            await removePushSubscription(
              token,
              existing.endpoint,
            );

            await existing.unsubscribe();
          }

          setNotificationState(
            "disabled",
          );
          return;
        }

        // На iOS запрос разрешения должен идти непосредственно после нажатия.
        const permission =
          await Notification.requestPermission();

        if (
          permission !==
          "granted"
        ) {
          setNotificationState(
            permission ===
              "denied"
              ? "denied"
              : "disabled",
          );

          setError(
            permission ===
              "denied"
              ? "Уведомления запрещены в настройках iPhone."
              : "Разрешение на уведомления не выдано.",
          );

          return;
        }

        setNotificationState(
          "loading",
        );

        const {
          publicKey,
        } =
          await getPushPublicKey(
            token,
          );

        const registration =
          await navigator
            .serviceWorker
            .ready;

        let subscription =
          await registration
            .pushManager
            .getSubscription();

        if (!subscription) {
          subscription =
            await registration
              .pushManager
              .subscribe({
                userVisibleOnly:
                  true,

                applicationServerKey:
                  urlBase64ToUint8Array(
                    publicKey,
                  ),
              });
        }

        await savePushSubscription(
          token,
          subscription.toJSON(),
        );

        setNotificationState(
          "enabled",
        );
      } catch (
        pushError
      ) {
        setNotificationState(
          "disabled",
        );

        setError(
          getApiErrorMessage(
            pushError,
          ),
        );
      }
    };

  const changeStage =
    async (
      order: Order,
      stage: Stage,
    ) => {
      if (
        !token ||
        updating ||
        orderStage(order) ===
          stage
      ) {
        return;
      }

      setUpdating(true);
      setError("");

      try {
        let updated =
          order;

        if (
          stage ===
          "archive"
        ) {
          updated =
            await setAdminOrderArchived(
              token,
              order.id,
              true,
            );
        } else {
          if (
            order.archivedAt
          ) {
            updated =
              await setAdminOrderArchived(
                token,
                order.id,
                false,
              );
          }

          updated =
            await updateAdminOrderStatus(
              token,
              order.id,
              stageStatus(
                stage,
              ),
            );
        }

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

  const removeItem =
    async (
      order: Order,
      item: OrderItem,
    ) => {
      if (
        !token ||
        updating
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Удалить ${item.product.name} из ${orderCode(
            order,
          )}?`,
        );

      if (!confirmed) {
        return;
      }

      setUpdating(true);
      setError("");

      try {
        const updated =
          await deleteAdminOrderItem(
            token,
            order.id,
            item.id,
          );

        setOrders(
          (current) =>
            current.map(
              (currentOrder) =>
                currentOrder.id ===
                updated.id
                  ? updated
                  : currentOrder,
            ),
        );
      } catch (
        removeError
      ) {
        if (
          isAuthError(
            removeError,
          )
        ) {
          logout();
          return;
        }

        setError(
          getApiErrorMessage(
            removeError,
          ),
        );
      } finally {
        setUpdating(false);
      }
    };

  const removeOrder =
    async (
      order: Order,
    ) => {
      if (
        !token ||
        updating
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Удалить заказ ${orderCode(
            order,
          )} полностью? Это действие нельзя отменить.`,
        );

      if (!confirmed) {
        return;
      }

      setUpdating(true);
      setError("");

      try {
        await deleteAdminOrder(
          token,
          order.id,
        );

        setOrders(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                order.id,
            ),
        );

        setExpandedId(null);
      } catch (
        removeError
      ) {
        if (
          isAuthError(
            removeError,
          )
        ) {
          logout();
          return;
        }

        setError(
          getApiErrorMessage(
            removeError,
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
              "enabled"
                ? "mini-button mini-button--active"
                : "mini-button"
            }
            disabled={
              notificationState ===
              "loading" ||
              notificationState ===
              "unsupported"
            }
            onClick={() => {
              void requestNotifications();
            }}
            type="button"
          >
            {notificationState ===
            "loading"
              ? "..."
              : notificationState ===
                  "enabled"
                ? "УВЕД. ВКЛ"
                : "УВЕД."}
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
                onChangeStage={(
                  stage,
                ) => {
                  void changeStage(
                    order,
                    stage,
                  );
                }}
                onDeleteItem={(
                  item,
                ) => {
                  void removeItem(
                    order,
                    item,
                  );
                }}
                onDeleteOrder={() => {
                  void removeOrder(
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
  onChangeStage,
  onDeleteItem,
  onDeleteOrder,
  updating,
}: {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
  onChangeStage: (
    stage: Stage,
  ) => void;
  onDeleteItem: (
    item: OrderItem,
  ) => void;
  onDeleteOrder: () => void;
  updating: boolean;
}) {
  const currentStage =
    orderStage(order);

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
              СТАТУС
            </div>

            <div className="stage-switcher">
              {STAGES.map(
                (stage) => (
                  <button
                    className={
                      currentStage ===
                      stage.key
                        ? "stage stage--active"
                        : "stage"
                    }
                    disabled={
                      updating
                    }
                    key={
                      stage.key
                    }
                    onClick={() =>
                      onChangeStage(
                        stage.key,
                      )
                    }
                    type="button"
                  >
                    {
                      stage.label
                    }
                  </button>
                ),
              )}
            </div>
          </section>

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

                    <div className="item__right">
                      <b>
                        {money(
                          itemTotal(
                            item,
                          ),
                        )}
                      </b>

                      {order.items
                        .length >
                      1 ? (
                        <button
                          className="item-delete"
                          disabled={
                            updating
                          }
                          onClick={() =>
                            onDeleteItem(
                              item,
                            )
                          }
                          type="button"
                        >
                          УДАЛИТЬ
                        </button>
                      ) : null}
                    </div>
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
            className="delete-order"
            disabled={
              updating
            }
            onClick={
              onDeleteOrder
            }
            type="button"
          >
            УДАЛИТЬ ЗАКАЗ
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

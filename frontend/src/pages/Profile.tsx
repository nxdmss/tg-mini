import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  getAccessToken,
  getMe,
} from "../api";

import {
  getMyOrders,
} from "../ordersApi";

import type {
  AuthUser,
  Order,
} from "../types";

import {
  formatPrice,
} from "../utils";

import "./Profile.css";

const AVATAR_PREFIX =
  "swa6y5tan.profile.avatar.";

function getDisplayName(
  user: AuthUser,
) {
  const name =
    user.name?.trim();

  if (name) {
    return name;
  }

  if (
    user.firstName ||
    user.lastName
  ) {
    return [
      user.firstName,
      user.lastName,
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (user.username) {
    return `@${user.username}`;
  }

  if (user.email) {
    return user.email.split(
      "@",
    )[0];
  }

  return "Профиль";
}

function getInitials(
  name: string,
) {
  const parts =
    name
      .replace("@", "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length === 0
  ) {
    return "S";
  }

  if (
    parts.length === 1
  ) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[1][0]
  ).toUpperCase();
}

function orderTotal(
  order: Order,
) {
  return order.items.reduce(
    (
      sum,
      item,
    ) =>
      sum +
      item.price *
        item.quantity,
    0,
  );
}

function formatDate(
  value?: string,
) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "ru-RU",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  ).format(
    new Date(value),
  );
}

function statusLabel(
  status: Order["status"],
) {
  switch (status) {
    case "PENDING":
      return "Новый";

    case "PAID":
      return "Подтверждён";

    case "SHIPPED":
      return "В пути";

    case "DONE":
      return "Выполнен";

    case "CANCELLED":
      return "Отменён";

    default:
      return status;
  }
}

function avatarStorageKey(
  user: AuthUser,
) {
  return (
    AVATAR_PREFIX +
    (
      user.id ??
      user.email ??
      user.telegramId ??
      "guest"
    )
  );
}

export default function Profile() {
  const token =
    getAccessToken();

  const fileInputRef =
    useRef<HTMLInputElement>(
      null,
    );

  const [
    user,
    setUser,
  ] =
    useState<AuthUser | null>(
      null,
    );

  const [
    orders,
    setOrders,
  ] =
    useState<Order[]>([]);

  const [
    avatar,
    setAvatar,
  ] =
    useState<string | null>(
      null,
    );

  const [
    avatarError,
    setAvatarError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active =
      true;

    async function load() {
      setLoading(true);
      setError(false);

      try {
        const [
          userData,
          orderData,
        ] =
          await Promise.all([
            getMe(),
            getMyOrders(),
          ]);

        if (!active) {
          return;
        }

        setUser(
          userData,
        );

        setOrders(
          orderData,
        );

        try {
          const savedAvatar =
            localStorage.getItem(
              avatarStorageKey(
                userData,
              ),
            );

          setAvatar(
            savedAvatar,
          );
        } catch {
          setAvatar(
            null,
          );
        }
      } catch {
        if (!active) {
          return;
        }

        setError(true);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active =
        false;
    };
  }, [token]);

  const displayName =
    useMemo(
      () =>
        user
          ? getDisplayName(
              user,
            )
          : "",
      [user],
    );

  const initials =
    useMemo(
      () =>
        getInitials(
          displayName,
        ),
      [displayName],
    );

  function openAvatarPicker() {
    setAvatarError(
      null,
    );

    fileInputRef.current?.click();
  }

  function handleAvatarChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    event.target.value =
      "";

    if (
      !file ||
      !user
    ) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/",
      )
    ) {
      setAvatarError(
        "Выберите изображение.",
      );

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setAvatarError(
        "Фото должно быть меньше 5 МБ.",
      );

      return;
    }

    const reader =
      new FileReader();

    reader.onload =
      () => {
        const result =
          reader.result;

        if (
          typeof result !==
          "string"
        ) {
          return;
        }

        try {
          localStorage.setItem(
            avatarStorageKey(
              user,
            ),
            result,
          );

          setAvatar(
            result,
          );

          setAvatarError(
            null,
          );
        } catch {
          setAvatarError(
            "Не удалось сохранить фото.",
          );
        }
      };

    reader.readAsDataURL(
      file,
    );
  }

  function removeAvatar() {
    if (!user) {
      return;
    }

    try {
      localStorage.removeItem(
        avatarStorageKey(
          user,
        ),
      );
    } catch {
      // ignore
    }

    setAvatar(
      null,
    );

    setAvatarError(
      null,
    );
  }

  if (!token) {
    return (
      <main className="profile-page profile-page--guest">
        <div className="profile-guest">
          <h1>
            Профиль
          </h1>

          <p>
            Войдите или
            зарегистрируйтесь,
            чтобы видеть свои
            заказы.
          </p>

          <div className="profile-guest__actions">
            <Link
              to="/login"
              className="profile-auth-btn"
            >
              Войти
            </Link>

            <Link
              to="/register"
              className="profile-auth-btn"
            >
              Регистрация
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="profile-page">
        <div className="profile-loading">
          Загрузка...
        </div>
      </main>
    );
  }

  if (
    error ||
    !user
  ) {
    return (
      <main className="profile-page">
        <div className="profile-loading">
          Не удалось загрузить
          профиль.
        </div>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <section className="profile-head">
        <input
          ref={fileInputRef}
          className="profile-avatar-input"
          type="file"
          accept="image/*"
          onChange={
            handleAvatarChange
          }
        />

        <button
          type="button"
          className="profile-avatar"
          onClick={
            openAvatarPicker
          }
          aria-label="Изменить аватар"
        >
          {avatar ? (
            <img
              src={avatar}
              alt=""
            />
          ) : (
            <span>
              {initials}
            </span>
          )}

          <span className="profile-avatar__edit">
            +
          </span>
        </button>

        {avatar && (
          <button
            type="button"
            className="profile-avatar-remove"
            onClick={
              removeAvatar
            }
          >
            Удалить фото
          </button>
        )}

        {avatarError && (
          <div className="profile-avatar-error">
            {avatarError}
          </div>
        )}

        <h1 className="profile-name">
          {displayName}
        </h1>

        {user.email && (
          <div className="profile-email">
            {user.email}
          </div>
        )}
      </section>

      <section className="profile-orders">
        <div className="profile-divider" />

        <h2 className="profile-orders__title">
          Заказы
        </h2>

        {orders.length ===
        0 ? (
          <div className="profile-orders__empty">
            Заказов пока нет
          </div>
        ) : (
          <div className="profile-orders__list">
            {orders.map(
              (
                order,
                index,
              ) => (
                <article
                  className="profile-order"
                  key={
                    order.id
                  }
                >
                  <div className="profile-order__top">
                    <div>
                      <div className="profile-order__number">
                        Заказ{" "}
                        #
                        {
                          orders.length -
                          index
                        }
                      </div>

                      <div className="profile-order__date">
                        {formatDate(
                          order.createdAt,
                        )}
                      </div>
                    </div>

                    <div className="profile-order__status">
                      {statusLabel(
                        order.status,
                      )}
                    </div>
                  </div>

                  <div className="profile-order__items">
                    {order.items.map(
                      (
                        item,
                      ) => (
                        <div
                          className="profile-order-item"
                          key={
                            item.id
                          }
                        >
                          <div className="profile-order-item__media">
                            {item
                              .product
                              .images?.[0]
                              ?.url && (
                              <img
                                src={
                                  item
                                    .product
                                    .images[0]
                                    .url
                                }
                                alt={
                                  item
                                    .product
                                    .name
                                }
                              />
                            )}
                          </div>

                          <div className="profile-order-item__info">
                            <div className="profile-order-item__name">
                              {
                                item
                                  .product
                                  .name
                              }
                            </div>

                            <div className="profile-order-item__meta">
                              Размер{" "}
                              {
                                item.size
                              }{" "}
                              ·{" "}
                              {
                                item.quantity
                              }{" "}
                              шт.
                            </div>
                          </div>

                          <div className="profile-order-item__price">
                            {formatPrice(
                              item.price *
                                item.quantity,
                            )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  <div className="profile-order__bottom">
                    <span>
                      Итого
                    </span>

                    <strong>
                      {formatPrice(
                        orderTotal(
                          order,
                        ),
                      )}
                    </strong>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </section>
    </main>
  );
}
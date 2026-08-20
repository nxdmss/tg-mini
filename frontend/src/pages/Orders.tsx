import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  Navigate,
} from "react-router-dom";

import {
  getAccessToken,
  getApiErrorMessage,
} from "../api";

import {
  getMyOrders,
} from "../ordersApi";

import type {
  Order,
} from "../types";

export default function Orders() {
  const token =
    getAccessToken();

  const [
    orders,
    setOrders,
  ] =
    useState<Order[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data =
          await getMyOrders();

        if (active) {
          setOrders(data);
        }
      } catch (error) {
        if (active) {
          setError(
            getApiErrorMessage(
              error,
            ),
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [token]);

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return (
    <main
      style={{
        minHeight:
          "100vh",

        background:
          "#fff",

        color:
          "#111",

        padding:
          "24px",

        fontFamily:
          "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width:
            "100%",

          maxWidth:
            "760px",

          margin:
            "0 auto",
        }}
      >
        <Link
          to="/profile"
          style={{
            display:
              "inline-block",

            marginBottom:
              "32px",

            color:
              "#111",

            textDecoration:
              "none",
          }}
        >
          ← Профиль
        </Link>

        <h1
          style={{
            margin:
              "0 0 8px",

            fontSize:
              "34px",
          }}
        >
          Мои заказы
        </h1>

        <p
          style={{
            margin:
              "0 0 32px",

            color:
              "#777",
          }}
        >
          История ваших заказов
        </p>

        {loading ? (
          <div>
            Загружаем заказы...
          </div>
        ) : error ? (
          <div
            style={{
              padding:
                "16px",

              borderRadius:
                "12px",

              background:
                "#f5f5f5",
            }}
          >
            {error}
          </div>
        ) : orders.length ===
          0 ? (
          <div
            style={{
              padding:
                "32px",

              border:
                "1px solid #eee",

              borderRadius:
                "16px",

              textAlign:
                "center",
            }}
          >
            <div
              style={{
                fontSize:
                  "20px",

                fontWeight:
                  600,

                marginBottom:
                  "8px",
              }}
            >
              Заказов пока нет
            </div>

            <div
              style={{
                color:
                  "#777",

                marginBottom:
                  "20px",
              }}
            >
              Добавьте товар в корзину и оформите первый заказ.
            </div>

            <Link
              to="/"
              style={{
                display:
                  "inline-block",

                padding:
                  "12px 18px",

                borderRadius:
                  "12px",

                background:
                  "#111",

                color:
                  "#fff",

                textDecoration:
                  "none",
              }}
            >
              В магазин
            </Link>
          </div>
        ) : (
          <div
            style={{
              display:
                "flex",

              flexDirection:
                "column",

              gap:
                "16px",
            }}
          >
            {orders.map(
              (order) => (
                <OrderCard
                  key={
                    order.id
                  }
                  order={
                    order
                  }
                />
              ),
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function OrderCard({
  order,
}: {
  order: Order;
}) {
  const createdAt =
    "createdAt" in
      order &&
    order.createdAt
      ? new Date(
          String(
            order.createdAt,
          ),
        ).toLocaleString(
          "ru-RU",
        )
      : "";

  const items =
    Array.isArray(
      order.items,
    )
      ? order.items
      : [];

  const total =
    items.reduce(
      (
        sum: number,
        item: any,
      ) =>
        sum +
        Number(
          item.price ??
            0,
        ) *
          Number(
            item.quantity ??
              0,
          ),
      0,
    );

  return (
    <article
      style={{
        border:
          "1px solid #e8e8e8",

        borderRadius:
          "16px",

        padding:
          "20px",
      }}
    >
      <div
        style={{
          display:
            "flex",

          justifyContent:
            "space-between",

          gap:
            "12px",

          alignItems:
            "flex-start",

          marginBottom:
            "18px",
        }}
      >
        <div>
          <div
            style={{
              fontWeight:
                700,

              fontSize:
                "16px",
            }}
          >
            Заказ #
            {order.id.slice(
              -6,
            )}
          </div>

          {createdAt && (
            <div
              style={{
                marginTop:
                  "4px",

                color:
                  "#777",

                fontSize:
                  "13px",
              }}
            >
              {createdAt}
            </div>
          )}
        </div>

        <div
          style={{
            padding:
              "6px 10px",

            borderRadius:
              "999px",

            background:
              "#f3f3f3",

            fontSize:
              "12px",

            fontWeight:
              600,
          }}
        >
          {String(
            order.status,
          )}
        </div>
      </div>

      <div
        style={{
          display:
            "flex",

          flexDirection:
            "column",

          gap:
            "12px",
        }}
      >
        {items.map(
          (
            item: any,
          ) => (
            <div
              key={
                item.id
              }
              style={{
                display:
                  "flex",

                justifyContent:
                  "space-between",

                gap:
                  "16px",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight:
                      600,
                  }}
                >
                  {item
                    .product
                    ?.name ??
                    "Товар"}
                </div>

                <div
                  style={{
                    color:
                      "#777",

                    fontSize:
                      "13px",

                    marginTop:
                      "3px",
                  }}
                >
                  Размер:{" "}
                  {item.size}
                  {" · "}
                  Количество:{" "}
                  {
                    item.quantity
                  }
                </div>
              </div>

              <div
                style={{
                  fontWeight:
                    600,

                  whiteSpace:
                    "nowrap",
                }}
              >
                {formatPrice(
                  Number(
                    item.price,
                  ) *
                    Number(
                      item.quantity,
                    ),
                )}
              </div>
            </div>
          ),
        )}
      </div>

      <div
        style={{
          marginTop:
            "18px",

          paddingTop:
            "18px",

          borderTop:
            "1px solid #eee",

          display:
            "flex",

          justifyContent:
            "space-between",

          fontWeight:
            700,

          fontSize:
            "17px",
        }}
      >
        <span>
          Итого
        </span>

        <span>
          {formatPrice(
            total,
          )}
        </span>
      </div>
    </article>
  );
}

function formatPrice(
  value: number,
) {
  return new Intl.NumberFormat(
    "ru-RU",
  ).format(value) + " ₽";
}
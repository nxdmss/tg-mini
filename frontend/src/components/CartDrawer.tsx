import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useCart } from "../cart";
import { formatPrice } from "../utils";
import {
  createOrder,
  getApiErrorMessage,
} from "../api";
import {
  getUserName,
  tg,
} from "../telegram";

type Step =
  | "cart"
  | "checkout"
  | "done";

const DELIVERY = "Доставка";
const PICKUP = "Самовывоз";
const PHONE_PREFIX = "+7";

function phoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeRussianPhone(
  value: string,
) {
  const digits =
    phoneDigits(value);

  const withoutCountry =
    digits.startsWith("7")
      ? digits.slice(1)
      : digits.startsWith("8")
        ? digits.slice(1)
        : digits;

  return `${PHONE_PREFIX}${withoutCountry.slice(
    0,
    10,
  )}`;
}

function isValidEmail(
  value: string,
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value.trim(),
  );
}

export function CartDrawer({
  onClose,
}: {
  onClose: () => void;
}) {
  const {
    items,
    total,
    setQuantity,
    remove,
    clear,
  } = useCart();

  const [step, setStep] =
    useState<Step>("cart");

  const [name, setName] =
    useState(
      getUserName() ?? "",
    );

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState(PHONE_PREFIX);

  const [
    deliveryMethod,
    setDeliveryMethod,
  ] = useState(DELIVERY);

  const [address, setAddress] =
    useState("");

  const [comment, setComment] =
    useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const isDelivery =
    deliveryMethod === DELIVERY;

  const isNameValid =
    name.trim().length >= 2;

  const isEmailValid =
    isValidEmail(email);

  const isPhoneValid =
    /^\+7\d{10}$/.test(
      phone,
    );

  const isAddressValid =
    !isDelivery ||
    address.trim().length >= 6;

  const canSubmit =
    isNameValid &&
    isEmailValid &&
    isPhoneValid &&
    isAddressValid;

  useEffect(() => {
    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        "";
    };
  }, []);

  const subtotal =
    useMemo(
      () => total,
      [total],
    );

  async function submit() {
    if (!isNameValid) {
      setError(
        "Введите имя.",
      );
      return;
    }

    if (!isEmailValid) {
      setError(
        "Введите корректный email.",
      );
      return;
    }

    if (!isPhoneValid) {
      setError(
        "Введите телефон полностью, чтобы мы могли подтвердить заказ.",
      );
      return;
    }

    if (!isAddressValid) {
      setError(
        "Для доставки нужен адрес.",
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createOrder({
        name:
          name.trim(),

        email:
          email
            .trim()
            .toLowerCase(),

        phone,

        deliveryMethod,

        address:
          address.trim() ||
          undefined,

        comment:
          comment.trim() ||
          undefined,

        items:
          items.map(
            (i) => ({
              productId:
                i.productId,

              quantity:
                i.quantity,

              size:
                i.size,
            }),
          ),
      });

      clear();
      setStep("done");

      try {
        tg.HapticFeedback
          ?.notificationOccurred?.(
            "success",
          );
      } catch {
        // not in Telegram
      }
    } catch (orderError) {
      setError(
        getApiErrorMessage(
          orderError,
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function backAction() {
    if (
      step === "checkout"
    ) {
      setStep("cart");
      return;
    }

    onClose();
  }

  return (
    <>
      <div
        className="overlay"
        onClick={onClose}
      />

      <div className="drawer checkout-modal">
        <div className="checkout-modal__header">
          <button
            className="checkout-icon-btn"
            onClick={
              backAction
            }
            aria-label={
              step ===
              "checkout"
                ? "Назад"
                : "Закрыть"
            }
            type="button"
          >
            ←
          </button>

          <button
            className="checkout-icon-btn"
            onClick={
              onClose
            }
            aria-label="Закрыть"
            type="button"
          >
            ✕
          </button>
        </div>

        {step === "done" ? (
          <div className="checkout-done">
            <div className="checkout-done__title">
              ЗАКАЗ ОФОРМЛЕН
            </div>

            <div className="checkout-done__text">
              Мы получили
              ваш заказ.
              <br />
              Скоро свяжемся
              для
              подтверждения.
            </div>

            <button
              className="checkout-submit-btn"
              onClick={
                onClose
              }
              type="button"
            >
              ЗАКРЫТЬ
            </button>
          </div>
        ) : items.length ===
          0 ? (
          <div className="checkout-empty">
            <div className="checkout-empty__title">
              КОРЗИНА ПУСТА
            </div>
          </div>
        ) : step ===
          "cart" ? (
          <div className="checkout-cart-view">
            <div className="checkout-section-title">
              КОРЗИНА
            </div>

            <div className="checkout-cart-list">
              {items.map(
                (i) => (
                  <div
                    className="checkout-cart-item"
                    key={`${i.productId}-${i.size}`}
                  >
                    <div className="checkout-cart-item__image">
                      {i.image && (
                        <img
                          src={
                            i.image
                          }
                          alt={
                            i.name
                          }
                        />
                      )}
                    </div>

                    <div className="checkout-cart-item__body">
                      <div className="checkout-cart-item__name">
                        {
                          i.name
                        }
                      </div>

                      <div className="checkout-cart-item__meta">
                        Размер{" "}
                        {
                          i.size
                        }{" "}
                        ·{" "}
                        {formatPrice(
                          i.price,
                        )}
                      </div>

                      <div className="checkout-cart-item__bottom">
                        <div className="checkout-qty">
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(
                                i.productId,
                                i.size,
                                i.quantity -
                                  1,
                              )
                            }
                          >
                            −
                          </button>

                          <span>
                            {
                              i.quantity
                            }
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(
                                i.productId,
                                i.size,
                                i.quantity +
                                  1,
                              )
                            }
                          >
                            +
                          </button>
                        </div>

                        <button
                          className="checkout-text-btn"
                          type="button"
                          onClick={() =>
                            remove(
                              i.productId,
                              i.size,
                            )
                          }
                        >
                          УДАЛИТЬ
                        </button>
                      </div>
                    </div>

                    <div className="checkout-cart-item__price">
                      {formatPrice(
                        i.price *
                          i.quantity,
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>

            <div className="checkout-cart-total">
              <span>
                ИТОГО
              </span>

              <span>
                {formatPrice(
                  total,
                )}
              </span>
            </div>

            <button
              className="checkout-submit-btn"
              type="button"
              onClick={() =>
                setStep(
                  "checkout",
                )
              }
            >
              ПЕРЕЙТИ К
              ОФОРМЛЕНИЮ
            </button>
          </div>
        ) : (
          <div className="checkout-layout">
            <div className="checkout-left">
              <div className="checkout-block">
                <div className="checkout-section-title">
                  КОНТАКТНАЯ
                  ИНФОРМАЦИЯ
                </div>

                <label className="checkout-label">
                  ИМЯ
                  <input
                    className="checkout-input"
                    placeholder="ВАШЕ ИМЯ"
                    value={
                      name
                    }
                    autoComplete="name"
                    onChange={(
                      e,
                    ) =>
                      setName(
                        e.target
                          .value,
                      )
                    }
                  />
                </label>

                <label className="checkout-label">
                  EMAIL
                  <input
                    className="checkout-input"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="example@mail.com"
                    value={
                      email
                    }
                    onChange={(
                      e,
                    ) =>
                      setEmail(
                        e.target
                          .value,
                      )
                    }
                  />
                </label>

                <label className="checkout-label">
                  ТЕЛЕФОН
                  <input
                    className="checkout-input"
                    placeholder="+7XXXXXXXXXX"
                    inputMode="tel"
                    autoComplete="tel"
                    value={
                      phone
                    }
                    onChange={(
                      e,
                    ) =>
                      setPhone(
                        normalizeRussianPhone(
                          e
                            .target
                            .value,
                        ),
                      )
                    }
                  />
                </label>
              </div>

              <div className="checkout-block">
                <div className="checkout-section-title">
                  ПОЛУЧЕНИЕ
                </div>

                <div className="checkout-delivery-switch">
                  <button
                    type="button"
                    className={
                      deliveryMethod ===
                      DELIVERY
                        ? "checkout-switch-btn checkout-switch-btn--active"
                        : "checkout-switch-btn"
                    }
                    onClick={() =>
                      setDeliveryMethod(
                        DELIVERY,
                      )
                    }
                  >
                    ДОСТАВКА
                  </button>

                  <button
                    type="button"
                    className={
                      deliveryMethod ===
                      PICKUP
                        ? "checkout-switch-btn checkout-switch-btn--active"
                        : "checkout-switch-btn"
                    }
                    onClick={() =>
                      setDeliveryMethod(
                        PICKUP,
                      )
                    }
                  >
                    САМОВЫВОЗ
                  </button>
                </div>

                {isDelivery && (
                  <label className="checkout-label">
                    АДРЕС
                    <input
                      className="checkout-input"
                      placeholder="ВВЕДИТЕ АДРЕС"
                      autoComplete="street-address"
                      value={
                        address
                      }
                      onChange={(
                        e,
                      ) =>
                        setAddress(
                          e
                            .target
                            .value,
                        )
                      }
                    />
                  </label>
                )}

                <label className="checkout-label">
                  КОММЕНТАРИЙ
                  <textarea
                    className="checkout-input checkout-input--textarea"
                    placeholder="НЕОБЯЗАТЕЛЬНО"
                    value={
                      comment
                    }
                    onChange={(
                      e,
                    ) =>
                      setComment(
                        e.target
                          .value,
                      )
                    }
                  />
                </label>
              </div>
            </div>

            <div className="checkout-right">
              <div className="checkout-section-title">
                ИТОГ ЗАКАЗА
              </div>

              <div className="checkout-summary-list">
                {items.map(
                  (i) => (
                    <div
                      className="checkout-summary-item"
                      key={`${i.productId}-${i.size}`}
                    >
                      <div className="checkout-summary-item__main">
                        <div className="checkout-summary-item__name">
                          {
                            i.name
                          }
                        </div>

                        <div className="checkout-summary-item__meta">
                          Размер{" "}
                          {
                            i.size
                          }{" "}
                          ·{" "}
                          {
                            i.quantity
                          }{" "}
                          шт.
                        </div>
                      </div>

                      <div className="checkout-summary-item__price">
                        {formatPrice(
                          i.price *
                            i.quantity,
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>

              <div className="checkout-totals">
                <div className="checkout-totals__row">
                  <span>
                    SUBTOTAL
                  </span>

                  <span>
                    {formatPrice(
                      subtotal,
                    )}
                  </span>
                </div>

                <div className="checkout-totals__row">
                  <span>
                    TAXES
                  </span>

                  <span>
                    0 ₽
                  </span>
                </div>

                <div className="checkout-totals__row checkout-totals__row--total">
                  <span>
                    TOTAL
                  </span>

                  <span>
                    {formatPrice(
                      total,
                    )}
                  </span>
                </div>
              </div>

              {error && (
                <div className="checkout-error">
                  {error}
                </div>
              )}

              <button
                className="checkout-submit-btn"
                type="button"
                onClick={
                  submit
                }
                disabled={
                  submitting ||
                  !canSubmit
                }
              >
                {submitting
                  ? "ОТПРАВЛЯЕМ..."
                  : "ПОДТВЕРДИТЬ ЗАКАЗ"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
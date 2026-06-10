import { useEffect, useState } from "react";
import { useCart } from "../cart";
import { formatPrice } from "../utils";
import { createOrder, getApiErrorMessage } from "../api";
import { getUserName, tg } from "../telegram";

type Step = "cart" | "checkout" | "done";
const DELIVERY = "Доставка";

function phoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function CartDrawer({ onClose }: { onClose: () => void }) {
  const { items, total, setQuantity, remove, clear } = useCart();
  const [step, setStep] = useState<Step>("cart");
  const [name, setName] = useState(getUserName() ?? "");
  const [phone, setPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState(DELIVERY);
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDelivery = deliveryMethod === DELIVERY;
  const isPhoneValid = phoneDigits(phone).length >= 10;
  const isAddressValid = !isDelivery || address.trim().length >= 6;
  const canSubmit = name.trim().length >= 2 && isPhoneValid && isAddressValid;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  async function submit() {
    if (!canSubmit) {
      setError(
        !isPhoneValid
          ? "Введите телефон полностью, чтобы мы могли подтвердить заказ."
          : "Для доставки нужен адрес.",
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createOrder({
        name: name || undefined,
        phone: phone || undefined,
        deliveryMethod,
        address: address || undefined,
        comment: comment || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          size: i.size,
        })),
      });
      clear();
      setStep("done");
      try {
        tg.HapticFeedback?.notificationOccurred?.("success");
      } catch {
        // not in Telegram
      }
    } catch (orderError) {
      setError(getApiErrorMessage(orderError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="sheet drawer">
        <div className="drawer__header">
          <span className="drawer__title">
            {step === "checkout" ? "Оформление" : step === "done" ? "Готово" : "Корзина"}
          </span>
          <button className="cart-btn" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>

        {step === "done" ? (
          <div className="success">
            <div className="success__icon">✓</div>
            <h3 style={{ margin: 0, fontWeight: 700, letterSpacing: "-0.02em" }}>
              Заказ оформлен
            </h3>
            <p style={{ margin: 0, color: "var(--text-secondary)" }}>
              Заявка отправлена. Мы напишем для подтверждения заказа и оплаты.
            </p>
            <button className="btn" onClick={onClose} style={{ marginTop: 8 }}>
              Продолжить покупки
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="state">Корзина пуста</div>
        ) : (
          <>
            <div className="drawer__items">
              {items.map((i) => (
                <div className="line" key={`${i.productId}-${i.size}`}>
                  <div className="line__media">
                    {i.image && <img src={i.image} alt={i.name} />}
                  </div>
                  <div className="line__body">
                    <span className="line__name">{i.name}</span>
                    <span className="line__meta">
                      Размер {i.size} · {formatPrice(i.price)}
                    </span>
                    <div className="line__row">
                      <div className="stepper">
                        <button
                          onClick={() =>
                            setQuantity(i.productId, i.size, i.quantity - 1)
                          }
                          aria-label="Меньше"
                        >
                          −
                        </button>
                        <span>{i.quantity}</span>
                        <button
                          onClick={() =>
                            setQuantity(i.productId, i.size, i.quantity + 1)
                          }
                          aria-label="Больше"
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="link-remove"
                        onClick={() => remove(i.productId, i.size)}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="drawer__footer">
              {step === "checkout" && (
                <>
                  <input
                    className="field"
                    placeholder="Ваше имя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <input
                    className="field"
                    placeholder="Телефон для связи"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <select
                    className="field"
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                  >
                    <option value={DELIVERY}>Доставка</option>
                    <option value="Самовывоз">Самовывоз</option>
                  </select>
                  {isDelivery && (
                    <input
                      className="field"
                      placeholder="Адрес доставки"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  )}
                  <input
                    className="field"
                    placeholder="Комментарий к заказу (необязательно)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </>
              )}
              <div className="summary-row">
                <span>Итого</span>
                <span>{formatPrice(total)}</span>
              </div>
              {error && (
                <span style={{ color: "#ff3b30", fontSize: 13 }}>{error}</span>
              )}
              {step === "cart" ? (
                <button className="btn" onClick={() => setStep("checkout")}>
                  Оформить заказ
                </button>
              ) : (
                <>
                  <button className="btn btn--ghost" onClick={() => setStep("cart")}>
                    Назад к корзине
                  </button>
                  <button className="btn" onClick={submit} disabled={submitting || !canSubmit}>
                    {submitting ? "Отправляем..." : "Подтвердить заказ"}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

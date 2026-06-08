import { useCart } from "../features/cart/cart.store";

export default function CartPage() {
  const { items, remove, clear } = useCart();

  const total = items.reduce((sum, i) => sum + i.price, 0);

  return (
    <div style={{ padding: 12 }}>
      <h2>Корзина</h2>

      {items.map((i) => (
        <div key={i.id} className="cart-item">
          <img src={i.image} width={50} />
          <div>{i.name}</div>
          <div>{i.price} ₽</div>

          <button onClick={() => remove(i.id)}>X</button>
        </div>
      ))}

      <hr />

      <h3>Итого: {total} ₽</h3>

      <button onClick={clear}>Очистить</button>
    </div>
  );
}
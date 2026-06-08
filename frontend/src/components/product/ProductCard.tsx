import { useCart } from "../../features/cart/cart.store";

export default function ProductCard({ product }: any) {
  const add = useCart((s) => s.add);

  return (
    <div className="card">
      <img src={product.images?.[0]?.url} />

      <div className="card-body">
        <div className="title">{product.name}</div>
        <div className="price">{product.price} ₽</div>

        <button
          className="btn"
          onClick={() =>
            add({
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.images?.[0]?.url,
            })
          }
        >
          В корзину
        </button>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { useCart } from "./CartContext";
import { storeApi } from "../../api/client";
import { navigate } from "../../lib/router";
import { ShoppingCart, X, Plus, Minus, ArrowRight, Truck, ShieldCheck, RotateCcw } from "lucide-react";

const fmt = (n) => `${Number(n).toLocaleString("ar-EG")} ج`;

export default function ProductDetail({ slug }) {
  const cart = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    storeApi.product(slug)
      .then((r) => {
        setProduct(r.product);
        setActiveImg(0);
        if (r.product.categoryId) {
          storeApi.products(`?category=${r.product.categoryId}&limit=4`).then((res) => {
            setRelated((res.products || []).filter((p) => p.id !== r.product.id).slice(0, 4));
          }).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (added) {
      const t = setTimeout(() => setAdded(false), 1800);
      return () => clearTimeout(t);
    }
  }, [added]);

  if (loading) {
    return (
      <div className="st-page">
        <StoreBar cart={cart} onCart={() => setDrawerOpen(true)} />
        <div className="st-detail-loading">جاري التحميل...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="st-page">
        <StoreBar cart={cart} onCart={() => setDrawerOpen(true)} />
        <div className="st-noresults">المنتج غير موجود.</div>
      </div>
    );
  }

  const images = product.images.length ? product.images.map((i) => i.url) : [null];
  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : null;
  const out = product.status === "out_of_stock" || product.stockQuantity <= 0;

  return (
    <div className="st-page">
      <StoreBar cart={cart} onCart={() => setDrawerOpen(true)} />
      <button className="st-back" onClick={() => navigate("/store")}>
        <ArrowRight size={16} /> العودة للمتجر
      </button>

      <div className="st-detail">
        <div className="st-detail__gallery">
          <div className="st-detail__main">
            {images[activeImg] ? <img src={images[activeImg]} alt={product.name} /> : <div className="st-card__ph" style={{ height: "100%" }}>🛍️</div>}
            {discount && <span className="st-badge st-badge--sale">-{discount}%</span>}
          </div>
          {images.length > 1 && (
            <div className="st-thumbs">
              {images.map((img, i) => (
                <button key={i} className={`st-thumb ${i === activeImg ? "is-active" : ""}`} onClick={() => setActiveImg(i)}>
                  {img ? <img src={img} alt="" /> : <span>🛍️</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="st-detail__info">
          {product.categoryName && <div className="st-card__cat">{product.categoryName}</div>}
          <h1 className="st-detail__name">{product.name}</h1>
          <div className="st-price st-price--lg">
            <span className="st-price__now">{fmt(product.price)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="st-price__was">{fmt(product.compareAtPrice)}</span>
            )}
          </div>

          {product.description && <p className="st-detail__desc">{product.description}</p>}

          <div className="st-detail__meta">
            <span><Truck size={15} /> شحن لجميع المحافظات</span>
            <span><ShieldCheck size={15} /> دفع آمن عند الاستلام/أونلاين</span>
            {product.weightGrams ? <span><RotateCcw size={15} /> الوزن: {product.weightGrams} جم</span> : null}
          </div>

          <div className="st-detail__buy">
            <div className="st-stepper st-stepper--lg">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus size={16} /></button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)}><Plus size={16} /></button>
            </div>
            <button
              className="st-btn st-btn--primary st-btn--block"
              disabled={out}
              onClick={() => { cart.add(product, qty); setAdded(true); }}
            >
              <ShoppingCart size={18} /> {out ? "نفذت الكمية" : added ? "✅ أُضيف للسلة" : "أضف إلى السلة"}
            </button>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="st-related">
          <h2 className="st-related__title">منتجات ذات صلة</h2>
          <div className="st-grid">
            {related.map((p) => (
              <div key={p.id} className="st-card" onClick={() => navigate(`/store/${p.slug}`)}>
                <div className="st-card__media">
                  {p.primaryImage ? <img src={p.primaryImage} alt={p.name} /> : <div className="st-card__ph">🛍️</div>}
                </div>
                <div className="st-card__body">
                  <h3 className="st-card__name">{p.name}</h3>
                  <div className="st-card__foot">
                    <span className="st-price__now">{fmt(p.price)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <CartDrawerMini open={drawerOpen} onClose={() => setDrawerOpen(false)} cart={cart} />
    </div>
  );
}

function StoreBar({ cart, onCart }) {
  return (
    <header className="st-header">
      <div className="st-header__inner">
        <button className="st-logo" onClick={() => navigate("/")}>
          <img src="/assets/logo.png" alt="د. كريم الليثي" />
        </button>
        <div style={{ flex: 1 }} />
        <button className="st-cart-btn" onClick={onCart}>
          <ShoppingCart size={20} />
          {cart.count > 0 && <span className="st-cart-count">{cart.count}</span>}
        </button>
      </div>
    </header>
  );
}

function CartDrawerMini({ open, onClose, cart }) {
  return (
    <>
      <div className={`st-overlay ${open ? "is-open" : ""}`} onClick={onClose} />
      <aside className={`st-drawer ${open ? "is-open" : ""}`}>
        <div className="st-drawer__head">
          <h3>🛒 سلة التسوق</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="st-drawer__body">
          {cart.items.length === 0 ? (
            <div className="st-empty">
              <div className="st-empty__icon">🛒</div>
              <p>سلتك فارغة</p>
            </div>
          ) : cart.items.map((i) => (
            <div key={i.productId} className="st-line">
              <div className="st-line__img">{i.image ? <img src={i.image} alt={i.name} /> : <div className="st-card__ph">🛍️</div>}</div>
              <div className="st-line__info">
                <div className="st-line__name">{i.name}</div>
                <div className="st-line__price">{fmt(i.price)} × {i.quantity}</div>
              </div>
              <button className="st-line__del" onClick={() => cart.remove(i.productId)}><X size={16} /></button>
            </div>
          ))}
        </div>
        {cart.items.length > 0 && (
          <div className="st-drawer__foot">
            <div className="st-total"><span>الإجمالي</span><strong>{fmt(cart.total)}</strong></div>
            <button className="st-btn st-btn--primary" onClick={() => { onClose(); navigate("/checkout"); }}>إتمام الشراء</button>
          </div>
        )}
      </aside>
    </>
  );
}

import { useEffect, useState } from "react";
import { storeApi } from "../api/client";
import { navigate } from "../lib/router";
import { ShoppingBag, ArrowLeft, Sparkles } from "lucide-react";

const fmt = (n) => `${Number(n).toLocaleString("ar-EG")} ج`;

function StoreCard({ product }) {
  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : null;
  const out = product.status === "out_of_stock" || product.stockQuantity <= 0;
  return (
    <div className="st-card st-card--home" onClick={() => navigate(`/store/${product.slug}`)}>
      <div className="st-card__media">
        {product.primaryImage ? (
          <img src={product.primaryImage} alt={product.name} loading="lazy" />
        ) : (
          <div className="st-card__ph">🛍️</div>
        )}
        {discount && <span className="st-badge st-badge--sale">-{discount}%</span>}
        {product.featured && !discount && <span className="st-badge st-badge--hot">⭐ مميز</span>}
        {out && <span className="st-badge st-badge--out">نفذت</span>}
      </div>
      <div className="st-card__body">
        {product.categoryName && <div className="st-card__cat">{product.categoryName}</div>}
        <h3 className="st-card__name">{product.name}</h3>
        <div className="st-card__foot">
          <div className="st-price">
            <span className="st-price__now">{fmt(product.price)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="st-price__was">{fmt(product.compareAtPrice)}</span>
            )}
          </div>
          <span className="st-card__buy">اشتري الآن <ArrowLeft size={14} /></span>
        </div>
      </div>
    </div>
  );
}

export default function StoreSection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        let res = await storeApi.products("?featured=1&limit=8");
        if (!res.products || res.products.length === 0) {
          res = await storeApi.products("?limit=8");
        }
        if (active) setProducts(res.products || []);
      } catch {
        if (active) setProducts([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  if (loading || products.length === 0) return null;

  return (
    <section className="st-home">
      <div className="st-home__head">
        <div className="st-home__title">
          <span className="st-home__icon"><ShoppingBag size={22} /></span>
          <div>
            <div className="st-home__eyebrow"><Sparkles size={14} /> متجر د. كريم الليثي</div>
            <h2>منتجات التخسيس والأدوات الصحية</h2>
          </div>
        </div>
        <button className="st-home__all" onClick={() => navigate("/store")}>
          عرض كل المنتجات <ArrowLeft size={16} />
        </button>
      </div>
      <div className="st-grid st-grid--home">
        {products.map((p) => (
          <StoreCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

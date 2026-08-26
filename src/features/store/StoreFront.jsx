import { useEffect, useState, useCallback, useRef } from "react";
import { useCart } from "./CartContext";
import { storeApi } from "../../api/client";
import { navigate } from "../../lib/router";
import { ShoppingCart, Search, X, Plus, Minus, Trash2, Sparkles, Truck, ShieldCheck } from "lucide-react";

const fmt = (n) => `${Number(n).toLocaleString("ar-EG")} ج`;

function ProductCard({ product, onOpen, onAdd }) {
  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : null;
  const out = product.status === "out_of_stock" || product.stockQuantity <= 0;
  return (
    <div className="st-card" onClick={() => onOpen(product.slug)}>
      <div className="st-card__media">
        {product.primaryImage ? (
          <img src={product.primaryImage} alt={product.name} loading="lazy" />
        ) : (
          <div className="st-card__ph">🛍️</div>
        )}
        {discount && <span className="st-badge st-badge--sale">-{discount}%</span>}
        {product.featured && <span className="st-badge st-badge--hot">⭐ مميز</span>}
        {out && <span className="st-badge st-badge--out">نفذت</span>}
      </div>
      <div className="st-card__body">
        {product.categoryName && <div className="st-card__cat">{product.categoryName}</div>}
        <h3 className="st-card__name">{product.name}</h3>
        {product.shortDescription && <p className="st-card__desc">{product.shortDescription}</p>}
        <div className="st-card__foot">
          <div className="st-price">
            <span className="st-price__now">{fmt(product.price)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="st-price__was">{fmt(product.compareAtPrice)}</span>
            )}
          </div>
          <button
            className="st-add"
            disabled={out}
            onClick={(e) => { e.stopPropagation(); onAdd(product); }}
            title={out ? "نفذت الكمية" : "أضف إلى السلة"}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({ open, onClose }) {
  const cart = useCart();
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
              <button className="st-btn" onClick={onClose}>تصفح المنتجات</button>
            </div>
          ) : (
            cart.items.map((i) => (
              <div key={i.productId} className="st-line">
                <div className="st-line__img">
                  {i.image ? <img src={i.image} alt={i.name} /> : <div className="st-card__ph">🛍️</div>}
                </div>
                <div className="st-line__info">
                  <div className="st-line__name">{i.name}</div>
                  <div className="st-line__price">{fmt(i.price)}</div>
                  <div className="st-stepper">
                    <button onClick={() => cart.setQty(i.productId, i.quantity - 1)}><Minus size={14} /></button>
                    <span>{i.quantity}</span>
                    <button onClick={() => cart.setQty(i.productId, i.quantity + 1)}><Plus size={14} /></button>
                  </div>
                </div>
                <button className="st-line__del" onClick={() => cart.remove(i.productId)}><Trash2 size={16} /></button>
              </div>
            ))
          )}
        </div>
        {cart.items.length > 0 && (
          <div className="st-drawer__foot">
            <div className="st-total">
              <span>الإجمالي</span>
              <strong>{fmt(cart.total)}</strong>
            </div>
            <button className="st-btn st-btn--primary" onClick={() => { onClose(); navigate("/checkout"); }}>
              إتمام الشراء
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

export default function StoreFront() {
  const cart = useCart();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCats, setSelectedCats] = useState([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [inStock, setInStock] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sort, setSort] = useState("popular");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState(false);
  const searchRef = useRef();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (search.trim()) qs.set("search", search.trim());
      if (selectedCats.length) qs.set("category", selectedCats.join(","));
      if (priceMin) qs.set("priceMin", priceMin);
      if (priceMax) qs.set("priceMax", priceMax);
      if (inStock) qs.set("inStock", "1");
      if (featuredOnly) qs.set("featured", "1");
      qs.set("sort", sort);
      const res = await storeApi.products("?" + qs.toString());
      setProducts(res.products || []);
      setTotal(res.total || 0);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [search, selectedCats, priceMin, priceMax, inStock, featuredOnly, sort]);

  useEffect(() => {
    storeApi.categories().then((r) => setCategories(r.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(loadProducts, 250);
    return () => clearTimeout(t);
  }, [loadProducts]);

  const toggleCat = (id) =>
    setSelectedCats((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  const clearFilters = () => {
    setSelectedCats([]);
    setPriceMin("");
    setPriceMax("");
    setInStock(false);
    setFeaturedOnly(false);
    setSearch("");
    setSort("popular");
  };
  const activeFilterCount =
    selectedCats.length + (priceMin ? 1 : 0) + (priceMax ? 1 : 0) + (inStock ? 1 : 0) + (featuredOnly ? 1 : 0);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(false), 1800);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const addToCart = (product) => {
    cart.add(product, 1);
    setToast(true);
  };

  return (
    <div className="st-page">
      <header className="st-header">
        <div className="st-header__inner">
          <div className="st-search">
            <Search size={18} />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن منتجات التخسيس والفيتامينات..."
            />
          </div>
          <button className="st-cart-btn" onClick={() => setDrawerOpen(true)}>
            <ShoppingCart size={20} />
            {cart.count > 0 && <span className="st-cart-count">{cart.count}</span>}
          </button>
        </div>
      </header>

      <section className="st-hero">
        <div className="st-hero__content">
          <span className="st-hero__eyebrow"><Sparkles size={16} /> متجر د. كريم الليثي</span>
          <h1 className="st-hero__title">منتجات التخسيس والصحة<br />بجودة تليق بك</h1>
          <p className="st-hero__sub">مكملات، فيتامينات، وأدوات صحية مختارة بعناية لتدعم رحلتك نحو وزن مثالي وحياة أفضل.</p>
          <div className="st-hero__perks">
            <span><Truck size={16} /> شحن سريع</span>
            <span><ShieldCheck size={16} /> دفع آمن</span>
            <span><Sparkles size={16} /> أفضل الأسعار</span>
          </div>
        </div>
      </section>

      <div className="st-layout">
        <aside className="st-side">
          <div className="st-side__head">
            <div className="st-side__title">تصفية متقدمة</div>
            {activeFilterCount > 0 && (
              <button className="st-clear" onClick={clearFilters}>مسح ({activeFilterCount})</button>
            )}
          </div>

          <label className="st-check">
            <input type="checkbox" checked={featuredOnly} onChange={(e) => setFeaturedOnly(e.target.checked)} />
            <span>⭐ المميز فقط</span>
          </label>
          <label className="st-check">
            <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />
            <span>✅ المتوفر فقط</span>
          </label>

          <div className="st-side__title" style={{ marginTop: 18 }}>نطاق السعر (ج)</div>
          <div className="st-price-range">
            <input className="st-input" type="number" min="0" inputMode="numeric" placeholder="من" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
            <span className="st-price__sep">—</span>
            <input className="st-input" type="number" min="0" inputMode="numeric" placeholder="إلى" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
          </div>

          <div className="st-side__title" style={{ marginTop: 18 }}>التصنيفات</div>
          <label className="st-check">
            <input type="checkbox" checked={selectedCats.length === 0} onChange={() => setSelectedCats([])} />
            <span>كل المنتجات</span>
          </label>
          {categories.map((c) => (
            <label key={c.id} className="st-check">
              <input type="checkbox" checked={selectedCats.includes(c.id)} onChange={() => toggleCat(c.id)} />
              <span>{c.name}</span>
            </label>
          ))}

          <div className="st-side__title" style={{ marginTop: 18 }}>ترتيب حسب</div>
          <select className="st-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="popular">الأكثر تميزاً</option>
            <option value="newest">الأحدث</option>
            <option value="price_asc">السعر: من الأقل</option>
            <option value="price_desc">السعر: من الأعلى</option>
          </select>
        </aside>

        <main className="st-main">
          {loading ? (
            <div className="st-grid">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="st-skel" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="st-noresults">لا توجد منتجات مطابقة لبحثك.</div>
          ) : (
            <>
              <div className="st-count">{total} منتج</div>
              <div className="st-grid">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} onOpen={(slug) => navigate(`/store/${slug}`)} onAdd={addToCart} />
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {toast && (
        <div className="st-toast">✅ تمت الإضافة إلى السلة</div>
      )}
    </div>
  );
}

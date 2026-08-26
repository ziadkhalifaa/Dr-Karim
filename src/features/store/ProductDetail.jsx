import { useEffect, useState } from "react";
import { useCart } from "./CartContext";
import { storeApi } from "../../api/client";
import { navigate } from "../../lib/router";
import { useAuth } from "../../context/AuthProvider";
import { ShoppingCart, X, Plus, Minus, ArrowRight, Truck, ShieldCheck, RotateCcw, Star, ImagePlus } from "lucide-react";

const fmt = (n) => `${Number(n).toLocaleString("ar-EG")} ج`;

export default function ProductDetail({ slug }) {
  const cart = useCart();
  const { authenticated, user } = useAuth();
  const isPatient = authenticated && user?.role === "patient";
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [reviewMsg, setReviewMsg] = useState("");
  const [reviewSending, setReviewSending] = useState(false);
  const [myFiles, setMyFiles] = useState([]);
  const [myFilePreviews, setMyFilePreviews] = useState([]);
  const [lightbox, setLightbox] = useState(null);

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
    storeApi.reviews(slug).then((r) => setReviews(r.reviews || [])).catch(() => {});
  }, [slug]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!myRating) { setReviewMsg("من فضلك اختر تقييماً بالنجوم"); return; }
    setReviewSending(true);
    setReviewMsg("");
    try {
      const payload = { rating: myRating, comment: myComment };
      if (myFiles.length) {
        const up = await storeApi.uploadReviewImages(myFiles);
        payload.images = up.urls;
      }
      const r = await storeApi.addReview(slug, payload);
      setReviews((prev) => [r.review, ...prev]);
      setMyRating(0);
      setMyComment("");
      setMyFiles([]);
      setMyFilePreviews([]);
      setReviewMsg("✅ شكراً لتقييمك");
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err?.message || "تعذّر إرسال التقييم";
      setReviewMsg(msg);
    } finally {
      setReviewSending(false);
    }
  };

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
          {product.reviewCount > 0 && (
            <div className="st-rate-summary">
              <span className="st-card__stars">{"★".repeat(Math.round(product.avgRating))}{"☆".repeat(5 - Math.round(product.avgRating))}</span>
              <strong>{Number(product.avgRating).toFixed(1)}</strong>
              <span className="st-rate-summary__count">({product.reviewCount} تقييم)</span>
            </div>
          )}
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

      <section className="st-reviews">
        <h2 className="st-reviews__title">تقييمات المشترين</h2>
        {reviews.length === 0 ? (
          <p className="st-reviews__empty">لا توجد تقييمات بعد. كن أول من يقيم هذا المنتج بعد الشراء.</p>
        ) : (
          <div className="st-reviews__list">
            {reviews.map((rv) => (
              <div key={rv.id} className="st-review">
                <div className="st-review__head">
                  <span className="st-card__stars">{"★".repeat(rv.rating)}{"☆".repeat(5 - rv.rating)}</span>
                  <strong>{rv.authorName}</strong>
                  <span className="st-verified" title="تقييم من مشتري موثّق">✓ شراء موثّق</span>
                </div>
                {rv.comment && <p className="st-review__body">{rv.comment}</p>}
                {rv.images?.length > 0 && (
                  <div className="st-review__imgs">
                    {rv.images.map((img, i) => (
                      <button key={i} type="button" className="st-review__img" onClick={() => setLightbox(img.url)}>
                        <img src={img.url} alt="" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
                {rv.doctorReply && (
                  <div className="st-review__reply">
                    <span className="st-review__reply-by">رد الدكتور</span>
                    <p>{rv.doctorReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {isPatient ? (
          <form className="st-review-form" onSubmit={submitReview}>
            <div className="st-review-form__title">قيّم هذا المنتج (للمشترين فقط)</div>
            <div className="st-review-stars">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} className={n <= myRating ? "is-on" : ""} onClick={() => setMyRating(n)} aria-label={`${n} نجوم`}>
                  <Star size={22} fill={n <= myRating ? "#f5a623" : "none"} />
                </button>
              ))}
            </div>
            <textarea
              className="st-input"
              rows={3}
              placeholder="اكتب تجربتك مع المنتج (اختياري)"
              value={myComment}
              onChange={(e) => setMyComment(e.target.value)}
            />
            <label className="st-review-upload">
              <ImagePlus size={16} /> إرفاق صور (حتى 6)
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setMyFiles(files.slice(0, 6));
                  setMyFilePreviews(files.slice(0, 6).map((f) => URL.createObjectURL(f)));
                }}
              />
            </label>
            {myFilePreviews.length > 0 && (
              <div className="st-review__imgs">
                {myFilePreviews.map((src, i) => (
                  <div key={i} className="st-review__img">
                    <img src={src} alt="" />
                    <button type="button" className="st-review__img-x" onClick={() => {
                      setMyFiles((prev) => prev.filter((_, j) => j !== i));
                      setMyFilePreviews((prev) => prev.filter((_, j) => j !== i));
                    }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <div className="st-review-form__foot">
              <button type="submit" className="st-btn st-btn--primary" disabled={reviewSending || uploading}>
                {reviewSending || uploading ? "جاري الإرسال..." : "إرسال التقييم"}
              </button>
              {reviewMsg && <span className="st-review-form__msg">{reviewMsg}</span>}
            </div>
          </form>
        ) : (
          <p className="st-reviews__note">سجّل الدخول كمريض لتتمكن من تقييم المنتجات التي اشتريتها.</p>
        )}
      </section>

      {lightbox && (
        <div className="st-lightbox" onClick={() => setLightbox(null)}>
          <button className="st-lightbox__close" onClick={() => setLightbox(null)}>×</button>
          <img src={lightbox} alt="" />
        </div>
      )}

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

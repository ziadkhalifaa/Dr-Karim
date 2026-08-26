import { Op } from "sequelize";
import { sequelize } from "../config/database.js";
import {
  Product,
  ProductCategory,
  StoreOrder,
  StoreOrderItem,
  StorePayment,
} from "../models/index.js";
import { AppError } from "../utils/errors.js";

function slugify(input, fallback = "") {
  const s = String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return s || fallback;
}

function num(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

/* ============================ CATEGORIES ============================ */
export async function listCategories(tenantId, { onlyActive = false } = {}) {
  const where = { tenant_id: tenantId };
  if (onlyActive) where.active = true;
  const rows = await ProductCategory.findAll({ where, order: [["sort_order", "ASC"], ["id", "ASC"]] });
  return rows.map((c) => ({
    id: String(c.id),
    name: c.name,
    nameEn: c.name_en || null,
    slug: c.slug,
    description: c.description || "",
    sortOrder: c.sort_order,
    active: c.active,
    productCount: 0,
  }));
}

export async function createCategory(tenantId, data) {
  const name = (data.name || "").trim();
  if (!name) throw new AppError(422, "VALIDATION_ERROR", "اسم التصنيف مطلوب");
  const slug = slugify(data.slug || name, `cat-${Date.now()}`);
  const cat = await ProductCategory.create({
    tenant_id: tenantId,
    name,
    name_en: data.nameEn || data.name_en || null,
    slug,
    description: data.description || null,
    sort_order: num(data.sortOrder ?? data.sort_order, 0),
    active: data.active !== false,
  });
  return serializeCategory(cat);
}

export async function updateCategory(tenantId, id, data) {
  const cat = await ProductCategory.findOne({ where: { id, tenant_id: tenantId } });
  if (!cat) throw new AppError(404, "NOT_FOUND", "التصنيف غير موجود");
  if (data.name !== undefined) cat.name = data.name.trim();
  if (data.nameEn !== undefined || data.name_en !== undefined) cat.name_en = data.nameEn ?? data.name_en ?? null;
  if (data.slug !== undefined && data.slug.trim()) cat.slug = slugify(data.slug);
  if (data.description !== undefined) cat.description = data.description;
  if (data.sortOrder !== undefined || data.sort_order !== undefined) cat.sort_order = num(data.sortOrder ?? data.sort_order, cat.sort_order);
  if (data.active !== undefined) cat.active = Boolean(data.active);
  await cat.save();
  return serializeCategory(cat);
}

export async function deleteCategory(tenantId, id) {
  const cat = await ProductCategory.findOne({ where: { id, tenant_id: tenantId } });
  if (!cat) throw new AppError(404, "NOT_FOUND", "التصنيف غير موجود");
  const used = await Product.count({ where: { tenant_id: tenantId, category_id: id } });
  if (used > 0) throw new AppError(409, "CATEGORY_IN_USE", "لا يمكن حذف تصنيف عليه منتجات");
  await cat.destroy();
  return { deleted: true };
}

/* ============================ PRODUCTS ============================ */
function serializeProduct(p, categoryName = null) {
  const images = Array.isArray(p.images_json) ? p.images_json : [];
  return {
    id: String(p.id),
    categoryId: p.category_id ? String(p.category_id) : null,
    categoryName: categoryName || (p.category ? p.category.name : null),
    name: p.name,
    nameEn: p.name_en || null,
    slug: p.slug,
    description: p.description || "",
    shortDescription: p.short_description || "",
    price: num(p.price),
    compareAtPrice: p.compare_at_price != null ? num(p.compare_at_price) : null,
    currency: p.currency || "EGP",
    stockQuantity: num(p.stock_quantity),
    sku: p.sku || null,
    status: p.status,
    featured: Boolean(p.featured),
    images: images.map((i) => (typeof i === "string" ? { url: i } : i)),
    primaryImage: images[0]?.url || images[0] || null,
    weightGrams: p.weight_grams != null ? num(p.weight_grams) : null,
    sortOrder: num(p.sort_order),
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

export async function listProducts(tenantId, { status, search, categoryId, featured, sort, page = 1, limit = 24 } = {}) {
  const where = { tenant_id: tenantId };
  if (status) where.status = status;
  if (featured !== undefined) where.featured = featured;
  if (categoryId) where.category_id = categoryId;
  if (search) where[Op.or] = [
    { name: { [Op.like]: `%${search}%` } },
    { name_en: { [Op.like]: `%${search}%` } },
    { sku: { [Op.like]: `%${search}%` } },
  ];
  const orderMap = {
    price_asc: [["price", "ASC"]],
    price_desc: [["price", "DESC"]],
    newest: [["created_at", "DESC"]],
    popular: [["featured", "DESC"], ["sort_order", "ASC"]],
  };
  const order = orderMap[sort] || [["sort_order", "ASC"], ["id", "DESC"]];
  const offset = Math.max(0, (Number(page) - 1) * Number(limit));
  const { rows, count } = await Product.findAndCountAll({
    where,
    order,
    limit: Number(limit),
    offset,
    include: [{ model: ProductCategory, as: "category", attributes: ["name"], required: false }],
  });
  return {
    products: rows.map((p) => serializeProduct(p, p.category?.name || null)),
    total: count,
    page: Number(page),
    pages: Math.max(1, Math.ceil(count / Number(limit))),
  };
}

export async function listAllProducts(tenantId) {
  const rows = await Product.findAll({
    where: { tenant_id: tenantId },
    order: [["sort_order", "ASC"], ["id", "DESC"]],
    include: [{ model: ProductCategory, as: "category", attributes: ["name"], required: false }],
  });
  const products = rows.map((p) => serializeProduct(p, p.category?.name || null));
  // attach category product counts
  const counts = await Product.findAll({
    where: { tenant_id: tenantId },
    attributes: ["category_id", [sequelize.fn("COUNT", sequelize.col("id")), "cnt"]],
    group: ["category_id"],
    raw: true,
  });
  const byCat = Object.fromEntries(counts.map((c) => [String(c.category_id), Number(c.cnt)]));
  return { products, categoryCounts: byCat };
}

export async function getProductBySlug(tenantId, slug) {
  const p = await Product.findOne({
    where: { tenant_id: tenantId, slug },
    include: [{ model: ProductCategory, as: "category", attributes: ["name", "slug"], required: false }],
  });
  if (!p) throw new AppError(404, "NOT_FOUND", "المنتج غير موجود");
  return serializeProduct(p, p.category?.name || null);
}

export async function createProduct(tenantId, data) {
  const name = (data.name || "").trim();
  if (!name) throw new AppError(422, "VALIDATION_ERROR", "اسم المنتج مطلوب");
  const price = num(data.price);
  if (price <= 0) throw new AppError(422, "VALIDATION_ERROR", "السعر يجب أن يكون أكبر من صفر");
  const slug = slugify(data.slug || name, `prod-${Date.now()}`);
  const images = Array.isArray(data.images) ? data.images : [];
  const product = await Product.create({
    tenant_id: tenantId,
    category_id: data.categoryId ? Number(data.categoryId) : null,
    name,
    name_en: data.nameEn || data.name_en || null,
    slug,
    description: data.description || null,
    short_description: data.shortDescription || data.short_description || null,
    price,
    compare_at_price: data.compareAtPrice != null ? num(data.compareAtPrice) : null,
    currency: data.currency || "EGP",
    stock_quantity: num(data.stockQuantity ?? data.stock_quantity, 0),
    sku: data.sku || null,
    status: data.status || "active",
    featured: Boolean(data.featured),
    images_json: images,
    weight_grams: data.weightGrams != null ? num(data.weightGrams) : null,
    sort_order: num(data.sortOrder ?? data.sort_order, 0),
  });
  return serializeProduct(product);
}

export async function updateProduct(tenantId, id, data) {
  const p = await Product.findOne({ where: { id, tenant_id: tenantId } });
  if (!p) throw new AppError(404, "NOT_FOUND", "المنتج غير موجود");
  if (data.name !== undefined) p.name = data.name.trim();
  if (data.nameEn !== undefined || data.name_en !== undefined) p.name_en = data.nameEn ?? data.name_en ?? null;
  if (data.slug !== undefined && data.slug.trim()) p.slug = slugify(data.slug);
  if (data.description !== undefined) p.description = data.description;
  if (data.shortDescription !== undefined || data.short_description !== undefined) p.short_description = data.shortDescription ?? data.short_description ?? null;
  if (data.categoryId !== undefined) p.category_id = data.categoryId ? Number(data.categoryId) : null;
  if (data.price !== undefined) p.price = num(data.price);
  if (data.compareAtPrice !== undefined || data.compare_at_price !== undefined) p.compare_at_price = data.compareAtPrice ?? data.compare_at_price ?? null;
  if (data.currency !== undefined) p.currency = data.currency;
  if (data.stockQuantity !== undefined || data.stock_quantity !== undefined) p.stock_quantity = num(data.stockQuantity ?? data.stock_quantity, p.stock_quantity);
  if (data.sku !== undefined) p.sku = data.sku || null;
  if (data.status !== undefined) p.status = data.status;
  if (data.featured !== undefined) p.featured = Boolean(data.featured);
  if (data.images !== undefined) p.images_json = Array.isArray(data.images) ? data.images : [];
  if (data.weightGrams !== undefined || data.weight_grams !== undefined) p.weight_grams = data.weightGrams ?? data.weight_grams ?? null;
  if (data.sortOrder !== undefined || data.sort_order !== undefined) p.sort_order = num(data.sortOrder ?? data.sort_order, p.sort_order);
  await p.save();
  return serializeProduct(p);
}

export async function appendProductImage(tenantId, id, url) {
  const p = await Product.findOne({ where: { id, tenant_id: tenantId } });
  if (!p) throw new AppError(404, "NOT_FOUND", "المنتج غير موجود");
  const imgs = Array.isArray(p.images_json) ? p.images_json : [];
  imgs.push({ url });
  p.images_json = imgs;
  await p.save();
  return serializeProduct(p);
}

export async function deleteProduct(tenantId, id) {
  const p = await Product.findOne({ where: { id, tenant_id: tenantId } });
  if (!p) throw new AppError(404, "NOT_FOUND", "المنتج غير موجود");
  await p.destroy();
  return { deleted: true };
}

/* ============================ CHECKOUT / ORDERS ============================ */
function genOrderNumber() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${date}-${rand}`;
}

export async function createOrder(tenantId, payload) {
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (items.length === 0) throw new AppError(422, "VALIDATION_ERROR", "السلة فارغة");
  const customer = payload.customer || {};
  if (!customer.name || !customer.phone) throw new AppError(422, "VALIDATION_ERROR", "بيانات العميل مطلوبة (الاسم والهاتف)");
  const productIds = items.map((i) => Number(i.productId)).filter(Boolean);
  const products = await Product.findAll({ where: { tenant_id: tenantId, id: { [Op.in]: productIds }, status: "active" } });
  const byId = new Map(products.map((p) => [String(p.id), p]));
  const t = await sequelize.transaction();
  try {
    const orderItems = [];
    let subtotal = 0;
    for (const it of items) {
      const prod = byId.get(String(it.productId));
      if (!prod) throw new AppError(404, "PRODUCT_UNAVAILABLE", `المنتج ${it.productId} غير متوفر`);
      const qty = Math.max(1, Math.floor(Number(it.quantity) || 1));
      if (prod.stock_quantity !== null && prod.stock_quantity < qty)
        throw new AppError(409, "OUT_OF_STOCK", `المنتج ${prod.name} غير متوفر بالكمية المطلوبة`);
      const lineTotal = Number(prod.price) * qty;
      subtotal += lineTotal;
      orderItems.push({
        tenant_id: tenantId,
        product_id: prod.id,
        name_snapshot: prod.name,
        price_snapshot: prod.price,
        currency: prod.currency || "EGP",
        quantity: qty,
        line_total: lineTotal,
      });
      // decrement stock
      prod.stock_quantity = prod.stock_quantity - qty;
      if (prod.stock_quantity <= 0) prod.status = "out_of_stock";
      await prod.save({ transaction: t });
    }
    const order = await StoreOrder.create({
      tenant_id: tenantId,
      order_number: genOrderNumber(),
      patient_id: payload.patientId ? Number(payload.patientId) : null,
      customer_name: customer.name.trim(),
      customer_phone: customer.phone.trim(),
      customer_email: customer.email ? customer.email.trim() : null,
      city: customer.city || null,
      address: customer.address || null,
      notes: customer.notes || null,
      subtotal,
      currency: "EGP",
      status: "pending_payment",
    }, { transaction: t });
    await StoreOrderItem.bulkCreate(orderItems.map((i) => ({ ...i, order_id: order.id })), { transaction: t });
    await t.commit();
    return serializeOrder(order, orderItems);
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

function serializeOrder(order, items) {
  return {
    id: String(order.id),
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    customerEmail: order.customer_email,
    city: order.city,
    address: order.address,
    notes: order.notes,
    subtotal: num(order.subtotal),
    currency: order.currency,
    status: order.status,
    createdAt: order.created_at,
    items: (items || []).map((i) => ({
      id: String(i.id),
      name: i.name_snapshot,
      price: num(i.price_snapshot),
      quantity: i.quantity,
      lineTotal: num(i.line_total),
    })),
  };
}

export async function createPayment(tenantId, orderId, payload) {
  const order = await StoreOrder.findOne({ where: { id: orderId, tenant_id: tenantId } });
  if (!order) throw new AppError(404, "NOT_FOUND", "الطلب غير موجود");
  const method = payload.method;
  if (!["vodafone_cash", "instapay"].includes(method)) throw new AppError(422, "VALIDATION_ERROR", "طريقة الدفع غير صالحة");
  if (!payload.senderPhone || !String(payload.senderPhone).trim()) throw new AppError(422, "VALIDATION_ERROR", "رقم الهاتف المُرسِل مطلوب");
  const payment = await StorePayment.create({
    tenant_id: tenantId,
    order_id: order.id,
    amount: order.subtotal,
    currency: order.currency,
    method,
    sender_phone: String(payload.senderPhone).trim(),
    transaction_reference: payload.transactionReference || payload.transaction_reference || null,
    receipt_json: payload.receiptJson || payload.receipt_json || null,
    status: "pending",
  });
  return { id: String(payment.id), orderId: String(order.id), status: payment.status };
}

/* ============================ DOCTOR: ORDERS / PAYMENTS ============================ */
export async function listOrders(tenantId, { status, page = 1, limit = 30 } = {}) {
  const where = { tenant_id: tenantId };
  if (status) where.status = status;
  const offset = Math.max(0, (Number(page) - 1) * Number(limit));
  const { rows, count } = await StoreOrder.findAndCountAll({
    where,
    order: [["created_at", "DESC"]],
    limit: Number(limit),
    offset,
    include: [{ model: StoreOrderItem, as: "items" }],
  });
  return {
    orders: rows.map((o) => serializeOrder(o, o.items || [])),
    total: count,
    page: Number(page),
    pages: Math.max(1, Math.ceil(count / Number(limit))),
  };
}

export async function getOrder(tenantId, id) {
  const o = await StoreOrder.findOne({
    where: { id, tenant_id: tenantId },
    include: [{ model: StoreOrderItem, as: "items" }, { model: StorePayment, as: "payments" }],
  });
  if (!o) throw new AppError(404, "NOT_FOUND", "الطلب غير موجود");
  const base = serializeOrder(o, o.items || []);
  return { ...base, payments: (o.payments || []).map((p) => ({
    id: String(p.id),
    method: p.method,
    amount: num(p.amount),
    senderPhone: p.sender_phone,
    transactionReference: p.transaction_reference,
    status: p.status,
    createdAt: p.created_at,
  })) };
}

const VALID_ORDER_STATUS = ["pending_payment", "paid", "processing", "shipped", "delivered", "cancelled"];
export async function updateOrderStatus(tenantId, id, status) {
  if (!VALID_ORDER_STATUS.includes(status)) throw new AppError(422, "VALIDATION_ERROR", "حالة الطلب غير صالحة");
  const o = await StoreOrder.findOne({ where: { id, tenant_id: tenantId } });
  if (!o) throw new AppError(404, "NOT_FOUND", "الطلب غير موجود");
  o.status = status;
  await o.save();
  return serializeOrder(o, []);
}

export async function listPayments(tenantId, { status = "pending" } = {}) {
  const where = { tenant_id: tenantId };
  if (status) where.status = status;
  const rows = await StorePayment.findAll({
    where,
    order: [["created_at", "DESC"]],
    include: [{ model: StoreOrder, as: "order", attributes: ["order_number", "customer_name", "subtotal", "currency"], required: true }],
  });
  return rows.map((p) => ({
    id: String(p.id),
    method: p.method,
    amount: num(p.amount),
    senderPhone: p.sender_phone,
    transactionReference: p.transaction_reference,
    status: p.status,
    createdAt: p.created_at,
    orderNumber: p.order?.order_number,
    customerName: p.order?.customer_name,
    orderId: String(p.order_id),
  }));
}

export async function reviewPayment(tenantId, id, { approve, reviewerId, reason }) {
  const p = await StorePayment.findOne({ where: { id, tenant_id: tenantId } });
  if (!p) throw new AppError(404, "NOT_FOUND", "الدفعة غير موجودة");
  if (p.status !== "pending") throw new AppError(409, "ALREADY_REVIEWED", "تمت مراجعة هذه الدفعة مسبقاً");
  p.status = approve ? "approved" : "rejected";
  p.reviewed_by = reviewerId ? Number(reviewerId) : null;
  p.reviewed_at = new Date();
  p.rejection_reason = approve ? null : reason || null;
  await p.save();
  if (approve) {
    const o = await StoreOrder.findOne({ where: { id: p.order_id, tenant_id: tenantId } });
    if (o && o.status === "pending_payment") {
      o.status = "paid";
      o.payment_id = p.id;
      await o.save();
    }
  }
  return { id: String(p.id), status: p.status };
}

export const storeService = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listProducts,
  listAllProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  appendProductImage,
  deleteProduct,
  createOrder,
  createPayment,
  listOrders,
  getOrder,
  updateOrderStatus,
  listPayments,
  reviewPayment,
};

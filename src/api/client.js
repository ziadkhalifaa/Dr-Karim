const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/$/, "");
const ACCESS_KEY = "drke-access-token";
const REFRESH_KEY = "drke-refresh-token";

export class ApiError extends Error {
  constructor(message, { status, code, details } = {}) { super(message); this.name = "ApiError"; this.status = status; this.code = code; this.details = details; }
}

export const tokenStore = {
  get access() { return sessionStorage.getItem(ACCESS_KEY); },
  get refresh() { return sessionStorage.getItem(REFRESH_KEY); },
  save(session) { sessionStorage.setItem(ACCESS_KEY, session.accessToken); sessionStorage.setItem(REFRESH_KEY, session.refreshToken); },
  clear() { sessionStorage.removeItem(ACCESS_KEY); sessionStorage.removeItem(REFRESH_KEY); },
};

async function parse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) throw new ApiError(payload.error?.message || "Request failed", { status: response.status, code: payload.error?.code, details: payload.error?.details });
  return payload.data;
}

async function request(path, options = {}, retried = false) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (tokenStore.access) headers.Authorization = `Bearer ${tokenStore.access}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers, body: options.body && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body });
  if (response.status === 401 && !retried && tokenStore.refresh && !path.startsWith("/auth/")) {
    try { const session = await request("/auth/refresh", { method: "POST", body: { refreshToken: tokenStore.refresh } }, true); tokenStore.save(session); return request(path, options, true); } catch { tokenStore.clear(); }
  }
  return parse(response);
}

export const api = { get: (path, options) => request(path, { ...options, method: "GET" }), post: (path, body, options) => request(path, { ...options, method: "POST", body }), patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }), put: (path, body, options) => request(path, { ...options, method: "PUT", body }), delete: (path, options) => request(path, { ...options, method: "DELETE" }) };
export const authApi = {
  register: (body) => api.post("/auth/register", body),
  login: (body) => api.post("/auth/login", body),
  refresh: (refreshToken) => api.post("/auth/refresh", { refreshToken }),
  me: () => api.get("/auth/me"),
  logout: (refreshToken) => api.post("/auth/logout", { refreshToken }),
};
export const assessmentApi = { submit: (body) => api.post("/assessment/submit", body) };
export const reviewApi = { list: (query = "") => api.get(`/doctor/reviews${query}`), get: (id) => api.get(`/doctor/reviews/${id}`), assign: (id, body) => api.post(`/doctor/reviews/${id}/assign`, body), open: (id) => api.post(`/doctor/reviews/${id}/open`, {}), clarify: (id, body) => api.post(`/doctor/reviews/${id}/clarification`, body), approve: (id, body) => api.post(`/doctor/reviews/${id}/approve`, body), reject: (id, body) => api.post(`/doctor/reviews/${id}/reject`, body) };
export const patientApi = {
  list: (query = "") => api.get(`/patients${query}`),
  get: (id) => api.get(`/patients/${id}`),
  planVersions: (id) => api.get(`/patients/${id}/plan-versions`),
  home: () => api.get("/patients/me/home"),
  subscription: () => api.get("/patients/me/subscription"),
  profile: (id) => reviewApi.get(id),
};
export const foodApi = {
  list: (query = "") => api.get(`/food${query}`),
};
export const servicesApi = {
  // Doctor protected
  doctorList: (lang) => api.get(`/services/doctor/services?lang=${lang}`),
  categories: (lang = "ar") => api.get(`/services/doctor/categories?lang=${lang}`),
  create: (body) => api.post("/services/doctor/services", body),
  update: (id, body) => api.patch(`/services/doctor/services/${id}`, body),
  delete: (id) => api.delete(`/services/doctor/services/${id}`),
  uploadCover: (id, file) => {
    const form = new FormData();
    form.append("cover", file);
    return fetch(`${API_BASE}/content/doctor/services/${id}/cover`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenStore.access}` },
      body: form,
    }).then(parse);
  },
};
export const articleApi = {
  // public
  list: (query = "") => api.get(`/content/articles${query}`),
  get: (slug) => api.get(`/content/articles/${slug}`),
  // doctor
  doctorList: (query = "") => api.get(`/content/doctor/articles${query}`),
  create: (body) => api.post("/content/doctor/articles", body),
  update: (id, body) => api.patch(`/content/doctor/articles/${id}`, body),
  delete: (id) => api.delete(`/content/doctor/articles/${id}`),
  uploadCover: (id, file) => {
    const form = new FormData();
    form.append("cover", file);
    return fetch(`${(import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/$/, "")}/content/doctor/articles/${id}/cover`, {
      method: "POST",
      headers: { Authorization: `Bearer ${sessionStorage.getItem("drke-access-token")}` },
      body: form,
    }).then(r => r.json()).then(d => { if (!d.success) throw new Error(d.error?.message || "Upload failed"); return d.data; });
  },
};
export const planApi = (domain) => ({ create: (body) => api.post(`/${domain}-plans`, body), get: (id) => api.get(`/${domain}-plans/${id}`), patient: (id) => api.get(`/patients/${id}/${domain}-plan`), version: (id, body) => api.post(`/${domain}-plans/${id}/versions`, body), note: (id, body) => api.post(`/${domain}-plans/${id}/notes`, body), submit: (id) => api.post(`/${domain}-plan-versions/${id}/submit-review`, {}), approve: (id) => api.post(`/${domain}-plan-versions/${id}/approve`, {}), activate: (id) => api.post(`/${domain}-plan-versions/${id}/activate`, {}), archive: (id) => api.post(`/${domain}-plan-versions/${id}/archive`, {}) });
export const nutritionApi = planApi("nutrition");
export const exerciseApi = planApi("exercise");
export const planTemplateApi = { list: (domain) => api.get(`/plan-templates${domain ? `?domain=${domain}` : ""}`), create: (body) => api.post("/plan-templates", body), delete: (id) => api.delete(`/plan-templates/${id}`) };
export const checkinApi = { list: (id) => api.get(`/patients/${id}/checkins`), create: (id, body) => api.post(`/patients/${id}/checkins`, body), review: (id, body) => api.post(`/checkins/${id}/review`, body) };
export const appointmentApi = { get: (id) => api.get(`/appointments/${id}`), patientList: (id) => api.get(`/patients/${id}/appointments`), doctorList: (id) => api.get(`/doctors/${id}/appointments`), create: (body) => api.post("/appointments", body), transition: (id, action) => api.post(`/appointments/${id}/${action}`, {}) };
export const slotApi = { list: (query = "") => api.get(`/appointments/slots${query}`), create: (body) => api.post("/appointments/slots", body), book: (id, body = {}) => api.post(`/appointments/slots/${id}/book`, body), cancel: (id) => api.post(`/appointments/slots/${id}/cancel`, {}) };
export const liveSessionApi = { get: (id) => api.get(`/live-sessions/${id}`), create: (appointmentId) => api.post(`/appointments/${appointmentId}/live-session`, {}), join: (id) => api.post(`/live-sessions/${id}/join`, {}), end: (id) => api.post(`/live-sessions/${id}/end`, {}), notes: (id) => api.get(`/live-sessions/${id}/notes`), addNote: (id, body) => api.post(`/live-sessions/${id}/notes`, body) };
export const paymentApi = { packages: () => api.get("/packages"), package: (id) => api.get(`/packages/${id}`), settings: () => api.get("/payment-settings"), create: (body) => api.post("/payments", body), list: () => api.get("/patient/payments"), get: (id) => api.get(`/patient/payments/${id}`), receipt: (id, body) => api.post(`/payments/${id}/receipt`, body), entitlements: () => api.get("/patient/entitlements"), doctorList: () => api.get("/doctor/payments"), doctorGet: (id) => api.get(`/doctor/payments/${id}`), approve: (id) => api.post(`/doctor/payments/${id}/approve`, {}), reject: (id, reason) => api.post(`/doctor/payments/${id}/reject`, { reason }) };
/** Fetch a payment receipt with the auth header and return an object URL
 *  (<img>/<a> tags cannot send Authorization headers, so direct URLs fail). */
export async function paymentReceiptBlobUrl(id) {
  const response = await fetch(`${API_BASE}/payments/${id}/receipt`, {
    headers: tokenStore.access ? { Authorization: `Bearer ${tokenStore.access}` } : {},
  });
  if (!response.ok) throw new ApiError("Receipt unavailable", { status: response.status });
  return URL.createObjectURL(await response.blob());
}
export const notificationApi = { list: () => api.get("/notifications"), read: (id) => api.post(`/notifications/${id}/read`, {}), readAll: () => api.post("/notifications/read-all", {}) };
export const adminApi = { packages: () => api.get("/admin/packages"), updatePackage: (id, body) => api.patch(`/admin/packages/${id}`, body), settings: () => api.get("/admin/payment-settings"), updateSettings: (body) => api.patch("/admin/payment-settings", body) };
export const careApi = {
  dashboard: () => api.get("/care/dashboard"),
  program: (id) => api.get(`/care/programs/${id}`),
  programList: (query = "") => api.get(`/care/programs${query}`),
  createProgram: (body) => api.post("/care/programs", body),
  deleteProgram: (id) => api.delete(`/care/programs/${id}`),
  createVersion: (id, body) => api.post(`/care/programs/${id}/versions`, body),
  addDefinitions: (id, body) => api.post(`/care/programs/${id}/definitions`, body),
  activate: (id, versionNo) => api.post(`/care/programs/${id}/activate${versionNo ? `?versionNo=${versionNo}` : ""}`, {}),
  day: (dayId) => api.get(`/care/days/${dayId}`),
  record: (instanceId, body) => api.post(`/care/instances/${instanceId}/record`, body),
  correct: (executionId, body) => api.post(`/care/executions/${executionId}/correct`, body),
  checkin: (dayId, body) => api.post(`/care/days/${dayId}/checkin`, body),
  programSummary: (id, query = "") => api.get(`/care/programs/${id}/summary${query}`),
  pointsBalance: (programId) => api.get(`/care/points/balance${programId ? `?programId=${programId}` : ""}`),
  pointsLeaderboard: (programId) => api.get(`/care/points/leaderboard${programId ? `?programId=${programId}` : ""}`),
  redeemPoints: (body) => api.post("/care/redeem", body),
};
export const progressApi = {
  dashboard: (patientId) => api.get(`/progress/dashboard${patientId ? `?patientId=${patientId}` : ""}`),
  measurements: (query = "") => api.get(`/progress/measurements${query}`),
  recordMeasurement: (body) => api.post("/progress/measurements", body),
  correctMeasurement: (id, body) => api.post(`/progress/measurements/${id}/correct`, body),
  summary: (type, patientId) => api.get(`/progress/measurements/${type}/summary${patientId ? `?patientId=${patientId}` : ""}`),
  context: () => api.get("/progress/context"),
  updateContext: (body) => api.put("/progress/context", body),
  goals: (patientId, status) => api.get(`/progress/goals${patientId ? `?patientId=${patientId}` : ""}${status ? `${patientId ? "&" : "?"}status=${status}` : ""}`),
  goal: (id) => api.get(`/progress/goals/${id}`),
  createGoal: (body) => api.post("/progress/goals", body),
  addVersion: (id, body) => api.post(`/progress/goals/${id}/versions`, body),
  activateGoal: (id) => api.post(`/progress/goals/${id}/activate`, {}),
  closeGoal: (id, body) => api.post(`/progress/goals/${id}/close`, body),
};

/** Public website API — no auth needed */
export const publicApi = {
  /** List services grouped by category */
  services: (lang = "ar") => api.get(`/public/services?lang=${lang}`),
  /** Get a single service by code */
  service: (code, lang = "ar") => api.get(`/public/services/${code}?lang=${lang}`),
  /** List pricing packages */
  packages: () => api.get("/public/packages"),
  /** Clinic info + social media settings */
  settings: () => api.get("/public/settings"),
  /** Submit a contact form message */
  contact: (body) => api.post("/public/contact", body),
  /** Testimonials */
  testimonials: () => api.get("/public/testimonials"),
  // Doctor only
  contacts: (query = "") => api.get(`/public/doctor/contacts${query}`),
  markRead: (id) => api.patch(`/public/doctor/contacts/${id}/read`, {}),
};

export const testimonialAdminApi = {
  list: () => api.get("/testimonials"),
  create: (body) => api.post("/testimonials", body),
  update: (id, body) => api.put(`/testimonials/${id}`, body),
  delete: (id) => api.delete(`/testimonials/${id}`),
};

export const couponApi = {
  validate: (code) => api.post("/coupons/validate", { code }),
  list: () => api.get("/coupons"),
  create: (body) => api.post("/coupons", body),
  update: (id, body) => api.put(`/coupons/${id}`, body),
  delete: (id) => api.delete(`/coupons/${id}`),
};

export const chatApi = {
  // Patient
  session: () => api.get("/chat/session"),
  sendMessage: (body) => api.post("/chat/messages", body),
  // Doctor
  listSessions: () => api.get("/chat/sessions"),
  listMessages: (sid, before) => api.get(`/chat/sessions/${sid}/messages${before ? `?before=${before}` : ""}`),
  doctorReply: (sid, body) => api.post(`/chat/sessions/${sid}/messages`, body),
};

/** Doctor Packages CRUD API */
export const packageAdminApi = {
  list: () => api.get("/monetization/packages"),
  create: (body) => api.post("/monetization/packages", body),
  update: (id, body) => api.patch(`/monetization/packages/${id}`, body),
  delete: (id) => api.delete(`/monetization/packages/${id}`),
};

/** Doctor overview statistics */
export const doctorStatsApi = {
  overview: () => api.get("/doctor/overview"),
};

/** Store / e-commerce API */
export const storeApi = {
  // Public storefront
  categories: () => api.get("/store/categories"),
  products: (query = "") => api.get(`/store/products${query}`),
  product: (slug) => api.get(`/store/products/${slug}`),
  reviews: (slug) => api.get(`/store/products/${slug}/reviews`),
  addReview: (slug, body) => api.post(`/store/products/${slug}/reviews`, body),
  uploadReviewImages: (files) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));
    return api
      .post(`/store/reviews/images`, fd, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data);
  },
  checkout: (body) => api.post("/store/checkout", body),
  pay: (orderId, body) => api.post(`/store/orders/${orderId}/payment`, body),
  // Patient order tracking
  patientOrders: (query = "") => api.get(`/store/patient/orders${query}`),
  patientOrder: (id) => api.get(`/store/patient/orders/${id}`),
  // Doctor management
  doctorCategories: () => api.get("/store/doctor/categories"),
  createCategory: (body) => api.post("/store/doctor/categories", body),
  updateCategory: (id, body) => api.patch(`/store/doctor/categories/${id}`, body),
  deleteCategory: (id) => api.delete(`/store/doctor/categories/${id}`),
  doctorProducts: () => api.get("/store/doctor/products"),
  createProduct: (body) => api.post("/store/doctor/products", body),
  updateProduct: (id, body) => api.patch(`/store/doctor/products/${id}`, body),
  deleteProduct: (id) => api.delete(`/store/doctor/products/${id}`),
  uploadProductImage: (id, file) => {
    const form = new FormData();
    form.append("image", file);
    return fetch(`${API_BASE}/store/doctor/products/${id}/images`, {
      method: "POST",
      headers: tokenStore.access ? { Authorization: `Bearer ${tokenStore.access}` } : {},
      body: form,
    }).then(parse);
  },
  doctorOrders: (query = "") => api.get(`/store/doctor/orders${query}`),
  doctorOrder: (id) => api.get(`/store/doctor/orders/${id}`),
  updateOrderStatus: (id, status) => api.patch(`/store/doctor/orders/${id}/status`, { status }),
  doctorPayments: (query = "") => api.get(`/store/doctor/payments${query}`),
  reviewPayment: (id, action, reason) => api.post(`/store/doctor/payments/${id}/review`, { action, reason }),
  doctorReviews: () => api.get("/store/doctor/reviews"),
  doctorReviewReply: (id, reply) => api.post(`/store/doctor/reviews/${id}/reply`, { reply }),
  deleteReview: (id) => api.delete(`/store/doctor/reviews/${id}`),
};


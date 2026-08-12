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

export const api = { get: (path, options) => request(path, { ...options, method: "GET" }), post: (path, body, options) => request(path, { ...options, method: "POST", body }), patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }) };
export const authApi = {
  login: (body) => api.post("/auth/login", body),
  refresh: (refreshToken) => api.post("/auth/refresh", { refreshToken }),
  me: () => api.get("/auth/me"),
  logout: (refreshToken) => api.post("/auth/logout", { refreshToken }),
};
export const assessmentApi = { submit: (body) => api.post("/assessment/submit", body) };
export const reviewApi = { list: (query = "") => api.get(`/doctor/reviews${query}`), get: (id) => api.get(`/doctor/reviews/${id}`), assign: (id, body) => api.post(`/doctor/reviews/${id}/assign`, body), open: (id) => api.post(`/doctor/reviews/${id}/open`, {}), clarify: (id, body) => api.post(`/doctor/reviews/${id}/clarification`, body), approve: (id, body) => api.post(`/doctor/reviews/${id}/approve`, body), reject: (id, body) => api.post(`/doctor/reviews/${id}/reject`, body) };
export const patientApi = { profile: (id) => reviewApi.get(id) };
export const planApi = (domain) => ({ create: (body) => api.post(`/${domain}-plans`, body), get: (id) => api.get(`/${domain}-plans/${id}`), patient: (id) => api.get(`/patients/${id}/${domain}-plan`), version: (id, body) => api.post(`/${domain}-plans/${id}/versions`, body), note: (id, body) => api.post(`/${domain}-plans/${id}/notes`, body), submit: (id) => api.post(`/${domain}-plan-versions/${id}/submit-review`, {}), approve: (id) => api.post(`/${domain}-plan-versions/${id}/approve`, {}), activate: (id) => api.post(`/${domain}-plan-versions/${id}/activate`, {}), archive: (id) => api.post(`/${domain}-plan-versions/${id}/archive`, {}) });
export const nutritionApi = planApi("nutrition");
export const exerciseApi = planApi("exercise");
export const checkinApi = { list: (id) => api.get(`/patients/${id}/checkins`), create: (id, body) => api.post(`/patients/${id}/checkins`, body), review: (id, body) => api.post(`/checkins/${id}/review`, body) };
export const appointmentApi = { get: (id) => api.get(`/appointments/${id}`), patientList: (id) => api.get(`/patients/${id}/appointments`), doctorList: (id) => api.get(`/doctors/${id}/appointments`), create: (body) => api.post("/appointments", body), transition: (id, action) => api.post(`/appointments/${id}/${action}`, {}) };
export const liveSessionApi = { get: (id) => api.get(`/live-sessions/${id}`), create: (appointmentId) => api.post(`/appointments/${appointmentId}/live-session`, {}), join: (id) => api.post(`/live-sessions/${id}/join`, {}), end: (id) => api.post(`/live-sessions/${id}/end`, {}), notes: (id) => api.get(`/live-sessions/${id}/notes`), addNote: (id, body) => api.post(`/live-sessions/${id}/notes`, body) };
export const paymentApi = { packages: () => api.get("/packages"), package: (id) => api.get(`/packages/${id}`), settings: () => api.get("/payment-settings"), create: (body) => api.post("/payments", body), list: () => api.get("/patient/payments"), get: (id) => api.get(`/patient/payments/${id}`), receipt: (id, body) => api.post(`/payments/${id}/receipt`, body), entitlements: () => api.get("/patient/entitlements"), doctorList: () => api.get("/doctor/payments"), doctorGet: (id) => api.get(`/doctor/payments/${id}`), approve: (id) => api.post(`/doctor/payments/${id}/approve`, {}), reject: (id, reason) => api.post(`/doctor/payments/${id}/reject`, { reason }) };
export const notificationApi = { list: () => api.get("/notifications"), read: (id) => api.post(`/notifications/${id}/read`, {}), readAll: () => api.post("/notifications/read-all", {}) };
export const adminApi = { packages: () => api.get("/admin/packages"), updatePackage: (id, body) => api.patch(`/admin/packages/${id}`, body), settings: () => api.get("/admin/payment-settings"), updateSettings: (body) => api.patch("/admin/payment-settings", body) };

// Isolated assessment API client for Phase 2. NOT wired to the UI flow.
// The approved frontend (AssessmentPage) retains its local prototype behavior
// (localStorage draft, client-generated reference number, SuccessScreen).
// This module exists so a future phase can integrate without rewriting the UI.
// Usage: import { submitAssessment } from "./api/assessmentApi.js";

const API_BASE = (import.meta.env?.VITE_API_BASE_URL || "/api/v1").replace(/\/+$/, "");

export async function submitAssessment(payload, options = {}) {
  const { headers = {}, ...fetchOpts } = options;
  const response = await fetch(`${API_BASE}/assessment/submit`, {
    method: "POST",
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Slug": "dr-kareem",
      ...headers,
    },
    body: JSON.stringify(payload),
    ...fetchOpts,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const err = new Error(data?.error?.message || `HTTP ${response.status}`);
    err.status = response.status;
    err.code = data?.error?.code;
    err.details = data?.error?.details;
    throw err;
  }

  return data;
}

export function getApiBase() {
  return API_BASE;
}

export default { submitAssessment, getApiBase };
import { randomUUID } from "node:crypto";
import env from "../config/env.js";

export class DailyProviderError extends Error {
  constructor(message, status = 502) { super(message); this.name = "DailyProviderError"; this.status = status; }
}

export class DailyProvider {
  constructor({ fetchImpl = globalThis.fetch, config = env } = {}) {
    this.fetchImpl = fetchImpl;
    this.config = config;
  }

  async request(path, options = {}) {
    if (!this.config.DAILY_API_KEY) throw new DailyProviderError("Daily provider is not configured", 503);
    const response = await this.fetchImpl(`${this.config.DAILY_API_BASE_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.config.DAILY_API_KEY}`, ...(options.headers || {}) },
    });
    if (!response.ok) throw new DailyProviderError(`Daily provider request failed (${response.status})`, 502);
    return response.json();
  }

  async createRoom({ name, expiresAt }) {
    if (this.config.DAILY_PROVIDER_MODE === "mock") { const ref = name || `mock-${randomUUID()}`; return { externalRoomRef: ref, externalRoomUrl: `https://mock.daily.local/${encodeURIComponent(ref)}`, externalSessionRef: null }; }
    const room = await this.request("/rooms", { method: "POST", body: JSON.stringify({ name, privacy: "private", properties: { exp: Math.floor(expiresAt.getTime() / 1000), max_participants: 2 } }) });
    return { externalRoomRef: room.name || name, externalRoomUrl: room.url, externalSessionRef: null };
  }

  async createJoinToken({ roomName, userId, userName, isOwner, expiresAt }) {
    if (this.config.DAILY_PROVIDER_MODE === "mock") return { token: `mock-${randomUUID()}`, expiresAt };
    const result = await this.request("/meeting-tokens", { method: "POST", body: JSON.stringify({ properties: { room_name: roomName, user_id: String(userId), user_name: userName, is_owner: Boolean(isOwner), exp: Math.floor(expiresAt.getTime() / 1000) } }) });
    return { token: result.token, expiresAt };
  }

  async getMeeting(externalSessionRef) {
    if (!externalSessionRef || this.config.DAILY_PROVIDER_MODE === "mock") return null;
    return this.request(`/meetings/${encodeURIComponent(externalSessionRef)}`, { method: "GET" });
  }

  async endRoom(roomName) {
    if (!roomName || this.config.DAILY_PROVIDER_MODE === "mock") return;
    await this.request(`/rooms/${encodeURIComponent(roomName)}`, { method: "DELETE" });
  }
}

export const dailyProvider = new DailyProvider();
export default dailyProvider;

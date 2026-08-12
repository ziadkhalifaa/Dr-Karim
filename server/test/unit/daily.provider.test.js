import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DailyProvider } from "../../src/services/daily.provider.js";

describe("Daily provider abstraction", () => {
  it("uses mock credentials without persisting or requiring a Daily secret", async () => {
    const provider = new DailyProvider({ config: { DAILY_PROVIDER_MODE: "mock", DAILY_API_KEY: null, DAILY_API_BASE_URL: "https://unused" } });
    const room = await provider.createRoom({ name: "test-room", expiresAt: new Date(Date.now() + 3600000) });
    const credential = await provider.createJoinToken({ roomName: room.externalRoomRef, userId: "1", userName: "Test", isOwner: false, expiresAt: new Date(Date.now() + 600000) });
    assert.equal(room.externalRoomRef, "test-room");
    assert.match(credential.token, /^mock-/);
    assert.notEqual(credential.token, room.externalRoomRef);
  });

  it("sends provider management requests with the secret only through the adapter", async () => {
    const requests = [];
    const provider = new DailyProvider({ config: { DAILY_PROVIDER_MODE: "daily", DAILY_API_KEY: "secret", DAILY_API_BASE_URL: "https://api.test", }, fetchImpl: async (url, options) => { requests.push({ url, options }); return { ok: true, async json() { return { name: "room", token: "short-lived" }; } }; } });
    await provider.createRoom({ name: "room", expiresAt: new Date(Date.now() + 3600000) });
    assert.equal(requests[0].url, "https://api.test/rooms");
    assert.equal(requests[0].options.headers.Authorization, "Bearer secret");
    assert.equal(JSON.parse(requests[0].options.body).privacy, "private");
  });
});

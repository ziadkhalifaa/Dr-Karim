import crypto from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt);
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };

export async function hashPassword(password) {
  if (typeof password !== "string" || password.length < 12) throw new Error("Password does not meet minimum length");
  const salt = crypto.randomBytes(16).toString("base64url");
  const derived = await scrypt(password, salt, 64, SCRYPT_OPTIONS);
  return `scrypt$${salt}$${Buffer.from(derived).toString("base64url")}`;
}

export async function verifyPassword(password, encoded) {
  try {
    const [, salt, expected] = String(encoded).split("$");
    if (!salt || !expected) return false;
    const actual = Buffer.from(await scrypt(password, salt, 64, SCRYPT_OPTIONS));
    const wanted = Buffer.from(expected, "base64url");
    return actual.length === wanted.length && crypto.timingSafeEqual(actual, wanted);
  } catch { return false; }
}

export function randomToken(bytes = 32) { return crypto.randomBytes(bytes).toString("base64url"); }
export function hashToken(token) { return crypto.createHash("sha256").update(token, "utf8").digest("hex"); }

export function signAccessToken(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifyAccessToken(token, secret) {
  const [body, signature] = String(token || "").split(".");
  if (!body || !signature) return null;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  const a = Buffer.from(signature); const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

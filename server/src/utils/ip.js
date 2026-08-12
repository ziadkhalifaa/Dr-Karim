// Mask an IP address for audit logs (architecture §9). Preserves enough for
// analytics without exposing the full client address.

export function maskIp(ip) {
  if (!ip || typeof ip !== "string") return null;
  if (ip.includes(":")) {
    const parts = ip.split(":");
    if (parts.length >= 2) parts[parts.length - 1] = "x";
    return parts.join(":");
  }
  const octets = ip.split(".");
  if (octets.length === 4) {
    octets[3] = "x";
    return octets.join(".");
  }
  return ip;
}

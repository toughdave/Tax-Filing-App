export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***";
  const visibleLocal = local.length <= 2 ? "*" : local[0] + "*".repeat(local.length - 2) + local[local.length - 1];
  return `${visibleLocal}@${domain}`;
}

export function maskName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .map((p) => (p.length <= 1 ? "*" : p[0] + "*".repeat(p.length - 1)))
    .join(" ");
}

export function maskIp(ip: string | null): string {
  if (!ip) return "—";
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.*.*`;
  }
  return ip.replace(/:[\da-f]+$/i, ":****");
}

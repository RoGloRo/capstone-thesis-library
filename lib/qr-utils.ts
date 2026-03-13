const QR_PREFIX = "LIBUSER-";

export function getQRToken(userId: string): string {
  return `${QR_PREFIX}${userId}`;
}

export function parseQRCode(qrContent: string): string | null {
  const trimmed = qrContent.trim();
  if (!trimmed.startsWith(QR_PREFIX)) return null;
  const userId = trimmed.slice(QR_PREFIX.length);
  return userId || null;
}

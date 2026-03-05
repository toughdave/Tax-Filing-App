import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const PII_PREFIX = "enc:";

const PII_FIELD_KEYS = new Set(["legalName", "sinLast4", "birthDate"]);

function getEncryptionKey(): Buffer {
  const secret = process.env.PII_ENCRYPTION_KEY ?? process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("PII_ENCRYPTION_KEY or NEXTAUTH_SECRET is required for PII encryption");
  return crypto.createHash("sha256").update(secret).digest();
}

export function isPiiField(key: string): boolean {
  return PII_FIELD_KEYS.has(key);
}

export function encryptPiiValue(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();
  return `${PII_PREFIX}${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

export function decryptPiiValue(ciphertext: string): string {
  if (!ciphertext.startsWith(PII_PREFIX)) return ciphertext;
  const raw = ciphertext.slice(PII_PREFIX.length);
  const key = getEncryptionKey();
  const parts = raw.split(":");
  const [ivHex, tagHex, encrypted] = parts;
  if (parts.length < 3 || ivHex === undefined || tagHex === undefined || encrypted === undefined) {
    throw new Error("Invalid PII ciphertext format");
  }
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function encryptPiiFields(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data };
  for (const key of Object.keys(result)) {
    if (isPiiField(key) && typeof result[key] === "string" && !String(result[key]).startsWith(PII_PREFIX)) {
      result[key] = encryptPiiValue(result[key] as string);
    }
  }
  return result;
}

export function decryptPiiFields(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data };
  for (const key of Object.keys(result)) {
    if (isPiiField(key) && typeof result[key] === "string" && String(result[key]).startsWith(PII_PREFIX)) {
      result[key] = decryptPiiValue(result[key] as string);
    }
  }
  return result;
}

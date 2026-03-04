import { prisma } from "@/lib/db";
import {
  generateTotpSecret,
  generateTotpUri,
  verifyTotpToken,
  encryptSecret,
  decryptSecret,
  generateRecoveryCodes
} from "@/lib/totp";

export interface EnrollmentResult {
  secret: string;
  uri: string;
  recoveryCodes: string[];
}

export async function startEnrollment(
  userId: string,
  userEmail: string
): Promise<EnrollmentResult> {
  const existing = await prisma.totpDevice.findUnique({ where: { userId } });
  if (existing?.verified) {
    throw new Error("MFA_ALREADY_ENABLED");
  }

  const secret = generateTotpSecret();
  const uri = generateTotpUri(secret, userEmail);
  const recoveryCodes = generateRecoveryCodes();
  const encrypted = encryptSecret(secret);

  await prisma.totpDevice.upsert({
    where: { userId },
    create: {
      userId,
      encryptedSecret: encrypted,
      verified: false,
      recoveryCodes
    },
    update: {
      encryptedSecret: encrypted,
      verified: false,
      recoveryCodes
    }
  });

  return { secret, uri, recoveryCodes };
}

export async function confirmEnrollment(
  userId: string,
  token: string
): Promise<boolean> {
  const device = await prisma.totpDevice.findUnique({ where: { userId } });
  if (!device) throw new Error("MFA_NOT_ENROLLED");
  if (device.verified) throw new Error("MFA_ALREADY_ENABLED");

  const secret = decryptSecret(device.encryptedSecret);
  if (!verifyTotpToken(secret, token)) {
    return false;
  }

  await prisma.totpDevice.update({
    where: { userId },
    data: { verified: true }
  });

  return true;
}

export async function disableMfa(userId: string): Promise<void> {
  await prisma.totpDevice.deleteMany({ where: { userId } });
}

export async function isMfaEnabled(userId: string): Promise<boolean> {
  const device = await prisma.totpDevice.findUnique({ where: { userId } });
  return device?.verified === true;
}

export async function verifyMfaChallenge(
  userId: string,
  token: string
): Promise<boolean> {
  const device = await prisma.totpDevice.findUnique({ where: { userId } });
  if (!device?.verified) return false;

  const recoveryIndex = device.recoveryCodes.indexOf(token.toUpperCase());
  if (recoveryIndex !== -1) {
    const updatedCodes = [...device.recoveryCodes];
    updatedCodes.splice(recoveryIndex, 1);
    await prisma.totpDevice.update({
      where: { userId },
      data: { recoveryCodes: updatedCodes }
    });
    return true;
  }

  const secret = decryptSecret(device.encryptedSecret);
  return verifyTotpToken(secret, token);
}

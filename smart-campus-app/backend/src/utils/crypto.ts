import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateOTP(): string {
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
}

export function hashOTP(otp: string): string {
  return crypto.createHmac('sha256', 'otp-pepper-change-me').update(otp).digest('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function signQR(payload: object, secret: string): string {
  const data = JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

export function verifyQRSignature(payload: object, signature: string, secret: string): boolean {
  const data = JSON.stringify(payload);
  const expected = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export function generateReferenceId(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function encryptField(text: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptField(encryptedText: string, key: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(key, 'hex'),
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

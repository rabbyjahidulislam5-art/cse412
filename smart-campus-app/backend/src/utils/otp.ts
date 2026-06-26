import { authenticator } from 'otplib';
import qrcode from 'qrcode';

export function generateTOTPSecret(): string {
  return authenticator.generateSecret();
}

export function getTOTPToken(secret: string): string {
  return authenticator.generate(secret);
}

export function verifyTOTP(token: string, secret: string): boolean {
  authenticator.options = { window: 1 };
  return authenticator.verify({ token, secret });
}

export async function generateTOTPQRDataURL(email: string, secret: string): Promise<string> {
  const otpauth = authenticator.keyuri(email, 'SmartCampus', secret);
  return qrcode.toDataURL(otpauth);
}

export function generateRecoveryCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    codes.push(require('crypto').randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
}

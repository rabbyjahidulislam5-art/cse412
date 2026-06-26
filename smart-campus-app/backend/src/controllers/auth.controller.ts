import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { hashPassword, comparePassword, generateOTP, hashOTP, generateReferenceId, generateToken } from '../utils/crypto';
import { getTOTPToken, verifyTOTP, generateTOTPQRDataURL, generateRecoveryCodes } from '../utils/otp';
import { sendOTPEmail } from '../utils/email';
import { success, error } from '../utils/response';
import { createSession, revokeAllSessions, AuthRequest } from '../middleware/auth.middleware';
import { config } from '../config';
import jwt from 'jsonwebtoken';

export class AuthController {
  // POST /api/v1/auth/register
  async register(req: Request, res: Response) {
    const { studentId, email, phone, fullName, password, department, semester } = req.body;

    const exists = await prisma.user.findFirst({
      where: { OR: [{ studentId }, { email }, { phone }] },
    });
    if (exists) return error(res, 'DUPLICATE', 'Student ID, email, or phone already registered', 409);

    const passwordHash = await hashPassword(password);
    const otp = generateOTP();
    const otpHash = hashOTP(otp);

    const user = await prisma.user.create({
      data: { studentId, email, phone, fullName, passwordHash, department, semester: parseInt(semester, 10), role: 'STUDENT', status: 'PENDING' },
    });

    await prisma.oTPRecord.create({
      data: { userId: user.id, otpHash, purpose: 'REGISTRATION', expiresAt: new Date(Date.now() + config.otp.expiryMs) },
    });

    await sendOTPEmail(email, otp);
    // In production also send SMS to phone

    const partialToken = jwt.sign(
      { sub: user.id, role: 'PENDING', sessionId: 'registration' },
      config.jwt.accessTokenSecret,
      { expiresIn: '30m' }
    );

    success(res, { userId: user.id, token: partialToken }, 201);
  }

  // POST /api/v1/auth/verify-otp
  async verifyOTP(req: AuthRequest, res: Response) {
    const { otp } = req.body;
    const userId = req.user?.id;
    if (!userId) return error(res, 'UNAUTHORIZED', 'User ID required', 401);

    const record = await prisma.oTPRecord.findFirst({
      where: { userId, purpose: 'REGISTRATION', usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) return error(res, 'OTP_EXPIRED', 'No valid OTP found. Please request a new one.', 400);

    if (record.attemptCount >= config.otp.maxAttempts) {
      await prisma.oTPRecord.update({ where: { id: record.id }, data: { usedAt: new Date() } });
      return error(res, 'OTP_BLOCKED', 'Too many attempts. Please request a new OTP.', 429);
    }

    const isMatch = hashOTP(otp) === record.otpHash;
    await prisma.oTPRecord.update({
      where: { id: record.id },
      data: { attemptCount: { increment: 1 } },
    });

    if (!isMatch) return error(res, 'OTP_INVALID', 'Invalid OTP. Please try again.', 400);

    await prisma.oTPRecord.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    await prisma.user.update({ where: { id: userId }, data: { status: 'KYC_PENDING' } });

    success(res, { status: 'KYC_PENDING' });
  }

  // POST /api/v1/auth/login
  async login(req: Request, res: Response) {
    const { studentId, password } = req.body;

    const user = await prisma.user.findUnique({ where: { studentId } });
    if (!user) return error(res, 'INVALID_CREDENTIALS', 'Invalid credentials', 401);

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return error(res, 'ACCOUNT_LOCKED', `Account locked until ${user.lockedUntil.toISOString()}`, 403);
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: { increment: 1 } },
      });

      if (user.failedLoginCount + 1 >= config.accountLock.maxFailedAttempts) {
        await prisma.user.update({
          where: { id: user.id },
          data: { status: 'LOCKED', lockedUntil: new Date(Date.now() + config.accountLock.lockoutDurationMs) },
        });
        return error(res, 'ACCOUNT_LOCKED', 'Account locked due to too many failed attempts', 403);
      }

      await prisma.securityEvent.create({
        data: { userId: user.id, eventType: 'LOGIN_FAILURE', severity: 'MEDIUM', ipAddress: req.ip },
      });
      return error(res, 'INVALID_CREDENTIALS', 'Invalid credentials', 401);
    }

    if (user.status === 'KYC_PENDING') return error(res, 'KYC_PENDING', 'Please complete KYC verification', 403);
    if (user.status !== 'ACTIVE') return error(res, 'ACCOUNT_NOT_ACTIVE', `Account status: ${user.status}`, 403);

    // Reset failed login count
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lastLoginAt: new Date() },
    });

    await prisma.securityEvent.create({
      data: { userId: user.id, eventType: 'LOGIN_SUCCESS', severity: 'LOW', ipAddress: req.ip },
    });

    // If 2FA enabled, issue partial token
    if (user.totpEnabled) {
      const partialToken = jwt.sign(
        { sub: user.id, role: user.role, sessionId: '2fa-pending', twoFA: true },
        config.jwt.accessTokenSecret,
        { expiresIn: '5m' }
      );
      return success(res, { requires2FA: true, token: partialToken });
    }

    // Full login
    const deviceInfo = req.headers['user-agent'] || 'Unknown';
    const { accessToken, refreshToken } = await createSession(user.id, deviceInfo, req.ip || 'unknown');

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    success(res, {
      accessToken, user: {
        id: user.id, studentId: user.studentId, fullName: user.fullName,
        role: user.role, department: user.department, semester: user.semester,
      },
    });
  }

  // POST /api/v1/auth/2fa/verify
  async verify2FA(req: AuthRequest, res: Response) {
    const { token } = req.body;
    const userId = req.user?.id;
    if (!userId) return error(res, 'UNAUTHORIZED', 'User required', 401);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.totpSecret) return error(res, 'BAD_REQUEST', '2FA not configured', 400);

    const valid = verifyTOTP(token, user.totpSecret);
    if (!valid) return error(res, 'INVALID_2FA', 'Invalid 2FA code', 401);

    const deviceInfo = req.headers['user-agent'] || 'Unknown';
    const { accessToken, refreshToken } = await createSession(user.id, deviceInfo, req.ip || 'unknown');

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true, secure: config.nodeEnv === 'production', sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    success(res, { accessToken });
  }

  // POST /api/v1/auth/refresh
  async refresh(req: Request, res: Response) {
    const accessToken = (res as any).accessToken;
    if (!accessToken) return error(res, 'REFRESH_FAILED', 'Token refresh failed', 401);
    success(res, { accessToken });
  }

  // POST /api/v1/auth/logout
  async logout(req: AuthRequest, res: Response) {
    if (req.user?.sessionId) {
      await prisma.session.updateMany({
        where: { id: req.user.sessionId },
        data: { revokedAt: new Date() },
      });
    }
    res.clearCookie('refresh_token');
    success(res, { message: 'Logged out successfully' });
  }

  // POST /api/v1/auth/forgot-password
  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return success(res, { message: 'If the email exists, a reset link has been sent' });

    const resetToken = generateToken();
    await prisma.oTPRecord.create({
      data: {
        userId: user.id,
        otpHash: require('crypto').createHash('sha256').update(resetToken).digest('hex'),
        purpose: 'PASSWORD_RESET',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      },
    });

    // In production send email with reset link
    success(res, { message: 'Password reset email sent' });
  }

  // POST /api/v1/auth/reset-password
  async resetPassword(req: Request, res: Response) {
    const { token, password } = req.body;
    const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');

    const record = await prisma.oTPRecord.findFirst({
      where: { otpHash: tokenHash, purpose: 'PASSWORD_RESET', usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!record) return error(res, 'INVALID_TOKEN', 'Invalid or expired reset token', 400);

    const passwordHash = await hashPassword(password);
    await prisma.user.update({ where: { id: record.userId }, data: { passwordHash } });
    await prisma.oTPRecord.update({ where: { id: record.id }, data: { usedAt: new Date() } });

    await revokeAllSessions(record.userId);
    success(res, { message: 'Password reset successfully' });
  }

  // POST /api/v1/auth/setup-2fa
  async setup2FA(req: AuthRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) return error(res, 'UNAUTHORIZED', 'Auth required', 401);

    const secret = generateTOTPSecret();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return error(res, 'NOT_FOUND', 'User not found', 404);

    const qrDataURL = await generateTOTPQRDataURL(user.email, secret);
    const recoveryCodes = generateRecoveryCodes();

    // Store secret temporarily (not enabled until verified)
    await prisma.user.update({ where: { id: userId }, data: { totpSecret: secret } });

    success(res, { qrDataURL, secret, recoveryCodes });
  }

  // POST /api/v1/auth/enable-2fa
  async enable2FA(req: AuthRequest, res: Response) {
    const userId = req.user?.id;
    const { token } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.totpSecret) return error(res, 'BAD_REQUEST', '2FA setup not initiated', 400);

    if (!verifyTOTP(token, user.totpSecret)) return error(res, 'INVALID_2FA', 'Invalid code', 400);

    await prisma.user.update({ where: { id: userId }, data: { totpEnabled: true } });
    await prisma.securityEvent.create({ data: { userId, eventType: 'TWO_FACTOR_ENABLED', severity: 'HIGH' } });

    success(res, { enabled: true });
  }

  // POST /api/v1/auth/kyc/upload
  async uploadKYC(req: AuthRequest, res: Response) {
    const { docType, fileUrl, secondDocType, secondFileUrl } = req.body;

    if (!req.user?.id) return error(res, 'UNAUTHORIZED', 'Not authenticated', 401);

    const docs = [];
    if (docType && fileUrl) {
      docs.push({ userId: req.user.id, docType, fileUrl, status: 'SUBMITTED' });
    }
    if (secondDocType && secondFileUrl) {
      docs.push({ userId: req.user.id, docType: secondDocType, fileUrl: secondFileUrl, status: 'SUBMITTED' });
    }

    if (docs.length === 0) return error(res, 'VALIDATION_ERROR', 'At least one document is required', 400);

    await prisma.kYCDocument.createMany({ data: docs });

    // Update user KYC status to SUBMITTED
    await prisma.user.update({
      where: { id: req.user.id },
      data: { kycStatus: 'SUBMITTED' },
    });

    success(res, { message: 'KYC documents uploaded successfully', status: 'SUBMITTED' });
  }
}

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smart_campus',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },
  jwt: {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'access-secret-key-change-in-production',
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key-change-in-production',
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
  },
  otp: {
    expiryMs: 5 * 60 * 1000, // 5 minutes
    maxAttempts: 3,
    maxResends: 3,
    resendCooldownMs: 60 * 1000, // 1 minute
  },
  wallet: {
    singleTopUpMax: 10000000,    // 10,000 BDT (paisa)
    dailyTopUpMax: 20000000,     // 20,000 BDT
    monthlyTopUpMax: 50000000,   // 50,000 BDT
    singleTransferMax: 500000,   // 5,000 BDT
    dailyTransferMax: 1000000,   // 10,000 BDT
    transferOtpThreshold: 50000, // 500 BDT
    singleQrPayMax: 500000,      // 5,000 BDT
    dailyQrPayMax: 2000000,      // 20,000 BDT
    qrPayOtpThreshold: 100000,   // 1,000 BDT
    maxBalance: 100000000,        // 1,00,000 BDT
    withdrawalMin: 10000,        // 100 BDT
    withdrawalAutoMax: 1000000,  // 10,000 BDT
  },
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    from: process.env.EMAIL_FROM || 'noreply@smartcampus.ewu.edu.bd',
  },
  sms: {
    gateway: process.env.SMS_GATEWAY || 'sslcommerz',
    apiKey: process.env.SMS_API_KEY || '',
  },
  payment: {
    sslcommerz: {
      storeId: process.env.SSLCOMMERZ_STORE_ID || '',
      storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD || '',
      sandbox: process.env.SSLCOMMERZ_SANDBOX === 'true',
    },
    bkash: {
      appKey: process.env.BKASH_APP_KEY || '',
      appSecret: process.env.BKASH_APP_SECRET || '',
      username: process.env.BKASH_USERNAME || '',
      password: process.env.BKASH_PASSWORD || '',
      sandbox: process.env.BKASH_SANDBOX === 'true',
    },
    nagad: {
      merchantId: process.env.NAGAD_MERCHANT_ID || '',
      publicKey: process.env.NAGAD_PUBLIC_KEY || '',
      privateKey: process.env.NAGAD_PRIVATE_KEY || '',
      sandbox: process.env.NAGAD_SANDBOX === 'true',
    },
  },
  rateLimit: {
    global: { windowMs: 60 * 1000, max: 100 },
    auth: { windowMs: 60 * 1000, max: 10 },
    payment: { windowMs: 60 * 1000, max: 20 },
    otp: { windowMs: 60 * 1000, max: 5 },
  },
  accountLock: {
    maxFailedAttempts: 5,
    lockoutDurationMs: 30 * 60 * 1000, // 30 minutes
    totalFailedThreshold: 10,
  },
  security: {
    qrExpirySeconds: 60,
    qrSigningSecret: process.env.QR_SIGNING_SECRET || 'qr-signing-secret-change-me',
    otpPepper: process.env.OTP_PEPPER || 'otp-pepper-change-me',
  },
  storage: {
    s3Bucket: process.env.S3_BUCKET || '',
    s3Region: process.env.S3_REGION || 'us-east-1',
    s3AccessKey: process.env.S3_ACCESS_KEY || '',
    s3SecretKey: process.env.S3_SECRET_KEY || '',
  },
};

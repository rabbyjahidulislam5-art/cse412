import { z } from 'zod';

export const registerSchema = z.object({
  studentId: z.string().regex(/^\d{4}-\d+-\d+-\d+$/, 'Invalid Student ID format'),
  email: z.string().email().refine(val => val.endsWith('@ewubd.edu') || val.endsWith('@std.ewubd.edu'), { message: 'Must use university email' }),
  phone: z.string().regex(/^(?:\+880|01)\d{9}$/, 'Invalid BD phone number'),
  fullName: z.string().min(3).max(255),
  password: z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase').regex(/[a-z]/, 'Must contain lowercase').regex(/\d/, 'Must contain digit').regex(/[!@#$%^&*]/, 'Must contain special character'),
  department: z.string().optional(),
  semester: z.number().int().optional(),
});

export const loginSchema = z.object({
  studentId: z.string(),
  password: z.string(),
});

export const verifyOTPSchema = z.object({
  otp: z.string().length(6).regex(/^\d{6}$/),
});

export const verify2FASchema = z.object({
  token: z.string().length(6),
});

export const topUpSchema = z.object({
  amount: z.number().int().min(5000).max(10000000), // 50 - 10000 BDT in paisa
  gateway: z.enum(['bkash', 'nagad', 'sslcommerz']),
});

export const transferSchema = z.object({
  recipientStudentId: z.string(),
  amount: z.number().int().min(1000).max(500000), // 10 - 5000 BDT
  note: z.string().max(255).optional(),
  otp: z.string().optional(), // required for > 500 BDT
});

export const qrPaySchema = z.object({
  qrPayload: z.string(),
  amount: z.number().int().positive().optional(),
  otp: z.string().optional(),
});

export const payFineSchema = z.object({
  otp: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
  otp: z.string().optional(),
});

export const kycUploadSchema = z.object({
  docType: z.enum(['NATIONAL_ID', 'BIRTH_CERTIFICATE']),
  fileUrl: z.string().url(),
  secondDocType: z.enum(['ADMISSION_LETTER', 'STUDENT_CARD']).optional(),
  secondFileUrl: z.string().url().optional(),
});

export const kycDecisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
  notes: z.string().optional(),
});

export const issueBookSchema = z.object({
  studentId: z.string(),
  bookId: z.string(),
  dueDate: z.string().datetime().optional(),
});

export const returnBookSchema = z.object({
  bookIssueId: z.string(),
  condition: z.enum(['GOOD', 'MINOR_DAMAGE', 'MAJOR_DAMAGE', 'LOST']).optional(),
});

export const addFineSchema = z.object({
  studentId: z.string(),
  type: z.enum(['LIBRARY', 'DISCIPLINARY', 'TUITION_LATE', 'OTHER']),
  description: z.string(),
  amount: z.number().int().positive(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

export const waiveFineSchema = z.object({
  reason: z.string().min(5),
  notes: z.string().optional(),
});

export const updateProfileSchema = z.object({
  fullName: z.string().optional(),
  department: z.string().optional(),
  semester: z.number().optional(),
  profilePhoto: z.string().optional(),
});

export const withdrawSchema = z.object({
  amount: z.number().int().positive(),
  destination: z.string(),
  password: z.string(),
});

export const supportTicketSchema = z.object({
  category: z.string(),
  subject: z.string().min(5),
  description: z.string().min(10),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
});

export const fineAppealSchema = z.object({
  statement: z.string().min(10),
  evidenceUrls: z.array(z.string().url()).optional(),
});

export const withdrawalRequestSchema = z.object({
  amount: z.number().int().positive(),
  destination: z.string(),
  password: z.string(),
});

export const broadcastNotificationSchema = z.object({
  target: z.enum(['ALL', 'DEPARTMENT', 'INDIVIDUAL']),
  targetValue: z.string().optional(),
  title: z.string().min(3),
  message: z.string().min(10),
  channels: z.array(z.enum(['PUSH', 'EMAIL', 'SMS'])).optional(),
});

export const bookSchema = z.object({
  isbn: z.string(),
  title: z.string(),
  author: z.string(),
  publisher: z.string().optional(),
  year: z.number().int().optional(),
  genre: z.string().optional(),
  quantity: z.number().int().min(1),
  locationCode: z.string().optional(),
  category: z.string().optional(),
});

export const merchantProfileSchema = z.object({
  shopName: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  contactPhone: z.string().optional(),
  logo: z.string().optional(),
});

export const refundRequestSchema = z.object({
  transactionId: z.string(),
  reason: z.string().min(5),
  partialAmount: z.number().int().positive().optional(),
});

export const suspendAccountSchema = z.object({
  reason: z.string().min(5),
  duration: z.enum(['1h', '24h', '7d', '30d', 'permanent']).optional(),
});

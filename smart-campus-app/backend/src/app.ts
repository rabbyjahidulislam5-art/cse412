import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { requestLogger, errorHandler, notFound } from './middleware/errorHandler.middleware';
import { globalLimiter } from './middleware/rateLimit.middleware';
import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import walletRoutes from './routes/wallet.routes';
import fineRoutes from './routes/fine.routes';
import adminRoutes from './routes/admin.routes';
import libraryRoutes from './routes/library.routes';
import shopRoutes from './routes/shop.routes';
import paymentRoutes from './routes/payment.routes';

const app = express();

// Security
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: function (origin, callback) {
    // Allow all origins for now to prevent CORS issues
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV !== 'test') app.use(morgan('combined'));

// Rate limiting
app.use('/api/', globalLimiter);

// Request logger for audit
app.use(requestLogger);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// API Routes v1
const v1 = '/api/v1';
app.use(`${v1}/auth`, authRoutes);
app.use(`${v1}/student`, studentRoutes);
app.use(`${v1}/wallet`, walletRoutes);
app.use(`${v1}/fines`, fineRoutes);
app.use(`${v1}/admin`, adminRoutes);
app.use(`${v1}/library`, libraryRoutes);
app.use(`${v1}/shop`, shopRoutes);
app.use(`${v1}/payments`, paymentRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;

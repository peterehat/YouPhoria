// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { healthRouter } from './routes/health';
import { apiRouter } from './routes/api';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
// Allow all origins in development for React Native/Expo
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.CORS_ORIGINS?.split(',') || [])
    : true, // Allow all origins in development for React Native/Expo
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging
app.use(requestLogger);

// Health check endpoint
app.use('/health', healthRouter);

// API routes
app.use('/api/v1', apiRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Error handling middleware
app.use(errorHandler);

// Configuration check
function checkConfiguration() {
  const issues = [];
  
  if (!process.env.SUPABASE_URL) {
    issues.push('❌ SUPABASE_URL is not set');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    issues.push('❌ SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  if (!process.env.GEMINI_API_KEY) {
    issues.push('❌ GEMINI_API_KEY is not set');
  }
  
  if (issues.length > 0) {
    logger.error('⚠️  CONFIGURATION ERRORS:');
    issues.forEach(issue => logger.error(issue));
    logger.error('');
    logger.error('📝 Please create a .env file in the backend directory with:');
    logger.error('   - SUPABASE_URL');
    logger.error('   - SUPABASE_SERVICE_ROLE_KEY (from Supabase Dashboard → Settings → API)');
    logger.error('   - GEMINI_API_KEY (from https://makersuite.google.com/app/apikey)');
    logger.error('');
    logger.error('📖 See backend/ENV_SETUP_INSTRUCTIONS.md for detailed setup guide');
    logger.error('');
  } else {
    logger.info('✅ All required environment variables are set');
  }
  
  return issues.length === 0;
}

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 CORS origins: ${corsOptions.origin}`);
  logger.info('');
  
  // Check configuration
  const configOk = checkConfiguration();
  if (!configOk) {
    logger.warn('⚠️  Server started but chat functionality will NOT work until configuration is fixed!');
  }
});

export default app;

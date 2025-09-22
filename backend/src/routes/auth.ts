import { Router } from 'express';
import { authController } from '../controllers/authController';
import { asyncHandler } from '../middleware/errorHandler';

export const authRouter = Router();

// Authentication routes
authRouter.post('/register', asyncHandler(authController.register));
authRouter.post('/login', asyncHandler(authController.login));
authRouter.post('/logout', asyncHandler(authController.logout));
authRouter.post('/refresh', asyncHandler(authController.refreshToken));
authRouter.post('/forgot-password', asyncHandler(authController.forgotPassword));
authRouter.post('/reset-password', asyncHandler(authController.resetPassword));
authRouter.get('/verify-email/:token', asyncHandler(authController.verifyEmail));
authRouter.post('/resend-verification', asyncHandler(authController.resendVerification));

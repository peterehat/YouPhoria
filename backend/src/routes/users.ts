import { Router } from 'express';
import { userController } from '../controllers/userController';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

export const userRouter = Router();

// Public routes
userRouter.get('/profile/:id', asyncHandler(userController.getPublicProfile));

// Protected routes - require authentication
userRouter.use(authenticate); // Apply authentication middleware to all routes below

userRouter.get('/me', asyncHandler(userController.getCurrentUser));
userRouter.put('/me', asyncHandler(userController.updateCurrentUser));
userRouter.delete('/me', asyncHandler(userController.deleteCurrentUser));
userRouter.post('/change-password', asyncHandler(userController.changePassword));
userRouter.get('/dashboard', asyncHandler(userController.getDashboard));

// Admin routes - require admin role
userRouter.get('/', asyncHandler(userController.getAllUsers)); // Admin only
userRouter.get('/:id', asyncHandler(userController.getUserById)); // Admin only
userRouter.put('/:id', asyncHandler(userController.updateUser)); // Admin only
userRouter.delete('/:id', asyncHandler(userController.deleteUser)); // Admin only

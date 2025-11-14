import { Router } from 'express';
import { authRouter } from './auth';
import { userRouter } from './users';
import { chatRouter } from './chat';

export const apiRouter = Router();

// Mount route modules
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/chat', chatRouter);

// API info endpoint
apiRouter.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'YouPhoria API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      chat: '/api/v1/chat',
      health: '/health',
    },
    documentation: '/api/v1/docs', // Future Swagger docs
  });
});

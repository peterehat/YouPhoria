import { Router } from 'express';
import { authRouter } from './auth';
import { userRouter } from './users';
import { chatRouter } from './chat';
import { uploadRouter } from './upload';

export const apiRouter = Router();

// Mount route modules
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/chat', chatRouter);
apiRouter.use('/upload', uploadRouter);

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
      upload: '/api/v1/upload',
      health: '/health',
    },
    documentation: '/api/v1/docs', // Future Swagger docs
  });
});

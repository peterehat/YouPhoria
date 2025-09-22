import { Router } from 'express';
import { authRouter } from './auth';
import { userRouter } from './users';

export const apiRouter = Router();

// Mount route modules
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);

// API info endpoint
apiRouter.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'YouPhoria API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      health: '/health',
    },
    documentation: '/api/v1/docs', // Future Swagger docs
  });
});

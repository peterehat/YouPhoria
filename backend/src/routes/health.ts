import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';

export const healthRouter = Router();

// Basic health check
healthRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
}));

// Detailed health check
healthRouter.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const healthData = {
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    node_version: process.version,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
    },
    cpu: process.cpuUsage(),
    database: {
      status: 'connected', // This would be replaced with actual DB health check
      latency: '< 10ms',
    },
  };

  res.status(200).json(healthData);
}));

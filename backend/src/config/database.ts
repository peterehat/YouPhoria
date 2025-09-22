import mysql from 'mysql2/promise';
import { logger } from '../utils/logger';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

const config: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'monorepo_app',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

let pool: mysql.Pool;

export const createDatabasePool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    logger.info('Database pool created', {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
    });
  }
  return pool;
};

export const getDatabase = () => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call createDatabasePool() first.');
  }
  return pool;
};

export const testDatabaseConnection = async () => {
  try {
    const connection = await getDatabase().getConnection();
    await connection.ping();
    connection.release();
    logger.info('Database connection test successful');
    return true;
  } catch (error) {
    logger.error('Database connection test failed:', error);
    return false;
  }
};

// Initialize pool on module load for development
const initializedPool = createDatabasePool();

export default initializedPool;

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BACKEND_PORT: z.string().transform(Number).default('3001'),
  BACKEND_HOST: z.string().default('localhost'),
  FRONTEND_HOST: z.string().default('localhost'),
  FRONTEND_PORT: z.string().default('3000'),
  PROD_FRONTEND_URL: z.string().optional(),
  PROD_BACKEND_URL: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
});

const env = envSchema.parse(process.env);

export const config = {
  env: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  server: {
    port: env.BACKEND_PORT,
    host: env.BACKEND_HOST,
  },
  client: {
    url: env.NODE_ENV === 'development'
      ? `http://${env.FRONTEND_HOST}:${env.FRONTEND_PORT}`
      : env.PROD_FRONTEND_URL,
  },
  logging: {
    level: env.LOG_LEVEL,
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
  },
} as const;

export type Config = typeof config; 
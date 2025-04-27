import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/config';
import { logger } from './utils/logger';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import quoteRoutes from './routes/quoteRoutes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.client.url,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max
});
app.use(limiter);

// Request logging
app.use(requestLogger);

// Routes
app.use('/api/quotes', quoteRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(config.server.port, config.server.host, () => {
  const serverUrl = config.isDevelopment
    ? `http://${config.server.host}:${config.server.port}`
    : config.server.host;
  logger.info(`Server running in ${config.env} mode at ${serverUrl}`);
}); 
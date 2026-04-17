import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth.js';
import { projectsRouter } from './routes/projects.js';
import { pipelineRouter } from './routes/pipeline.js';
import { coversRouter } from './routes/covers.js';
import { biographyRouter } from './routes/biography.js';
import { productionRouter } from './routes/production.js';
import { billingRouter } from './routes/billing.js';
import { socialRouter } from './routes/social.js';
import { blogRouter } from './routes/blog.js';
import { marketplaceRouter } from './routes/marketplace.js';
import { royaltiesRouter } from './routes/royalties.js';
import { analyticsRouter } from './routes/analytics.js';
import { featuresRouter } from './routes/features.js';
import { collaborationRouter } from './routes/collaboration.js';
import { publicApiRouter, apiKeysManagementRouter } from './routes/public-api.js';

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));
// Raw body for Stripe webhooks (must be before json parser)
app.use('/api/billing/webhook/stripe', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI rate limit exceeded. Try again in a minute.' },
});

app.use(globalLimiter);

// --- Health ---
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'manuscry-api',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// --- Routes ---
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/pipeline', aiLimiter, pipelineRouter);
app.use('/api/covers', aiLimiter, coversRouter);
app.use('/api/biography', aiLimiter, biographyRouter);
app.use('/api/production', productionRouter);
app.use('/api/billing', billingRouter);
app.use('/api/social', aiLimiter, socialRouter);
app.use('/api/blog', blogRouter);
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/royalties', royaltiesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/features', featuresRouter);
app.use('/api/collab', collaborationRouter);
app.use('/api/api-keys', apiKeysManagementRouter);
app.use('/v1', publicApiRouter);

// --- 404 handler ---
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// --- Global error handler ---
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Error]', err.message, err.stack);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`Manuscry API running on http://localhost:${PORT}`);
});

export default app;

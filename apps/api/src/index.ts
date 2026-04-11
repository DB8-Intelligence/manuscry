import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth.js';
import { projectsRouter } from './routes/projects.js';
import { pipelineRouter } from './routes/pipeline.js';

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

// --- Health ---
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'manuscry-api', version: '1.0.0' });
});

// --- Routes ---
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/pipeline', pipelineRouter);

// Placeholder routes for future modules
app.use('/api/covers', (_req, res) => res.status(501).json({ error: 'Not implemented yet' }));
app.use('/api/biography', (_req, res) => res.status(501).json({ error: 'Not implemented yet' }));
app.use('/api/production', (_req, res) => res.status(501).json({ error: 'Not implemented yet' }));
app.use('/api/billing', (_req, res) => res.status(501).json({ error: 'Not implemented yet' }));

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

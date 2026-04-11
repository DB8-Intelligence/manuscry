import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth.js';
import { projectsRouter } from './routes/projects.js';
import { pipelineRouter } from './routes/pipeline/phase0.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Routes
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'manuscry-api' });
});

app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/pipeline', pipelineRouter);

app.listen(PORT, () => {
  console.log(`Manuscry API running on http://localhost:${PORT}`);
});

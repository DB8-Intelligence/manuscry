import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

export const productionRouter = Router();

productionRouter.use(requireAuth);

// Stub — Phase 5c/5d/5e production (Weeks 5-6)
productionRouter.post('/build', (_req, res) => {
  res.status(501).json({
    error: 'Not implemented yet',
    module: 'production',
    eta: 'Weeks 5-6',
  });
});

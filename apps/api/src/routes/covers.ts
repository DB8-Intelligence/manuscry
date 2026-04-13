import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

export const coversRouter = Router();

coversRouter.use(requireAuth);

// Stub — Phase 5a cover generation (Week 4)
coversRouter.post('/generate', (_req, res) => {
  res.status(501).json({
    error: 'Not implemented yet',
    module: 'covers',
    eta: 'Week 4',
  });
});

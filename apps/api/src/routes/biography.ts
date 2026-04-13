import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

export const biographyRouter = Router();

biographyRouter.use(requireAuth);

// Stub — Phase 5b author biography (Week 4)
biographyRouter.post('/generate', (_req, res) => {
  res.status(501).json({
    error: 'Not implemented yet',
    module: 'biography',
    eta: 'Week 4',
  });
});

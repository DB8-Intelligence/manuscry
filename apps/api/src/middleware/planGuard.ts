import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './auth.js';

export type PlanTier = 'trial' | 'starter' | 'pro' | 'publisher';

/**
 * Factory that returns a middleware restricting access to the specified plans.
 * Responds with 403 and an upgrade_url when the user's plan is not allowed.
 */
export function requirePlan(allowed: PlanTier[]) {
  return function planGuard(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void {
    const plan = (req.user?.plan || 'trial') as PlanTier;
    if (!allowed.includes(plan)) {
      res.status(403).json({
        error: 'Plan upgrade required',
        current_plan: plan,
        required_plans: allowed,
        upgrade_url: `${process.env.FRONTEND_URL || ''}/settings/billing`,
      });
      return;
    }
    next();
  };
}

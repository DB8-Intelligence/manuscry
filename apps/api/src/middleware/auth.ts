import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../services/supabase.js';

export interface AuthUser {
  id: string;
  email: string;
  plan: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  userId?: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  const token = authHeader.slice(7);

  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_ANON_KEY || '',
  );

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  // Fetch user profile for plan info
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('plan')
    .eq('id', data.user.id)
    .single();

  req.user = {
    id: data.user.id,
    email: data.user.email || '',
    plan: profile?.plan || 'trial',
  };
  req.userId = data.user.id;

  next();
}

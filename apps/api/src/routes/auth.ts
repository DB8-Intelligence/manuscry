import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../services/supabase.js';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const { email, password, full_name } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    res.status(400).json({ error: authError.message });
    return;
  }

  // Insert into public.users table
  const { error: profileError } = await supabaseAdmin
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      full_name: full_name || null,
    });

  if (profileError) {
    console.error('Failed to create user profile:', profileError);
  }

  // Sign in to get session token
  const anonClient = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_ANON_KEY || '',
  );

  const { data: session, error: loginError } = await anonClient.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) {
    res.status(500).json({ error: 'Account created but login failed' });
    return;
  }

  res.status(201).json({
    user: { id: authData.user.id, email },
    session: session.session,
  });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const anonClient = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_ANON_KEY || '',
  );

  const { data, error } = await anonClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    res.status(401).json({ error: error.message });
    return;
  }

  res.json({
    user: { id: data.user.id, email: data.user.email },
    session: data.session,
  });
});

import crypto from 'crypto';
import { supabaseAdmin } from './supabase.js';
import type { PublicApiKey, ApiKeyCreated, ApiKeyScope } from '@manuscry/shared';

const KEY_PREFIX = 'msc_live_';

export function generateApiKey(): { fullKey: string; prefix: string; hash: string } {
  const randomPart = crypto.randomBytes(24).toString('base64url');
  const fullKey = `${KEY_PREFIX}${randomPart}`;
  const prefix = fullKey.slice(0, 12);
  const hash = crypto.createHash('sha256').update(fullKey).digest('hex');
  return { fullKey, prefix, hash };
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export async function createApiKey(
  userId: string,
  name: string,
  scopes: ApiKeyScope[],
  expiresAt: string | null,
): Promise<ApiKeyCreated> {
  const { fullKey, prefix, hash } = generateApiKey();

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('author_profile')
    .eq('id', userId)
    .single();

  const profile = (user?.author_profile || {}) as Record<string, unknown>;
  const keys = (profile.api_keys || []) as PublicApiKey[];

  const newKey: PublicApiKey = {
    id: crypto.randomUUID(),
    user_id: userId,
    name,
    key_prefix: prefix,
    key_hash: hash,
    scopes,
    rate_limit_per_minute: 60,
    last_used_at: null,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
    revoked: false,
  };

  keys.push(newKey);
  await supabaseAdmin
    .from('users')
    .update({ author_profile: { ...profile, api_keys: keys } })
    .eq('id', userId);

  return {
    id: newKey.id,
    user_id: userId,
    name,
    key_prefix: prefix,
    scopes,
    rate_limit_per_minute: 60,
    last_used_at: null,
    expires_at: expiresAt,
    created_at: newKey.created_at,
    revoked: false,
    full_key: fullKey,
  };
}

export async function validateApiKey(
  key: string,
): Promise<{ userId: string; scopes: ApiKeyScope[]; keyId: string } | null> {
  if (!key.startsWith(KEY_PREFIX)) return null;
  const hash = hashApiKey(key);

  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, author_profile');

  if (!users) return null;

  for (const user of users) {
    const profile = (user.author_profile || {}) as Record<string, unknown>;
    const keys = (profile.api_keys || []) as PublicApiKey[];
    const found = keys.find((k) => k.key_hash === hash && !k.revoked);

    if (found) {
      if (found.expires_at && new Date(found.expires_at) < new Date()) return null;

      found.last_used_at = new Date().toISOString();
      await supabaseAdmin
        .from('users')
        .update({ author_profile: { ...profile, api_keys: keys } })
        .eq('id', user.id);

      return { userId: user.id, scopes: found.scopes, keyId: found.id };
    }
  }

  return null;
}

export async function revokeApiKey(userId: string, keyId: string): Promise<boolean> {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('author_profile')
    .eq('id', userId)
    .single();

  const profile = (user?.author_profile || {}) as Record<string, unknown>;
  const keys = (profile.api_keys || []) as PublicApiKey[];
  const key = keys.find((k) => k.id === keyId);
  if (!key) return false;

  key.revoked = true;
  await supabaseAdmin
    .from('users')
    .update({ author_profile: { ...profile, api_keys: keys } })
    .eq('id', userId);

  return true;
}

export async function listApiKeys(userId: string): Promise<PublicApiKey[]> {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('author_profile')
    .eq('id', userId)
    .single();

  const profile = (user?.author_profile || {}) as Record<string, unknown>;
  const keys = (profile.api_keys || []) as PublicApiKey[];
  return keys.filter((k) => !k.revoked).map((k) => ({ ...k, key_hash: '***' }));
}

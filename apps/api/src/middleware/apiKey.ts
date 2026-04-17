import type { Request, Response, NextFunction } from 'express';
import { validateApiKey } from '../services/apikey.service.js';
import type { ApiKeyScope } from '@manuscry/shared';

export interface ApiKeyRequest extends Request {
  apiKeyUserId?: string;
  apiKeyScopes?: ApiKeyScope[];
  apiKeyId?: string;
}

export async function requireApiKey(
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  const key = header?.startsWith('Bearer ') ? header.slice(7) : (req.headers['x-api-key'] as string);

  if (!key) {
    res.status(401).json({
      error: 'Missing API key',
      hint: 'Use Authorization: Bearer msc_live_... or X-API-Key header',
    });
    return;
  }

  const validation = await validateApiKey(key);
  if (!validation) {
    res.status(401).json({ error: 'Invalid or expired API key' });
    return;
  }

  req.apiKeyUserId = validation.userId;
  req.apiKeyScopes = validation.scopes;
  req.apiKeyId = validation.keyId;
  next();
}

export function requireScope(scope: ApiKeyScope) {
  return (req: ApiKeyRequest, res: Response, next: NextFunction): void => {
    if (!req.apiKeyScopes?.includes(scope)) {
      res.status(403).json({
        error: 'Insufficient scope',
        required: scope,
        granted: req.apiKeyScopes || [],
      });
      return;
    }
    next();
  };
}

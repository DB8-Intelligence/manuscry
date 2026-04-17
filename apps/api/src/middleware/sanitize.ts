import type { Request, Response, NextFunction } from 'express';

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /javascript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /<!--[\s\S]*?-->/g,
];

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    let cleaned = value;
    for (const pattern of DANGEROUS_PATTERNS) {
      cleaned = cleaned.replace(pattern, '');
    }
    return cleaned;
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = sanitizeValue(v);
    }
    return result;
  }
  return value;
}

export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  next();
}

export function sanitizeHtml(html: string): string {
  const ALLOWED_TAGS = ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'blockquote', 'hr', 'span', 'div'];
  let cleaned = html;
  for (const pattern of DANGEROUS_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  cleaned = cleaned.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag) => {
    if (ALLOWED_TAGS.includes(tag.toLowerCase())) {
      if (match.startsWith('</')) return `</${tag.toLowerCase()}>`;
      if (tag.toLowerCase() === 'a') {
        const href = match.match(/href="([^"]*)"/);
        return href ? `<a href="${href[1]}" rel="noopener noreferrer" target="_blank">` : `<a>`;
      }
      return `<${tag.toLowerCase()}>`;
    }
    return '';
  });
  return cleaned;
}

import { randomBytes, scrypt, timingSafeEqual, createHmac, createCipheriv, createDecipheriv } from 'node:crypto';
import { promisify } from 'node:util';
const derive = promisify(scrypt);
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = await derive(password, salt, 64) as Buffer;
  return `scrypt:${salt}:${hash.toString('hex')}`;
}
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [, salt, expected] = stored.split(':');
  const hash = await derive(password, salt, 64) as Buffer;
  const target = Buffer.from(expected, 'hex');
  return hash.length === target.length && timingSafeEqual(hash, target);
}
export function tokenHash(token: string, secret: string) { return createHmac('sha256', secret).update(token).digest('hex'); }
export function encrypt(value: unknown, key: string, context: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  cipher.setAAD(Buffer.from(context));
  const body = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), body.toString('base64')].join('.');
}
export function decrypt(value: string, key: string, context: string): any {
  const [version, iv, tag, body] = value.split('.');
  if (version !== 'v1') throw new Error('Unknown encryption format');
  const cipher = createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), Buffer.from(iv, 'base64'));
  cipher.setAAD(Buffer.from(context)); cipher.setAuthTag(Buffer.from(tag, 'base64'));
  return JSON.parse(Buffer.concat([cipher.update(Buffer.from(body, 'base64')), cipher.final()]).toString('utf8'));
}

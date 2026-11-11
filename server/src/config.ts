import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().min(0).max(65535).default(4000),
  DATABASE_PATH: z.string().default('./data/ruralcare.sqlite'),
  AUTH_SECRET: z.string().min(32),
  RECORD_ENCRYPTION_KEY: z.string().regex(/^[a-fA-F0-9]{64}$/),
  FRONTEND_ORIGINS: z.string().default('http://localhost:5173'),
  SESSION_HOURS: z.coerce.number().int().min(1).max(168).default(12),
  STUN_URLS: z.string().default('stun:stun.l.google.com:19302'),
  TURN_URLS: z.string().default(''), TURN_USERNAME: z.string().default(''), TURN_PASSWORD: z.string().default(''),
  GEMINI_API_KEY: z.string().default(''),
  OPENAI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default('gemini-3.5-flash'),
  GEMINI_TTS_MODEL: z.string().default('gemini-3.8-flash-tts'),
  GEMINI_LIVE_URL: z.string().default('wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent'),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
});
export type Config = z.infer<typeof schema>;
export function readConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const config = schema.parse(env);
  if (config.TURN_URLS && (!config.TURN_USERNAME || !config.TURN_PASSWORD)) throw new Error('TURN credentials are required when TURN_URLS is set');
  return config;
}

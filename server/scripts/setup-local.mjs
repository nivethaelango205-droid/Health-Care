import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
if (existsSync('.env')) {
  console.log('Existing .env preserved.');
} else {
  let env = readFileSync('.env.example', 'utf8');
  for (const key of ['AUTH_SECRET', 'RECORD_ENCRYPTION_KEY', 'DEMO_PATIENT_PASSWORD', 'DEMO_DOCTOR_PASSWORD', 'DEMO_ADMIN_PASSWORD']) {
    env = env.replace(new RegExp(`^${key}=$`, 'm'), `${key}=${randomBytes(32).toString('hex')}`);
  }
  writeFileSync('.env', env, { mode: 0o600, flag: 'wx' });
  console.log('Created private .env with unique local secrets and demo passwords.');
}

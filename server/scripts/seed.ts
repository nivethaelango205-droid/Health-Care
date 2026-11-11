import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { readConfig } from '../src/config.js';
import { Database } from '../src/db.js';
import { hashPassword } from '../src/security.js';

const config = readConfig();
if (config.NODE_ENV !== 'development') throw new Error('Demo seeding is allowed only in development');
const demo = [
  { email: 'patient@demo.ruralcare.test', name: 'Demo Patient Asha', role: 'patient', key: 'DEMO_PATIENT_PASSWORD' },
  { email: 'doctor@demo.ruralcare.test', name: 'Dr. Demo Meera', role: 'doctor', key: 'DEMO_DOCTOR_PASSWORD' },
  { email: 'admin@demo.ruralcare.test', name: 'Demo Administrator', role: 'admin', key: 'DEMO_ADMIN_PASSWORD' },
] as const;
const db = new Database(config.DATABASE_PATH);
try {
  for (const account of demo) {
    const value = z.string().min(12).max(128).parse(process.env[account.key]);
    if (db.one('SELECT id FROM users WHERE email=?', account.email)) { console.log(`Preserved existing account: ${account.email}`); continue; }
    const hashed = await hashPassword(value); const userId = randomUUID();
    db.transaction(() => {
      db.run('INSERT INTO users VALUES(?,?,?,?,?,?)', userId, account.name, account.email, hashed, account.role, new Date().toISOString());
      if (account.role === 'patient') db.run('INSERT INTO patients VALUES(?)', userId);
      if (account.role === 'doctor') db.run('INSERT INTO doctors VALUES(?,?,?)', userId, 'General Medicine (fictional demo)', 1);
    });
    console.log(`Created fictional ${account.role}: ${account.email}; password comes from ${account.key} in private .env`);
  }
} finally { db.close(); }

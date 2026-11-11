# RuralCare 360 backend setup

Backend directory: `D:\Rural health Care\server`. The brief's `C:\Rural Health Care` path was absent. No frontend, Vite or frontend package files were modified. Requires Node.js 24+, npm and no Docker/WSL. SQLite uses Node's built-in node:sqlite; no native database addon build is needed. Backend dependencies are isolated in server/package.json with a package lock.

## PowerShell

The current workspace includes a checksum-verified portable Node 24.21.0 under `.tools`. In a fresh terminal:

```powershell
Set-Location 'D:\Rural health Care\server'
$env:PATH = 'D:\Rural health Care\.tools\node-v24.21.0-win-x64;' + $env:PATH
npm.cmd ci
npm.cmd run setup:local
npm.cmd run seed
npm.cmd run typecheck
npm.cmd run build
npm.cmd start
```

If Node 24+ is already installed, omit the PATH line. If npm flags an esbuild install-script approval, inspect its package and use `npm.cmd install-scripts approve esbuild` as required by your npm installation policy. Development mode: `npm.cmd run dev`. Test command: `npm.cmd test`.

`setup:local` generates independent random auth/encryption secrets and demo passwords into an ignored `.env`; preserves existing .env. Never commit it. `.env.example` contains placeholders only. The seed runs ONLY with NODE_ENV=development, inserts missing fictional accounts, preserves existing users/passwords and prints emails without passwords. To log in, read the corresponding DEMO_*_PASSWORD value privately from server/.env:

| Role | Email | Password variable |
|---|---|---|
| Patient | patient@demo.ruralcare.test | DEMO_PATIENT_PASSWORD |
| Doctor | doctor@demo.ruralcare.test | DEMO_DOCTOR_PASSWORD |
| Admin | admin@demo.ruralcare.test | DEMO_ADMIN_PASSWORD |

Do not expose passwords in screenshots, repository commits or public demonstrations. The fictional doctor is marked verified for the prototype, with no configured availability restriction; booking checks conflicts. Seed creates accounts only, no fabricated consultations or clinical records.

## URLs and environment

- Server: `http://127.0.0.1:4000`
- Health: `http://127.0.0.1:4000/api/health`
- Socket.IO: same server, `/socket.io`
- Database: `server/data/ruralcare.sqlite`, with WAL/SHM companion files while open.

PORT and HOST control binding (default local loopback). DATABASE_PATH is relative to the server working directory; use an absolute path for services. AUTH_SECRET requires >=32 characters. RECORD_ENCRYPTION_KEY requires exactly 64 hexadecimal characters. FRONTEND_ORIGINS is a comma-separated allowlist. SESSION_HOURS defaults to 12. TURN settings are documented in WEBRTC_SIGNALING_CONTRACT.md.

Authentication uses scrypt password hashing with random salts. Tokens are random 256-bit opaque bearer values; SQLite stores only HMAC digests. Logout revokes persisted sessions. APIs use validation, parameterized queries, helmet, no-store responses, payload limits and rate limits. Clinical and ambulance sensitive fields use AES-256-GCM. This is a local prototype; external deployment requires TLS, trusted doctor provisioning, protected key and database backups, operational access controls and testing on the target network.

## Migrations and data preservation

Schema migration 1 is in server/src/db.ts and tracked in schema_migrations. Startup applies it only once inside a transaction. WAL, foreign keys and busy_timeout are enabled. Tables: users, patients, doctors, doctor_availability, appointments, consultations, health_records, ambulance_requests, sessions. No startup reset or deletion occurs. Re-running seed does not overwrite accounts. Keep encryption keys with a secured backup; losing the key makes encrypted records unrecoverable. Back up SQLite through a SQLite-aware backup procedure or after stopping the server; do not copy an active main file alone and omit WAL data.

## Validation

`npm.cmd test` creates a separate temporary SQLite database with random secrets and fictional accounts, starts a real HTTP/Socket.IO server on an ephemeral port, and exercises:

- Startup/health and actual database failure response.
- Registration, patient/doctor/admin login, role denial, session logout/revocation.
- Appointment overlap prevention, availability, doctor confirmation, confirmed PDF binary download and privacy.
- Consultation transitions, encrypted health record create/update/read, unrelated patient/doctor/admin denial.
- Ambulance persistence, own-request privacy, admin review and internal statuses.
- Two authenticated Socket.IO clients exchanging offer/answer/ICE, join/leave/disconnect, unauthorized joins and completed-room denial.
- Database restart persistence and absence of plaintext clinical fixtures in stored bytes.

Tests do not touch the development database. `npm.cmd run smoke` verifies health and the three seeded roles against the running development server without printing secrets; it creates and revokes test sessions. See BACKEND_TEST_RESULTS.md for actual run evidence and limits. Actual browser video, cross-network NAT traversal and optional TURN remain integration work for Antigravity.

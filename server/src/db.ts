import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export type Row = Record<string, any>;
export class Database {
  readonly raw: DatabaseSync;
  private closed = false;
  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(resolve(path)), { recursive: true });
    this.raw = new DatabaseSync(path);
    this.raw.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
    this.raw.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)');
    if (!this.one('SELECT version FROM schema_migrations WHERE version = 1')) {
      this.transaction(() => {
        this.raw.exec(`
          CREATE TABLE users (
            id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
            password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('patient','doctor','admin')),
            created_at TEXT NOT NULL
          );
          CREATE TABLE patients (user_id TEXT PRIMARY KEY REFERENCES users(id));
          CREATE TABLE doctors (
            user_id TEXT PRIMARY KEY REFERENCES users(id), specialty TEXT NOT NULL,
            verified INTEGER NOT NULL DEFAULT 0 CHECK(verified IN (0,1))
          );
          CREATE TABLE doctor_availability (
            id TEXT PRIMARY KEY, doctor_id TEXT NOT NULL REFERENCES doctors(user_id),
            starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, CHECK(ends_at > starts_at),
            UNIQUE(doctor_id, starts_at)
          );
          CREATE TABLE appointments (
            id TEXT PRIMARY KEY, number TEXT NOT NULL UNIQUE,
            patient_id TEXT NOT NULL REFERENCES patients(user_id), doctor_id TEXT NOT NULL REFERENCES doctors(user_id),
            starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, mode TEXT NOT NULL CHECK(mode IN ('video','in_person')),
            status TEXT NOT NULL CHECK(status IN ('pending','confirmed','cancelled','completed')),
            created_at TEXT NOT NULL, updated_at TEXT NOT NULL, CHECK(ends_at > starts_at)
          );
          CREATE INDEX appointment_doctor_slot ON appointments(doctor_id, starts_at, ends_at);
          CREATE INDEX appointment_patient ON appointments(patient_id);
          CREATE TABLE consultations (
            id TEXT PRIMARY KEY, appointment_id TEXT NOT NULL UNIQUE REFERENCES appointments(id),
            patient_id TEXT NOT NULL REFERENCES patients(user_id), doctor_id TEXT NOT NULL REFERENCES doctors(user_id),
            status TEXT NOT NULL CHECK(status IN ('scheduled','in_progress','completed')),
            created_at TEXT NOT NULL, updated_at TEXT NOT NULL
          );
          CREATE TABLE health_records (
            id TEXT PRIMARY KEY, consultation_id TEXT NOT NULL UNIQUE REFERENCES consultations(id),
            patient_id TEXT NOT NULL REFERENCES patients(user_id), doctor_id TEXT NOT NULL REFERENCES doctors(user_id),
            consultation_date TEXT NOT NULL, clinical_ciphertext TEXT NOT NULL,
            created_at TEXT NOT NULL, updated_at TEXT NOT NULL
          );
          CREATE INDEX record_patient ON health_records(patient_id);
          CREATE TABLE ambulance_requests (
            id TEXT PRIMARY KEY, patient_id TEXT NOT NULL REFERENCES patients(user_id),
            details_ciphertext TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('submitted','acknowledged','closed')),
            created_at TEXT NOT NULL, updated_at TEXT NOT NULL
          );
          CREATE TABLE sessions (
            token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
            expires_at TEXT NOT NULL, created_at TEXT NOT NULL
          );
          CREATE INDEX session_expiry ON sessions(expires_at);
        `);
        this.run('INSERT INTO schema_migrations VALUES(1, ?)', new Date().toISOString());
      });
    }
    if (!this.one('SELECT version FROM schema_migrations WHERE version = 2')) {
      this.transaction(() => {
        this.raw.exec(`
          CREATE TABLE IF NOT EXISTS ambulances (
            id TEXT PRIMARY KEY,
            registration_number TEXT NOT NULL UNIQUE,
            service_name TEXT NOT NULL,
            driver_name TEXT NOT NULL,
            driver_phone TEXT NOT NULL,
            vehicle_type TEXT NOT NULL CHECK(vehicle_type IN ('BLS','ALS','Patient Transport')),
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            is_available INTEGER NOT NULL DEFAULT 1,
            last_updated TEXT NOT NULL
          );
          CREATE TABLE IF NOT EXISTS ambulance_tracking (
            request_id TEXT PRIMARY KEY REFERENCES ambulance_requests(id),
            ambulance_id TEXT REFERENCES ambulances(id),
            driver_name TEXT,
            driver_phone TEXT,
            vehicle_number TEXT,
            current_latitude REAL,
            current_longitude REAL,
            heading REAL,
            speed_kmh REAL,
            eta_minutes INTEGER,
            status TEXT NOT NULL CHECK(status IN ('pending','assigned','en_route','arrived','completed','cancelled')),
            last_location_time TEXT,
            updated_at TEXT NOT NULL
          );
        `);
        const now = new Date().toISOString();
        this.run(
          'INSERT OR IGNORE INTO ambulances VALUES(?,?,?,?,?,?,?,?,?,?)',
          'amb-phc-01', 'MP-20-AMB-1081', 'Mandla Primary Health Centre BLS',
          'Rajesh Gond', '+91 94251 10801', 'BLS', 22.6120, 80.3800, 1, now
        );
        this.run(
          'INSERT OR IGNORE INTO ambulances VALUES(?,?,?,?,?,?,?,?,?,?)',
          'amb-phc-02', 'MP-20-AMB-1082', 'District Community Health Centre ALS',
          'Suresh Patel', '+91 94251 10802', 'ALS', 22.5850, 80.3620, 1, now
        );
        this.run(
          'INSERT OR IGNORE INTO ambulances VALUES(?,?,?,?,?,?,?,?,?,?)',
          'amb-phc-03', 'MP-20-AMB-1083', 'Janani Express Rural Transport',
          'Mahesh Varma', '+91 94251 10803', 'Patient Transport', 22.6250, 80.3550, 1, now
        );
        this.run('INSERT INTO schema_migrations VALUES(2, ?)', now);
      });
    }
  }
  one(sql: string, ...params: any[]): Row | undefined { return this.raw.prepare(sql).get(...params) as Row | undefined; }
  all(sql: string, ...params: any[]): Row[] { return this.raw.prepare(sql).all(...params) as Row[]; }
  run(sql: string, ...params: any[]) { return this.raw.prepare(sql).run(...params); }
  transaction<T>(fn: () => T): T {
    this.raw.exec('BEGIN IMMEDIATE');
    try { const result = fn(); this.raw.exec('COMMIT'); return result; }
    catch (error) { this.raw.exec('ROLLBACK'); throw error; }
  }
  close() { if (!this.closed) { this.raw.close(); this.closed = true; } }
}

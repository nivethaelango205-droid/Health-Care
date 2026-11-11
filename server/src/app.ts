import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import PDFDocument from 'pdfkit';
import { z } from 'zod';
import { Server } from 'socket.io';
import type { Config } from './config.js';
import { Database, type Row } from './db.js';
import { hashPassword, verifyPassword, tokenHash, encrypt, decrypt } from './security.js';
import { ApiError, fail } from './errors.js';
import { attachSignaling } from './signaling.js';
import { assistanceChatSchema, generateAssistanceReply, generateAssistanceVoiceReply, type PatientRequestContext, type AssistantSystemContext } from './ai.js';

export type User = { id: string; name: string; email: string; role: 'patient' | 'doctor' | 'admin'; createdAt: string };
declare global { namespace Express { interface Request { user: User; sessionHash: string } } }
export function publicUser(row: Row): User { return { id: row.id, name: row.name, email: row.email, role: row.role, createdAt: row.created_at }; }
const id = z.string().uuid();
const text = z.string().trim().min(1).max(10000);
const date = z.iso.datetime({ offset: true }).transform(v => new Date(v).toISOString());
const password = z.string().min(12).max(128);
const email = z.email().max(254).transform(v => v.toLowerCase());
const now = () => new Date().toISOString();
const authSchema = z.object({ email, password: z.string().min(1).max(128) }).strict();
const clinicalSchema = z.object({ symptoms: text, clinicalNotes: text, recommendations: text });
const appointmentSchema = z.object({ doctorId: id, startsAt: date, mode: z.enum(['video', 'in_person']).default('video') }).strict();
const ambulanceSchema = z.object({
  contactNumber: z.string().trim().regex(/^\+?[0-9 ()-]{7,25}$/), pickupAddress: z.string().trim().min(5).max(1000),
  coordinates: z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) }).strict().optional(),
  ambulanceId: z.string().optional(),
}).strict();
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}
export function createBackend(config: Config) {
  const db = new Database(config.DATABASE_PATH);
  const app = express();
  const http = createServer(app);
  const origins = config.FRONTEND_ORIGINS.split(',').map(v => v.trim()).filter(Boolean);
  const io = new Server(http, { cors: { origin: origins, credentials: false }, maxHttpBufferSize: 128000,
    allowRequest: (req, callback) => callback(null, !req.headers.origin || origins.includes(req.headers.origin)) });
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: origins, credentials: false, exposedHeaders: ['Content-Disposition'] }));
  app.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.use(express.json({ limit: '64kb' }));
  app.use('/api', rateLimit({ windowMs: 60000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } } }));
  const authLimit = rateLimit({ windowMs: 15 * 60000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts' } } });
  const assistanceLimit = rateLimit({ windowMs: 60000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many assistance chat requests' } } });
  function session(token: unknown): { user: User; hash: string } {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) fail(401, 'UNAUTHENTICATED', 'Valid bearer token required');
    const hash = tokenHash(token, config.AUTH_SECRET);
    const user = db.one('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?', hash, now());
    if (!user) fail(401, 'UNAUTHENTICATED', 'Session expired or revoked');
    return { user: publicUser(user), hash };
  }
  function auth(req: Request, _res: Response, next: NextFunction) {
    const value = session(req.headers.authorization?.replace(/^Bearer /, ''));
    req.user = value.user; req.sessionHash = value.hash; next();
  }
  const roles = (...allowed: User['role'][]) => (req: Request, _res: Response, next: NextFunction) => {
    if (!allowed.includes(req.user.role)) fail(403, 'FORBIDDEN', 'Role is not permitted'); next();
  };
  function issueSession(user: Row) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + config.SESSION_HOURS * 3600000).toISOString();
    db.run('DELETE FROM sessions WHERE expires_at<=?', now());
    db.run('INSERT INTO sessions VALUES(?,?,?,?)', tokenHash(token, config.AUTH_SECRET), user.id, expiresAt, now());
    return { user: publicUser(user), token, expiresAt };
  }
  function find(table: string, value: unknown) {
    const parsed = id.parse(value);
    const row = db.one(`SELECT * FROM ${table} WHERE id=?`, parsed);
    if (!row) fail(404, 'NOT_FOUND', 'Resource not found');
    return row;
  }
  function participant(user: User, row: Row, allowAdmin = false) {
    if ((user.role === 'patient' && row.patient_id === user.id) || (user.role === 'doctor' && row.doctor_id === user.id) || (allowAdmin && user.role === 'admin')) return;
    fail(403, 'FORBIDDEN', 'Access is restricted to the assigned participants');
  }
  function verifiedDoctor(doctorId: string) {
    const doctor = db.one('SELECT * FROM doctors WHERE user_id=? AND verified=1', doctorId);
    if (!doctor) fail(409, 'DOCTOR_UNAVAILABLE', 'Doctor is not verified or does not exist');
  }
  function appointment(row: Row) {
    return { id: row.id, number: row.number, patientId: row.patient_id, doctorId: row.doctor_id,
      patientName: db.one('SELECT name FROM users WHERE id=?', row.patient_id)!.name,
      doctorName: db.one('SELECT name FROM users WHERE id=?', row.doctor_id)!.name,
      startsAt: row.starts_at, endsAt: row.ends_at, mode: row.mode, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at };
  }
  function consultation(row: Row) {
    return { id: row.id, appointmentId: row.appointment_id, patientId: row.patient_id, doctorId: row.doctor_id, status: row.status,
      healthRecordId: db.one('SELECT id FROM health_records WHERE consultation_id=?', row.id)?.id ?? null,
      createdAt: row.created_at, updatedAt: row.updated_at };
  }
  function record(row: Row) {
    return { id: row.id, patientId: row.patient_id, doctorId: row.doctor_id, consultationId: row.consultation_id,
      consultationDate: row.consultation_date, ...decrypt(row.clinical_ciphertext, config.RECORD_ENCRYPTION_KEY, `record:${row.id}`),
      createdAt: row.created_at, updatedAt: row.updated_at };
  }
  function ambulance(row: Row) {
    return { id: row.id, patientId: row.patient_id, ...decrypt(row.details_ciphertext, config.RECORD_ENCRYPTION_KEY, `ambulance:${row.id}`),
      status: row.status, createdAt: row.created_at, updatedAt: row.updated_at,
      notice: 'Internal assistance request only. This is not emergency dispatch.' };
  }
  function doctor(row: Row) {
    return { id: row.user_id, name: row.name, specialty: row.specialty, verified: Boolean(row.verified),
      availability: db.all('SELECT * FROM doctor_availability WHERE doctor_id=? AND ends_at>? ORDER BY starts_at', row.user_id, now())
        .map(a => ({ id: a.id, startsAt: a.starts_at, endsAt: a.ends_at })) };
  }
  app.get('/api/health', (_req, res) => {
    try { db.one('SELECT 1 AS ok'); res.json({ status: 'ok', api: 'up', database: 'up', timestamp: now() }); }
    catch { res.status(503).json({ status: 'degraded', api: 'up', database: 'down', timestamp: now() }); }
  });
  app.post('/api/auth/register', authLimit, async (req, res) => {
    const input = z.object({ name: z.string().trim().min(2).max(100), email, password, role: z.literal('patient').optional() }).strict().parse(req.body);
    if (db.one('SELECT id FROM users WHERE email=?', input.email)) fail(409, 'EMAIL_EXISTS', 'Email already registered');
    const hashed = await hashPassword(input.password);
    const userId = randomUUID();
    try {
      db.transaction(() => {
        db.run('INSERT INTO users VALUES(?,?,?,?,?,?)', userId, input.name, input.email, hashed, 'patient', now());
        db.run('INSERT INTO patients VALUES(?)', userId);
      });
    } catch (error) {
      if (db.one('SELECT id FROM users WHERE email=?', input.email)) fail(409, 'EMAIL_EXISTS', 'Email already registered');
      throw error;
    }
    res.status(201).json(issueSession(db.one('SELECT * FROM users WHERE id=?', userId)!));
  });
  // A valid dummy hash keeps unknown-account and wrong-password paths comparable.
  const dummyHash = hashPassword(randomBytes(32).toString('hex'));
  app.post('/api/auth/login', authLimit, async (req, res) => {
    const input = authSchema.parse(req.body);
    const user = db.one('SELECT * FROM users WHERE email=?', input.email);
    const valid = await verifyPassword(input.password, user?.password_hash ?? await dummyHash);
    if (!user || !valid) fail(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
    res.json(issueSession(user));
  });
  app.get('/api/auth/me', auth, (req, res) => res.json({ user: req.user }));
  app.post('/api/auth/logout', auth, (req, res) => {
    db.run('DELETE FROM sessions WHERE token_hash=?', req.sessionHash);
    for (const socket of io.sockets.sockets.values()) if (socket.data.sessionHash === req.sessionHash) socket.disconnect(true);
    res.status(204).end();
  });
  app.get('/api/doctors', auth, (_req, res) => res.json({ doctors: db.all('SELECT d.*, u.name FROM doctors d JOIN users u ON u.id=d.user_id ORDER BY u.name').map(doctor) }));
  app.get('/api/doctors/:id', auth, (req, res) => {
    const row = db.one('SELECT d.*, u.name FROM doctors d JOIN users u ON u.id=d.user_id WHERE d.user_id=?', id.parse(req.params.id));
    if (!row) fail(404, 'NOT_FOUND', 'Doctor not found'); res.json({ doctor: doctor(row) });
  });
  app.post('/api/appointments', auth, roles('patient'), (req, res) => {
    const input = appointmentSchema.parse(req.body);
    if (input.startsAt <= now()) fail(422, 'PAST_SLOT', 'Choose a future appointment');
    const endsAt = new Date(Date.parse(input.startsAt) + 30 * 60000).toISOString();
    const appointmentId = randomUUID();
    db.transaction(() => {
      verifiedDoctor(input.doctorId);
      const windows = db.one('SELECT id FROM doctor_availability WHERE doctor_id=? LIMIT 1', input.doctorId);
      if (windows && !db.one('SELECT id FROM doctor_availability WHERE doctor_id=? AND starts_at<=? AND ends_at>=?', input.doctorId, input.startsAt, endsAt)) fail(409, 'OUTSIDE_AVAILABILITY', 'Slot is outside configured availability');
      if (db.one("SELECT id FROM appointments WHERE (doctor_id=? OR patient_id=?) AND status IN ('pending','confirmed') AND starts_at<? AND ends_at>?", input.doctorId, req.user.id, endsAt, input.startsAt)) fail(409, 'SLOT_TAKEN', 'Patient or doctor already has an overlapping appointment');
      db.run('INSERT INTO appointments VALUES(?,?,?,?,?,?,?,?,?,?)', appointmentId, `RC360-${randomUUID().toUpperCase()}`, req.user.id, input.doctorId, input.startsAt, endsAt, input.mode, 'pending', now(), now());
    });
    res.status(201).json({ appointment: appointment(find('appointments', appointmentId)) });
  });
  app.get('/api/appointments', auth, (req, res) => {
    const rows = req.user.role === 'admin' ? db.all('SELECT * FROM appointments ORDER BY starts_at DESC') : db.all(`SELECT * FROM appointments WHERE ${req.user.role === 'patient' ? 'patient_id' : 'doctor_id'}=? ORDER BY starts_at DESC`, req.user.id);
    res.json({ appointments: rows.map(appointment) });
  });
  app.get('/api/appointments/:id', auth, (req, res) => { const row = find('appointments', req.params.id); participant(req.user, row, true); res.json({ appointment: appointment(row) }); });
  app.patch('/api/appointments/:id/status', auth, (req, res) => {
    const { status } = z.object({ status: z.enum(['confirmed', 'cancelled', 'completed']) }).strict().parse(req.body);
    const row = find('appointments', req.params.id); participant(req.user, row, true);
    if (req.user.role === 'patient' && status !== 'cancelled') fail(403, 'FORBIDDEN', 'Patients can only cancel appointments');
    if (status === 'confirmed' && req.user.role !== 'doctor') fail(403, 'FORBIDDEN', 'Only the assigned doctor can confirm');
    if (status === 'completed') fail(409, 'INVALID_TRANSITION', 'Complete the consultation to complete an appointment');
    const legal = row.status === 'pending' || (row.status === 'confirmed' && status === 'cancelled');
    if (!legal) fail(409, 'INVALID_TRANSITION', 'Appointment status transition is invalid');
    if (status === 'confirmed') { verifiedDoctor(row.doctor_id); if (row.starts_at <= now()) fail(409, 'PAST_SLOT', 'Cannot confirm a past slot'); }
    db.transaction(() => {
      if (status === 'cancelled' && db.one("SELECT id FROM consultations WHERE appointment_id=? AND status IN ('in_progress','completed')", row.id)) fail(409, 'INVALID_TRANSITION', 'An active or completed consultation cannot be cancelled');
      db.run('UPDATE appointments SET status=?, updated_at=? WHERE id=?', status, now(), row.id);
    });
    if (status === 'cancelled') {
      const c = db.one('SELECT id FROM consultations WHERE appointment_id=?', row.id);
      if (c) io.in(`consultation:${c.id}`).disconnectSockets(true);
    }
    res.json({ appointment: appointment(find('appointments', row.id)) });
  });
  app.get('/api/appointments/:id/letter', auth, (req, res) => {
    const row = find('appointments', req.params.id); participant(req.user, row, true);
    if (row.status !== 'confirmed') fail(409, 'NOT_CONFIRMED', 'A confirmation letter requires a confirmed appointment');
    const value = appointment(row);
    res.type('application/pdf').set('Content-Disposition', `attachment; filename="${value.number}.pdf"`);
    const pdf = new PDFDocument({ size: 'A4', margin: 50 });
    pdf.on('error', () => { if (!res.headersSent) res.status(500).end(); else res.destroy(); });
    pdf.pipe(res);
    pdf.fontSize(24).text('RuralCare 360').moveDown().fontSize(16).text('Appointment Confirmation Letter').moveDown();
    pdf.fontSize(12);
    const localDate = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full' }).format(new Date(value.startsAt));
    const localTime = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', timeStyle: 'short' }).format(new Date(value.startsAt));
    for (const line of [`Appointment number: ${value.number}`, `Patient: ${value.patientName}`, `Doctor: ${value.doctorName}`, `Date: ${localDate}`, `Time: ${localTime} (IST)`, `Consultation mode: ${value.mode}`, 'Confirmation status: CONFIRMED']) pdf.text(line).moveDown(0.6);
    pdf.moveDown().text('Development prototype - fictional demonstration accounts.'); pdf.end();
  });
  app.post('/api/consultations', auth, roles('patient', 'doctor'), (req, res) => {
    const input = z.object({ appointmentId: id }).strict().parse(req.body);
    const row = find('appointments', input.appointmentId); participant(req.user, row);
    if (row.status !== 'confirmed') fail(409, 'NOT_CONFIRMED', 'Appointment must be confirmed');
    if (row.mode !== 'video') fail(409, 'INVALID_MODE', 'Video consultations require a video appointment');
    verifiedDoctor(row.doctor_id);
    const existing = db.one('SELECT * FROM consultations WHERE appointment_id=?', row.id);
    if (existing) { res.json({ consultation: consultation(existing) }); return; }
    const consultationId = randomUUID();
    db.run('INSERT INTO consultations VALUES(?,?,?,?,?,?,?)', consultationId, row.id, row.patient_id, row.doctor_id, 'scheduled', now(), now());
    res.status(201).json({ consultation: consultation(find('consultations', consultationId)) });
  });
  app.get('/api/consultations/:id', auth, roles('patient', 'doctor'), (req, res) => {
    const row = find('consultations', req.params.id); participant(req.user, row); res.json({ consultation: consultation(row) });
  });
  app.patch('/api/consultations/:id', auth, roles('doctor'), (req, res) => {
    const { status } = z.object({ status: z.enum(['in_progress', 'completed']) }).strict().parse(req.body);
    const row = find('consultations', req.params.id); participant(req.user, row); verifiedDoctor(row.doctor_id);
    const appt = find('appointments', row.appointment_id);
    if (appt.status !== 'confirmed' || !((row.status === 'scheduled' && status === 'in_progress') || (row.status === 'in_progress' && status === 'completed'))) fail(409, 'INVALID_TRANSITION', 'Consultation status transition is invalid');
    db.transaction(() => {
      db.run('UPDATE consultations SET status=?,updated_at=? WHERE id=?', status, now(), row.id);
      if (status === 'completed') db.run("UPDATE appointments SET status='completed',updated_at=? WHERE id=?", now(), row.appointment_id);
    });
    if (status === 'completed') io.in(`consultation:${row.id}`).disconnectSockets(true);
    res.json({ consultation: consultation(find('consultations', row.id)) });
  });
  app.get('/api/health-records', auth, roles('patient', 'doctor'), (req, res) => {
    const rows = db.all(`SELECT * FROM health_records WHERE ${req.user.role === 'patient' ? 'patient_id' : 'doctor_id'}=? ORDER BY consultation_date DESC`, req.user.id);
    res.json({ healthRecords: rows.map(record) });
  });
  app.get('/api/health-records/:id', auth, roles('patient', 'doctor'), (req, res) => { const row = find('health_records', req.params.id); participant(req.user, row); res.json({ healthRecord: record(row) }); });
  app.post('/api/health-records', auth, roles('doctor'), (req, res) => {
    const input = clinicalSchema.extend({ patientId: id, doctorId: id, consultationId: id, consultationDate: date }).strict().parse(req.body);
    const c = find('consultations', input.consultationId); participant(req.user, c); verifiedDoctor(c.doctor_id);
    if (input.patientId !== c.patient_id || input.doctorId !== c.doctor_id) fail(422, 'PARTICIPANT_MISMATCH', 'Record participants must match the consultation');
    if (!['in_progress', 'completed'].includes(c.status)) fail(409, 'CONSULTATION_NOT_STARTED', 'Start the consultation before writing a medical record');
    if (input.consultationDate > now()) fail(422, 'FUTURE_RECORD', 'Consultation date cannot be in the future');
    if (db.one('SELECT id FROM health_records WHERE consultation_id=?', c.id)) fail(409, 'RECORD_EXISTS', 'This consultation already has a record');
    const recordId = randomUUID();
    db.run('INSERT INTO health_records VALUES(?,?,?,?,?,?,?,?)', recordId, c.id, c.patient_id, c.doctor_id, input.consultationDate,
      encrypt(clinicalSchema.parse(input), config.RECORD_ENCRYPTION_KEY, `record:${recordId}`), now(), now());
    res.status(201).json({ healthRecord: record(find('health_records', recordId)) });
  });
  app.patch('/api/health-records/:id', auth, roles('doctor'), (req, res) => {
    const input = clinicalSchema.partial().strict().refine(v => Object.keys(v).length > 0, 'At least one clinical field is required').parse(req.body);
    const row = find('health_records', req.params.id); participant(req.user, row); verifiedDoctor(row.doctor_id);
    const previous = decrypt(row.clinical_ciphertext, config.RECORD_ENCRYPTION_KEY, `record:${row.id}`);
    db.run('UPDATE health_records SET clinical_ciphertext=?,updated_at=? WHERE id=?', encrypt({ ...previous, ...input }, config.RECORD_ENCRYPTION_KEY, `record:${row.id}`), now(), row.id);
    res.json({ healthRecord: record(find('health_records', row.id)) });
  });
  app.get('/api/ambulance/nearby', (req, res) => {
    const lat = req.query.lat !== undefined ? Number(req.query.lat) : undefined;
    const lng = req.query.lng !== undefined ? Number(req.query.lng) : undefined;
    const radius = req.query.radius !== undefined ? Math.min(50, Math.max(1, Number(req.query.radius))) : 5;

    if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
      fail(422, 'INVALID_COORDINATES', 'lat and lng query parameters are required numeric values');
    }

    const allAmbulances = db.all('SELECT * FROM ambulances WHERE is_available = 1');
    const nearby = allAmbulances.map(row => {
      const distanceKm = haversineKm(lat, lng, Number(row.latitude), Number(row.longitude));
      const estimatedEtaMinutes = Math.max(1, Math.round((distanceKm / 35) * 60 + 1.5));
      return {
        id: row.id,
        registrationNumber: row.registration_number,
        serviceName: row.service_name,
        driverName: row.driver_name,
        driverPhone: row.driver_phone,
        vehicleType: row.vehicle_type,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        isAvailable: Boolean(row.is_available),
        distanceKm,
        estimatedEtaMinutes,
        lastUpdated: row.last_updated,
      };
    })
    .filter(a => a.distanceKm <= radius)
    .sort((a, b) => a.distanceKm - b.distanceKm);

    res.json({ ambulances: nearby, radiusKm: radius, patientCoordinates: { latitude: lat, longitude: lng } });
  });
  app.post('/api/ambulance/requests', auth, roles('patient'), (req, res) => {
    const input = ambulanceSchema.parse(req.body);
    const requestId = randomUUID();
    const nowTime = now();
    db.run('INSERT INTO ambulance_requests VALUES(?,?,?,?,?,?)', requestId, req.user.id,
      encrypt(input, config.RECORD_ENCRYPTION_KEY, `ambulance:${requestId}`), 'submitted', nowTime, nowTime);

    let assignedAmb: Row | undefined;
    if (input.ambulanceId) {
      assignedAmb = db.one('SELECT * FROM ambulances WHERE id=?', input.ambulanceId);
      if (assignedAmb) {
        let etaMinutes = 8;
        if (input.coordinates?.latitude && input.coordinates?.longitude) {
          const d = haversineKm(assignedAmb.latitude, assignedAmb.longitude, input.coordinates.latitude, input.coordinates.longitude);
          etaMinutes = Math.max(1, Math.round((d / 35) * 60 + 1.5));
        }
        db.run('INSERT INTO ambulance_tracking VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
          requestId, assignedAmb.id, assignedAmb.driver_name, assignedAmb.driver_phone, assignedAmb.registration_number,
          assignedAmb.latitude, assignedAmb.longitude, 0, 35, etaMinutes, 'assigned', nowTime, nowTime);
      }
    }

    const ambData = ambulance(find('ambulance_requests', requestId));
    res.status(201).json({
      ambulanceRequest: {
        ...ambData,
        assignedAmbulanceId: assignedAmb?.id,
        assignedAmbulance: assignedAmb ? {
          id: assignedAmb.id,
          registrationNumber: assignedAmb.registration_number,
          serviceName: assignedAmb.service_name,
          driverName: assignedAmb.driver_name,
          driverPhone: assignedAmb.driver_phone,
          vehicleType: assignedAmb.vehicle_type,
          latitude: Number(assignedAmb.latitude),
          longitude: Number(assignedAmb.longitude),
          isAvailable: Boolean(assignedAmb.is_available),
          lastUpdated: assignedAmb.last_updated,
        } : undefined,
        trackingStatus: assignedAmb ? 'assigned' : 'pending',
      }
    });
  });
  app.get('/api/ambulance/requests', auth, roles('patient', 'admin'), (req, res) => {
    const rows = req.user.role === 'admin' ? db.all('SELECT * FROM ambulance_requests ORDER BY created_at DESC') : db.all('SELECT * FROM ambulance_requests WHERE patient_id=? ORDER BY created_at DESC', req.user.id);
    res.json({ ambulanceRequests: rows.map(ambulance) });
  });
  app.patch('/api/ambulance/requests/:id/status', auth, roles('admin'), (req, res) => {
    const { status } = z.object({ status: z.enum(['acknowledged', 'closed']) }).strict().parse(req.body);
    const row = find('ambulance_requests', req.params.id);
    if (!((row.status === 'submitted' && status === 'acknowledged') || (['submitted', 'acknowledged'].includes(row.status) && status === 'closed'))) fail(409, 'INVALID_TRANSITION', 'Invalid assistance request transition');
    db.run('UPDATE ambulance_requests SET status=?,updated_at=? WHERE id=?', status, now(), row.id);
    res.json({ ambulanceRequest: ambulance(find('ambulance_requests', row.id)) });
  });
  app.get('/api/ambulance/tracking/:id', (req, res) => {
    const reqRow = find('ambulance_requests', req.params.id);
    const trackRow = db.one('SELECT * FROM ambulance_tracking WHERE request_id=?', req.params.id);
    let details: any = {};
    try {
      details = decrypt(reqRow.details_ciphertext, config.RECORD_ENCRYPTION_KEY, `ambulance:${reqRow.id}`);
    } catch {}

    if (!trackRow) {
      return res.json({
        tracking: {
          requestId: reqRow.id,
          status: reqRow.status === 'closed' ? 'completed' : 'pending',
          pickupAddress: details.pickupAddress,
          patientLatitude: details.coordinates?.latitude,
          patientLongitude: details.coordinates?.longitude,
          updatedAt: reqRow.updated_at,
        }
      });
    }

    const amb = trackRow.ambulance_id ? db.one('SELECT * FROM ambulances WHERE id=?', trackRow.ambulance_id) : null;
    let distanceKm: number | undefined = undefined;
    let etaMinutes = trackRow.eta_minutes !== null ? Number(trackRow.eta_minutes) : undefined;

    if (trackRow.current_latitude !== null && trackRow.current_longitude !== null && details.coordinates?.latitude && details.coordinates?.longitude) {
      distanceKm = haversineKm(Number(trackRow.current_latitude), Number(trackRow.current_longitude), Number(details.coordinates.latitude), Number(details.coordinates.longitude));
      etaMinutes = Math.max(1, Math.round((distanceKm / (Number(trackRow.speed_kmh) || 35)) * 60 + 1.5));
    }

    res.json({
      tracking: {
        requestId: trackRow.request_id,
        ambulanceId: trackRow.ambulance_id,
        driverName: trackRow.driver_name,
        driverPhone: trackRow.driver_phone,
        vehicleNumber: trackRow.vehicle_number,
        currentLatitude: trackRow.current_latitude !== null ? Number(trackRow.current_latitude) : undefined,
        currentLongitude: trackRow.current_longitude !== null ? Number(trackRow.current_longitude) : undefined,
        heading: trackRow.heading !== null ? Number(trackRow.heading) : 0,
        speedKmh: trackRow.speed_kmh !== null ? Number(trackRow.speed_kmh) : 0,
        etaMinutes,
        distanceKm,
        status: trackRow.status,
        pickupAddress: details.pickupAddress,
        patientLatitude: details.coordinates?.latitude,
        patientLongitude: details.coordinates?.longitude,
        ambulance: amb ? {
          id: amb.id,
          registrationNumber: amb.registration_number,
          serviceName: amb.service_name,
          driverName: amb.driver_name,
          driverPhone: amb.driver_phone,
          vehicleType: amb.vehicle_type,
          latitude: Number(amb.latitude),
          longitude: Number(amb.longitude),
          isAvailable: Boolean(amb.is_available),
          lastUpdated: amb.last_updated,
        } : undefined,
        lastLocationTime: trackRow.last_location_time,
        updatedAt: trackRow.updated_at,
      }
    });
  });
  app.post('/api/ambulance/tracking/:id/location', (req, res) => {
    const schema = z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      heading: z.number().min(0).max(360).optional(),
      speedKmh: z.number().min(0).max(180).optional(),
      status: z.enum(['pending', 'assigned', 'en_route', 'arrived', 'completed', 'cancelled']).optional(),
    }).strict();
    const input = schema.parse(req.body);
    const reqRow = find('ambulance_requests', req.params.id);
    const nowTime = now();

    let trackRow = db.one('SELECT * FROM ambulance_tracking WHERE request_id=?', req.params.id);
    let details: any = {};
    try {
      details = decrypt(reqRow.details_ciphertext, config.RECORD_ENCRYPTION_KEY, `ambulance:${reqRow.id}`);
    } catch {}

    let etaMinutes: number | undefined = undefined;
    let distanceKm: number | undefined = undefined;
    if (details.coordinates?.latitude && details.coordinates?.longitude) {
      distanceKm = haversineKm(input.latitude, input.longitude, Number(details.coordinates.latitude), Number(details.coordinates.longitude));
      etaMinutes = Math.max(1, Math.round((distanceKm / (input.speedKmh || 35)) * 60 + 1.5));
    }

    const nextStatus = input.status || trackRow?.status || 'en_route';

    if (!trackRow) {
      db.run(
        'INSERT INTO ambulance_tracking VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
        req.params.id, null, 'Assigned Driver', '+91 94251 10801', 'AMB-DISPATCH',
        input.latitude, input.longitude, input.heading ?? 0, input.speedKmh ?? 35,
        etaMinutes ?? 10, nextStatus, nowTime, nowTime
      );
    } else {
      db.run(
        'UPDATE ambulance_tracking SET current_latitude=?, current_longitude=?, heading=?, speed_kmh=?, eta_minutes=?, status=?, last_location_time=?, updated_at=? WHERE request_id=?',
        input.latitude, input.longitude, input.heading ?? trackRow.heading ?? 0,
        input.speedKmh ?? trackRow.speed_kmh ?? 35, etaMinutes ?? trackRow.eta_minutes,
        nextStatus, nowTime, nowTime, req.params.id
      );
    }

    const broadcastPayload = {
      requestId: req.params.id,
      currentLatitude: input.latitude,
      currentLongitude: input.longitude,
      heading: input.heading ?? trackRow?.heading ?? 0,
      speedKmh: input.speedKmh ?? trackRow?.speed_kmh ?? 35,
      distanceKm,
      etaMinutes,
      status: nextStatus,
      lastLocationTime: nowTime,
      updatedAt: nowTime,
    };

    io.to(`ambulance_track:${req.params.id}`).emit('ambulance:location_update', broadcastPayload);
    res.json({ success: true, tracking: broadcastPayload });
  });
  app.post('/api/assistance/chat', assistanceLimit, auth, async (req, res, next) => {
    try {
      const input = assistanceChatSchema.parse(req.body);
      let patientRequests: PatientRequestContext[] = [];
      let doctorAppointmentCount: number | undefined = undefined;

      if (req.user.role === 'patient') {
        const rows = db.all(
          'SELECT * FROM ambulance_requests WHERE patient_id=? ORDER BY created_at DESC LIMIT 3',
          req.user.id
        );
        patientRequests = rows.map((r) => {
          try {
            const details = decrypt(r.details_ciphertext, config.RECORD_ENCRYPTION_KEY, `ambulance:${r.id}`);
            return {
              id: r.id,
              status: r.status,
              createdAt: r.created_at,
              contactNumber: details.contactNumber,
              pickupAddress: details.pickupAddress,
            };
          } catch {
            return { id: r.id, status: r.status, createdAt: r.created_at };
          }
        });
      } else if (req.user.role === 'doctor') {
        const countRow = db.one('SELECT count(*) as count FROM appointments WHERE doctor_id=?', req.user.id);
        doctorAppointmentCount = Number(countRow?.count || 0);
      }

      const systemContext: AssistantSystemContext = {
        role: req.user.role,
        currentPage: input.currentPage,
        language: input.language,
        availableActions: input.availableActions,
        patientRequests,
        doctorAppointmentCount,
      };

      const result = await generateAssistanceReply(config, input, systemContext);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });
  app.post('/api/assistance/voice', assistanceLimit, auth, async (req, res, next) => {
    try {
      const input = assistanceChatSchema.parse(req.body);
      let patientRequests: PatientRequestContext[] = [];
      let doctorAppointmentCount: number | undefined = undefined;

      if (req.user.role === 'patient') {
        const rows = db.all(
          'SELECT * FROM ambulance_requests WHERE patient_id=? ORDER BY created_at DESC LIMIT 3',
          req.user.id
        );
        patientRequests = rows.map((r) => {
          try {
            const details = decrypt(r.details_ciphertext, config.RECORD_ENCRYPTION_KEY, `ambulance:${r.id}`);
            return {
              id: r.id,
              status: r.status,
              createdAt: r.created_at,
              contactNumber: details.contactNumber,
              pickupAddress: details.pickupAddress,
            };
          } catch {
            return { id: r.id, status: r.status, createdAt: r.created_at };
          }
        });
      } else if (req.user.role === 'doctor') {
        const countRow = db.one('SELECT count(*) as count FROM appointments WHERE doctor_id=?', req.user.id);
        doctorAppointmentCount = Number(countRow?.count || 0);
      }

      const systemContext: AssistantSystemContext = {
        role: req.user.role,
        currentPage: input.currentPage,
        language: input.language,
        availableActions: input.availableActions,
        patientRequests,
        doctorAppointmentCount,
      };

      const result = await generateAssistanceVoiceReply(config, input, systemContext);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });
  function authorizeRoom(user: User, consultationId: string) {
    const c = find('consultations', consultationId); participant(user, c); verifiedDoctor(c.doctor_id);
    const appt = find('appointments', c.appointment_id);
    if (appt.status !== 'confirmed' || !['scheduled', 'in_progress'].includes(c.status) || appt.mode !== 'video') fail(409, 'ROOM_UNAVAILABLE', 'Consultation is not open for a video session');
    return c;
  }
  attachSignaling(io, session, authorizeRoom, config);
  app.use((_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'Endpoint not found')));
  app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof z.ZodError) { res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues.map(i => ({ path: i.path.join('.'), message: i.message })) } }); return; }
    if (error instanceof ApiError) { res.status(error.status).json({ error: { code: error.code, message: error.message } }); return; }
    if (error.type === 'entity.parse.failed') { res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Malformed JSON' } }); return; }
    if (error.type === 'entity.too.large') { res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Payload exceeds 64kb' } }); return; }
    console.error('Backend request failed:', error.code ?? error.name ?? 'unknown');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' } });
  });
  return { app, http, io, db, async close() { await new Promise<void>(resolve => io.close(() => resolve())); db.close(); } };
}

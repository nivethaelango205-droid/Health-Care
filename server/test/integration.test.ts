import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { io, type Socket } from 'socket.io-client';
import { createBackend } from '../src/app.js';
import { readConfig } from '../src/config.js';
import { hashPassword, decrypt } from '../src/security.js';
import { Database } from '../src/db.js';

test('real HTTP, SQLite persistence, PDF and authenticated two-client signaling', async t => {
  const directory = mkdtempSync(join(tmpdir(), 'ruralcare-test-'));
  const path = join(directory, 'test.sqlite');
  const config = readConfig({ NODE_ENV: 'test', PORT: '0', DATABASE_PATH: path,
    AUTH_SECRET: randomBytes(32).toString('hex'), RECORD_ENCRYPTION_KEY: randomBytes(32).toString('hex') });
  const backend = createBackend(config);
  const sockets: Socket[] = [];
  await new Promise<void>(resolve => backend.http.listen(0, '127.0.0.1', resolve));
  const address = backend.http.address() as { port: number };
  const base = `http://127.0.0.1:${address.port}`;
  const secret = randomBytes(24).toString('hex');
  let patient: any, doctor: any, admin: any, stranger: any, doctor2: any, booking: any, consult: any, medical: any, request: any;
  async function api(method: string, route: string, token?: string, data?: unknown, status = 200) {
    const response = await fetch(`${base}/api${route}`, { method,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(data ? { 'Content-Type': 'application/json' } : {}) },
      body: data ? JSON.stringify(data) : undefined });
    const body = response.status === 204 ? null : await response.json();
    assert.equal(response.status, status, `${method} ${route}: ${JSON.stringify(body)}`); return body;
  }
  async function connect(token?: string) {
    const socket = io(base, { auth: { token }, transports: ['websocket'], reconnection: false }); sockets.push(socket);
    await new Promise<void>((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); }); return socket;
  }
  const ack = (socket: Socket, event: string, payload: unknown) => new Promise<any>((resolve, reject) => socket.timeout(3000).emit(event, payload, (error: Error | null, value: any) => error ? reject(error) : resolve(value)));
  const event = (socket: Socket, name: string) => new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Missing ${name}`)), 3000);
    socket.once(name, value => { clearTimeout(timer); resolve(value); });
  });
  try {
    await t.test('startup, actual database health, validation, patient registration and all role logins', async () => {
      assert.equal((await api('GET', '/health')).database, 'up');
      await api('GET', '/auth/me', undefined, undefined, 401);
      await api('POST', '/auth/register', undefined, { name: 'Bad Actor', email: 'bad@example.test', password: secret, role: 'admin' }, 422);
      await api('POST', '/auth/register', undefined, { name: 'Bad Actor', email: 'bad@example.test', password: secret, role: 'doctor' }, 422);
      patient = await api('POST', '/auth/register', undefined, { name: 'Fictional Asha', email: 'asha@example.test', password: secret }, 201);
      stranger = await api('POST', '/auth/register', undefined, { name: 'Fictional Other', email: 'other@example.test', password: secret }, 201);
      await api('POST', '/auth/register', undefined, { name: 'Duplicate', email: 'ASHA@example.test', password: secret }, 409);
      await api('POST', '/auth/login', undefined, { email: 'asha@example.test', password: 'incorrect' }, 401);
      patient = await api('POST', '/auth/login', undefined, { email: 'asha@example.test', password: secret });
      const hashed = await hashPassword(secret);
      for (const [role, mail] of [['doctor', 'meera'], ['doctor', 'otherdoctor'], ['admin', 'admin']]) {
        const userId = randomUUID();
        backend.db.run('INSERT INTO users VALUES(?,?,?,?,?,?)', userId, `Fictional ${mail}`, `${mail}@example.test`, hashed, role, new Date().toISOString());
        if (role === 'doctor') backend.db.run('INSERT INTO doctors VALUES(?,?,?)', userId, 'Demo General Medicine', 1);
      }
      doctor = await api('POST', '/auth/login', undefined, { email: 'meera@example.test', password: secret });
      doctor2 = await api('POST', '/auth/login', undefined, { email: 'otherdoctor@example.test', password: secret });
      admin = await api('POST', '/auth/login', undefined, { email: 'admin@example.test', password: secret });
      for (const account of [patient, doctor, admin]) assert.equal((await api('GET', '/auth/me', account.token)).user.role, account.user.role);
      assert.equal((await api('GET', `/doctors/${doctor.user.id}`, patient.token)).doctor.verified, true);
      assert.equal((await api('GET', '/doctors', patient.token)).doctors.length, 2);
    });
    await t.test('booking, overlap prevention, availability and doctor-only confirmation', async () => {
      const startsAt = new Date(Date.now() + 86400000).toISOString();
      await api('POST', '/appointments', doctor.token, { doctorId: doctor.user.id, startsAt }, 403);
      booking = (await api('POST', '/appointments', patient.token, { doctorId: doctor.user.id, startsAt }, 201)).appointment;
      await api('POST', '/appointments', stranger.token, { doctorId: doctor.user.id, startsAt }, 409);
      await api('POST', '/appointments', stranger.token, { doctorId: doctor.user.id, startsAt: new Date(Date.parse(startsAt) + 60000).toISOString() }, 409);
      await api('PATCH', `/appointments/${booking.id}/status`, patient.token, { status: 'confirmed' }, 403);
      await api('PATCH', `/appointments/${booking.id}/status`, admin.token, { status: 'confirmed' }, 403);
      await api('PATCH', `/appointments/${booking.id}/status`, doctor2.token, { status: 'confirmed' }, 403);
      await api('GET', `/appointments/${booking.id}/letter`, patient.token, undefined, 409);
      booking = (await api('PATCH', `/appointments/${booking.id}/status`, doctor.token, { status: 'confirmed' })).appointment;
      assert.equal(booking.status, 'confirmed');
      await api('GET', `/appointments/${booking.id}`, stranger.token, undefined, 403);
      assert.equal((await api('GET', '/appointments', stranger.token)).appointments.length, 0);
      assert.equal((await api('GET', '/appointments', doctor.token)).appointments.length, 1);
      const availabilityStart = new Date(Date.now() + 2 * 86400000).toISOString();
      backend.db.run('INSERT INTO doctor_availability VALUES(?,?,?,?)', randomUUID(), doctor2.user.id, availabilityStart, new Date(Date.parse(availabilityStart) + 3600000).toISOString());
      await api('POST', '/appointments', patient.token, { doctorId: doctor2.user.id, startsAt: new Date(Date.now() + 3 * 86400000).toISOString() }, 409);
    });
    await t.test('real confirmed PDF download and unauthorized download denial', async () => {
      const response = await fetch(`${base}/api/appointments/${booking.id}/letter`, { headers: { Authorization: `Bearer ${patient.token}` } });
      assert.equal(response.status, 200); assert.match(response.headers.get('content-type')!, /application\/pdf/);
      assert.match(response.headers.get('content-disposition')!, /attachment/);
      const pdf = Buffer.from(await response.arrayBuffer()); assert.equal(pdf.subarray(0, 5).toString(), '%PDF-'); assert.ok(pdf.length > 1000);
      await api('GET', `/appointments/${booking.id}/letter`, stranger.token, undefined, 403);
    });
    await t.test('consultation association and encrypted clinical record CRUD with strict access', async () => {
      consult = (await api('POST', '/consultations', patient.token, { appointmentId: booking.id }, 201)).consultation;
      assert.equal((await api('POST', '/consultations', doctor.token, { appointmentId: booking.id })).consultation.id, consult.id);
      await api('GET', `/consultations/${consult.id}`, admin.token, undefined, 403);
      await api('GET', `/consultations/${consult.id}`, stranger.token, undefined, 403);
      await api('PATCH', `/consultations/${consult.id}`, patient.token, { status: 'in_progress' }, 403);
      const input = { consultationId: consult.id, patientId: patient.user.id, doctorId: doctor.user.id, consultationDate: new Date().toISOString(), symptoms: 'Fictional symptom UNIQUE_SECRET_987', clinicalNotes: 'Fictional clinical note', recommendations: 'Fictional recommendation' };
      await api('POST', '/health-records', doctor.token, input, 409);
      await api('PATCH', `/consultations/${consult.id}`, doctor.token, { status: 'in_progress' });
      await api('POST', '/health-records', patient.token, input, 403);
      await api('POST', '/health-records', doctor2.token, input, 403);
      await api('POST', '/health-records', doctor.token, { ...input, patientId: stranger.user.id }, 422);
      medical = (await api('POST', '/health-records', doctor.token, input, 201)).healthRecord;
      await api('POST', '/health-records', doctor.token, input, 409);
      assert.equal((await api('GET', `/health-records/${medical.id}`, patient.token)).healthRecord.symptoms, input.symptoms);
      for (const account of [stranger, doctor2, admin]) await api('GET', `/health-records/${medical.id}`, account.token, undefined, 403);
      await api('GET', '/health-records', admin.token, undefined, 403);
      assert.equal((await api('GET', '/health-records', stranger.token)).healthRecords.length, 0);
      await api('PATCH', `/health-records/${medical.id}`, patient.token, { clinicalNotes: 'Tampered' }, 403);
      medical = (await api('PATCH', `/health-records/${medical.id}`, doctor.token, { clinicalNotes: 'Fictional updated notes' })).healthRecord;
      assert.equal((await api('GET', `/health-records/${medical.id}`, patient.token)).healthRecord.clinicalNotes, 'Fictional updated notes');
      assert.equal((await api('GET', `/consultations/${consult.id}`, patient.token)).consultation.healthRecordId, medical.id);
      const raw = backend.db.one('SELECT * FROM health_records WHERE id=?', medical.id)!;
      assert.ok(!raw.clinical_ciphertext.includes('UNIQUE_SECRET_987'));
      assert.throws(() => decrypt(raw.clinical_ciphertext, config.RECORD_ENCRYPTION_KEY, 'record:wrong-id'));
    });
    await t.test('ambulance assistance storage, privacy and internal status transitions', async () => {
      request = (await api('POST', '/ambulance/requests', patient.token, { contactNumber: '+91 9999999999', pickupAddress: 'Fictional Village Lane', coordinates: { latitude: 20, longitude: 78 } }, 201)).ambulanceRequest;
      assert.equal(request.status, 'submitted'); assert.match(request.notice, /not emergency dispatch/);
      assert.equal((await api('GET', '/ambulance/requests', stranger.token)).ambulanceRequests.length, 0);
      assert.equal((await api('GET', '/ambulance/requests', admin.token)).ambulanceRequests[0].id, request.id);
      await api('GET', '/ambulance/requests', doctor.token, undefined, 403);
      await api('PATCH', `/ambulance/requests/${request.id}/status`, patient.token, { status: 'acknowledged' }, 403);
      await api('PATCH', `/ambulance/requests/${request.id}/status`, admin.token, { status: 'dispatched' }, 422);
      assert.equal((await api('PATCH', `/ambulance/requests/${request.id}/status`, admin.token, { status: 'acknowledged' })).ambulanceRequest.status, 'acknowledged');
      assert.equal((await api('GET', '/ambulance/requests', patient.token)).ambulanceRequests[0].status, 'acknowledged');
    });
    await t.test('emergency assistance chat authorization, validation, unconfigured state, and AI contract fulfillment', async () => {
      // 1. Unauthenticated request denied
      await api('POST', '/assistance/chat', undefined, { message: 'How do I get an ambulance?' }, 401);

      // 2. Input validation
      await api('POST', '/assistance/chat', patient.token, { message: '' }, 422);
      await api('POST', '/assistance/chat', patient.token, { message: '   ' }, 422);
      await api('POST', '/assistance/chat', patient.token, { message: 'Help', unknownField: true }, 422);

      // 3. Unconfigured AI returns 503 AI_NOT_CONFIGURED without fabricating answers
      const unconfigured = await api('POST', '/assistance/chat', patient.token, { message: 'What is my request status?' }, 503);
      assert.equal(unconfigured.error.code, 'AI_NOT_CONFIGURED');

      // 4. Configured provider returns genuine JSON contract with ground-truth requests
      const originalFetch = globalThis.fetch;
      try {
        let capturedGeminiUrl = '';
        let capturedGeminiBody: any = null;

        // Temporarily configure a Gemini key on the running config
        config.GEMINI_API_KEY = 'test-gemini-key-123';

        globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
          const urlStr = String(input);
          if (urlStr.includes('generativelanguage.googleapis.com')) {
            capturedGeminiUrl = urlStr;
            capturedGeminiBody = JSON.parse(String(init?.body || '{}'));
            return new Response(
              JSON.stringify({
                candidates: [
                  {
                    content: {
                      parts: [
                        {
                          text: JSON.stringify({
                            reply: 'Your ambulance assistance request is currently acknowledged by the rural desk. For immediate life danger, call 112.',
                            actionId: 'check_status',
                          }),
                        },
                      ],
                    },
                  },
                ],
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }
          return originalFetch(input, init);
        }) as typeof fetch;

        const aiResponse = await api('POST', '/assistance/chat', patient.token, {
          message: 'Can you check my ambulance status?',
          history: [{ sender: 'user', text: 'Hello' }],
        });

        assert.equal(aiResponse.mode, 'ai');
        assert.equal(aiResponse.actionId, 'check_status');
        assert.match(aiResponse.reply, /acknowledged/);
        assert.ok(capturedGeminiUrl.includes('test-gemini-key-123'));
        // Verify patient ground truth was provided to Gemini system instruction
        const sysInstruction = capturedGeminiBody?.system_instruction?.parts?.[0]?.text;
        assert.match(sysInstruction, /acknowledged/);

        // 5. Test upstream failure handling (returns 502 AI_GATEWAY_ERROR)
        globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
          const urlStr = String(input);
          if (urlStr.includes('generativelanguage.googleapis.com')) {
            return new Response('API quota exhausted', { status: 429 });
          }
          return originalFetch(input, init);
        }) as typeof fetch;

        const gatewayErr = await api('POST', '/assistance/chat', patient.token, { message: 'Emergency' }, 502);
        assert.equal(gatewayErr.error.code, 'AI_GATEWAY_ERROR');
      } finally {
        globalThis.fetch = originalFetch;
        config.GEMINI_API_KEY = '';
      }
    });
    await t.test('authenticated two-client offer, answer, ICE, join, leave and disconnect; unauthorized users denied', async () => {
      await assert.rejects(connect('invalid'), /Valid session required/);
      const sPatient = await connect(patient.token), sDoctor = await connect(doctor.token), sOther = await connect(stranger.token), sAdmin = await connect(admin.token), sDoctor2 = await connect(doctor2.token);
      const room = { consultationId: consult.id };
      for (const socket of [sOther, sAdmin, sDoctor2]) assert.equal((await ack(socket, 'consultation:join', room)).error.code, 'FORBIDDEN');
      assert.equal((await ack(sPatient, 'webrtc:offer', { ...room, description: { type: 'offer', sdp: 'test SDP' } })).error.code, 'NOT_IN_ROOM');
      const joined = await ack(sPatient, 'consultation:join', room); assert.equal(joined.ok, true); assert.ok(joined.data.iceServers.length);
      const peerJoined = event(sPatient, 'participant:joined'); assert.equal((await ack(sDoctor, 'consultation:join', room)).ok, true); assert.equal((await peerJoined).userId, doctor.user.id);
      const duplicate = await connect(patient.token); assert.equal((await ack(duplicate, 'consultation:join', room)).error.code, 'PARTICIPANT_ALREADY_CONNECTED'); duplicate.disconnect();
      for (const [from, to, name, data] of [
        [sPatient, sDoctor, 'webrtc:offer', { description: { type: 'offer', sdp: 'synthetic transport test offer; not a real media session' } }],
        [sDoctor, sPatient, 'webrtc:answer', { description: { type: 'answer', sdp: 'synthetic transport test answer; not a real media session' } }],
        [sPatient, sDoctor, 'webrtc:ice-candidate', { candidate: { candidate: 'candidate:transport-test', sdpMid: '0', sdpMLineIndex: 0 } }],
        [sDoctor, sPatient, 'webrtc:ice-candidate', { candidate: null }],
      ] as const) {
        const received = event(to, name); assert.equal((await ack(from, name, { ...room, ...data })).ok, true);
        const payload = await received; assert.equal(payload.consultationId, consult.id); assert.ok(payload.fromUserId);
      }
      const peerLeft = event(sDoctor, 'participant:left'); assert.equal((await ack(sPatient, 'consultation:leave', room)).ok, true); assert.equal((await peerLeft).reason, 'left_session');
      assert.equal((await ack(sDoctor, 'webrtc:answer', { ...room, description: { type: 'answer', sdp: 'test' } })).error.code, 'PEER_NOT_CONNECTED');
      await ack(sPatient, 'consultation:join', room);
      const disconnected = event(sDoctor, 'participant:left'); sPatient.disconnect(); assert.equal((await disconnected).userId, patient.user.id);
      const loggedOut = event(sDoctor, 'disconnect'); await api('POST', '/auth/logout', doctor.token, undefined, 204); await loggedOut;
      await api('GET', '/auth/me', doctor.token, undefined, 401);
      await assert.rejects(connect(doctor.token), /Valid session required/);
      doctor = await api('POST', '/auth/login', undefined, { email: 'meera@example.test', password: secret });
      await api('PATCH', `/consultations/${consult.id}`, doctor.token, { status: 'completed' });
      const completedSocket = await connect(patient.token); assert.equal((await ack(completedSocket, 'consultation:join', room)).error.code, 'ROOM_UNAVAILABLE');
      assert.equal((await api('GET', `/appointments/${booking.id}`, patient.token)).appointment.status, 'completed');
    });
  } finally {
    for (const socket of sockets) socket.disconnect(); await backend.close();
  }
  try {
    await t.test('database survives restart and clinical fields are absent from database bytes', async () => {
      assert.ok(!readFileSync(path).includes(Buffer.from('UNIQUE_SECRET_987')));
      const db = new Database(path);
      try { assert.equal(db.one('SELECT status FROM ambulance_requests WHERE id=?', request.id)!.status, 'acknowledged'); assert.equal(db.one('SELECT id FROM health_records WHERE id=?', medical.id)!.id, medical.id); }
      finally { db.close(); }
      const restarted = createBackend(config); await new Promise<void>(resolve => restarted.http.listen(0, '127.0.0.1', resolve));
      try {
        const port = (restarted.http.address() as { port: number }).port;
        const response = await fetch(`http://127.0.0.1:${port}/api/health-records/${medical.id}`, { headers: { Authorization: `Bearer ${patient.token}` } });
        assert.equal(response.status, 200); assert.equal((await response.json() as any).healthRecord.clinicalNotes, 'Fictional updated notes');
        restarted.db.close();
        const health = await fetch(`http://127.0.0.1:${port}/api/health`); assert.equal(health.status, 503); assert.equal((await health.json() as any).database, 'down');
      } finally { await restarted.close(); }
    });
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

import { type Server } from 'socket.io';
import { z } from 'zod';
import type { User } from './app.js';
import type { Config } from './config.js';
import { ApiError, fail } from './errors.js';

const roomSchema = z.object({ consultationId: z.string().uuid() }).strict();
const description = (type: 'offer' | 'answer') => roomSchema.extend({ description: z.object({ type: z.literal(type), sdp: z.string().min(1).max(64000) }).strict() }).strict();
const candidateSchema = roomSchema.extend({ candidate: z.object({
  candidate: z.string().max(4000), sdpMid: z.string().max(100).nullable().optional(),
  sdpMLineIndex: z.number().int().min(0).max(65535).nullable().optional(), usernameFragment: z.string().max(256).nullable().optional(),
}).strict().nullable() }).strict();
type Session = (token: unknown) => { user: User; hash: string };

export function attachSignaling(io: Server, session: Session, authorizeRoom: (user: User, id: string) => unknown, config: Config) {
  const memberships = new Map<string, Map<string, string>>(); // consultation -> user -> socket
  io.use((socket, next) => {
    try {
      const value = session(socket.handshake.auth.token);
      socket.data.user = value.user; socket.data.sessionHash = value.hash;
      next();
    } catch { const error = new Error('Valid session required') as Error & { data: unknown }; error.data = { code: 'UNAUTHENTICATED' }; next(error); }
  });
  io.on('connection', socket => {
    let joined: string | undefined;
    let count = 0; let resetAt = Date.now() + 60000;
    const checkSession = () => session(socket.handshake.auth.token).user;
    const timer = setInterval(() => { try { checkSession(); if (joined) authorizeRoom(socket.data.user, joined); } catch { socket.disconnect(true); } }, 10000);
    timer.unref();
    function leave(reason: string) {
      if (!joined) return;
      const consultationId = joined;
      memberships.get(joined)?.delete(socket.data.user.id);
      if (!memberships.get(joined)?.size) memberships.delete(joined);
      socket.to(`consultation:${joined}`).emit('participant:left', { consultationId, userId: socket.data.user.id, reason });
      void socket.leave(`consultation:${joined}`); joined = undefined;
    }
    function handler<T>(schema: z.ZodType<T>, fn: (data: T, user: User) => unknown) {
      return (payload: unknown, ack?: (value: unknown) => void) => {
        let response: unknown;
        try {
          if (Date.now() >= resetAt) { count = 0; resetAt = Date.now() + 60000; }
          if (++count > 240) fail(429, 'RATE_LIMITED', 'Too many signaling messages');
          const user = checkSession();
          const data = schema.parse(payload);
          response = { ok: true, data: fn(data, user) ?? null };
        } catch (error) {
          response = { ok: false, error: { code: error instanceof ApiError ? error.code : error instanceof z.ZodError ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR', message: error instanceof ApiError ? error.message : 'Invalid signaling request' } };
          if (error instanceof ApiError && error.status === 401) socket.disconnect(true);
        }
        if (typeof ack === 'function') ack(response); else socket.emit('signaling:error', response);
      };
    }
    socket.on('consultation:join', handler(roomSchema, (data, user) => {
      authorizeRoom(user, data.consultationId);
      const members = memberships.get(data.consultationId) ?? new Map<string, string>();
      const previous = members.get(user.id);
      if (previous && previous !== socket.id) fail(409, 'PARTICIPANT_ALREADY_CONNECTED', 'This participant already has an active connection');
      if (joined === data.consultationId) return { consultationId: joined, participants: [...members.keys()], iceServers: iceServers(config) };
      leave('switched_room');
      if (members.size >= 2) fail(409, 'ROOM_FULL', 'Both participants are connected');
      members.set(user.id, socket.id); memberships.set(data.consultationId, members);
      joined = data.consultationId;
      // Default in-memory Socket.IO adapter joins synchronously; a single process is required.
      void socket.join(`consultation:${joined}`);
      socket.to(`consultation:${joined}`).emit('participant:joined', { consultationId: joined, userId: user.id, role: user.role });
      return { consultationId: joined, participants: [...members.keys()], iceServers: iceServers(config) };
    }));
    function relay(event: string, data: { consultationId: string; [key: string]: unknown }, user: User) {
      authorizeRoom(user, data.consultationId);
      if (joined !== data.consultationId) fail(403, 'NOT_IN_ROOM', 'Join this consultation first');
      if (memberships.get(joined)?.size !== 2) fail(409, 'PEER_NOT_CONNECTED', 'Wait for the other participant');
      socket.to(`consultation:${joined}`).emit(event, { ...data, fromUserId: user.id });
    }
    socket.on('webrtc:offer', handler(description('offer'), (data, user) => relay('webrtc:offer', data, user)));
    socket.on('webrtc:answer', handler(description('answer'), (data, user) => relay('webrtc:answer', data, user)));
    socket.on('webrtc:ice-candidate', handler(candidateSchema, (data, user) => relay('webrtc:ice-candidate', data, user)));
    socket.on('consultation:leave', handler(roomSchema, (data, user) => {
      authorizeRoom(user, data.consultationId);
      if (joined !== data.consultationId) fail(403, 'NOT_IN_ROOM', 'Not joined to this consultation');
      leave('left_session');
    }));
    socket.on('ambulance:join_track', (payload: any) => {
      try {
        const reqId = typeof payload === 'string' ? payload : payload?.requestId;
        if (reqId && typeof reqId === 'string') {
          void socket.join(`ambulance_track:${reqId}`);
          socket.emit('ambulance:joined_track', { requestId: reqId, ok: true });
        }
      } catch (err) {
        console.error('Socket ambulance join error:', err);
      }
    });
    socket.on('ambulance:leave_track', (payload: any) => {
      try {
        const reqId = typeof payload === 'string' ? payload : payload?.requestId;
        if (reqId && typeof reqId === 'string') {
          void socket.leave(`ambulance_track:${reqId}`);
        }
      } catch (err) {}
    });
    socket.on('disconnect', reason => { clearInterval(timer); leave(reason); });
  });
}
function iceServers(config: Config) {
  const servers: { urls: string[]; username?: string; credential?: string }[] = [];
  if (config.STUN_URLS) servers.push({ urls: config.STUN_URLS.split(',').map(v => v.trim()) });
  if (config.TURN_URLS) servers.push({ urls: config.TURN_URLS.split(',').map(v => v.trim()), username: config.TURN_USERNAME, credential: config.TURN_PASSWORD });
  return servers;
}

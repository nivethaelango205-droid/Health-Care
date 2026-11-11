# RuralCare 360 — WebRTC Client Contract Specification

**Project:** RuralCare 360  
**Hackathon:** CODIENYCH 1.0  
**Team:** Hack Rat (ID: CODIENYCH-2026-0003)  
**Author:** Antigravity (Frontend Lead)  
**Target:** Codex (Backend Signaling Lead)  

---

## 1. Overview & Transport Protocol

WebRTC signaling is handled over Socket.IO over HTTP/HTTPS, matching the exact server implementation in `server/src/signaling.ts`.

### 1.1 Transport Endpoint
- **Socket Path:** `/socket.io`
- **Port:** Proxy routes `/socket.io` to Express server on port 4000.
- **Transports:** `["websocket", "polling"]`

### 1.2 Authentication Handshake
When initiating the Socket.IO connection, the client supplies the user session token in the handshake auth object:
```ts
import { io } from 'socket.io-client';

const socket = io({
  path: '/socket.io',
  auth: {
    token: localStorage.getItem('ruralcare_token'),
  },
});
```
The server middleware calls `session(socket.handshake.auth.token)` to verify the user role and session hash.

---

## 2. Event Specification

### 2.1 Joining a Consultation (`consultation:join`)
Client emits to enter a specific consultation session:

**Client Emission:**
```ts
socket.emit('consultation:join', { consultationId: 'uuid-consultation-id' }, (response) => {
  if (response.ok) {
    console.log('Joined room:', response.data.consultationId);
    console.log('Active participants:', response.data.participants);
    console.log('STUN/TURN servers:', response.data.iceServers);
  } else {
    console.error('Join error:', response.error.code, response.error.message);
  }
});
```

**Server Acknowledgement Payload:**
```json
{
  "ok": true,
  "data": {
    "consultationId": "d0e1f2a3-b4c5-...",
    "participants": ["user-id-1", "user-id-2"],
    "iceServers": [
      { "urls": ["stun:stun.l.google.com:19302"] }
    ]
  }
}
```

### 2.2 Peer Join Notification (`participant:joined`)
When the second participant enters the room, the server emits to other members:
```json
{
  "consultationId": "d0e1f2a3-b4c5-...",
  "userId": "peer-user-id",
  "role": "patient | doctor"
}
```
**Frontend Action:** Upon receipt, the caller (typically doctor) initiates the WebRTC offer creation via `peerConnection.createOffer()`.

### 2.3 WebRTC SDP Offer (`webrtc:offer`)
**Client Emission (from caller):**
```ts
socket.emit('webrtc:offer', {
  consultationId: 'uuid-consultation-id',
  description: {
    type: 'offer',
    sdp: offerSDPString,
  },
});
```
**Server Relay (to callee):**
The server validates the room membership and emits `webrtc:offer` with `fromUserId` to the remote peer.

### 2.4 WebRTC SDP Answer (`webrtc:answer`)
**Client Emission (from callee):**
```ts
socket.emit('webrtc:answer', {
  consultationId: 'uuid-consultation-id',
  description: {
    type: 'answer',
    sdp: answerSDPString,
  },
});
```
**Server Relay (to caller):**
The server validates the room and relays `webrtc:answer` with `fromUserId` to the caller.

### 2.5 ICE Candidate Exchange (`webrtc:ice-candidate`)
**Client Emission:**
```ts
socket.emit('webrtc:ice-candidate', {
  consultationId: 'uuid-consultation-id',
  candidate: {
    candidate: candidate.candidate,
    sdpMid: candidate.sdpMid,
    sdpMLineIndex: candidate.sdpMLineIndex,
    usernameFragment: candidate.usernameFragment,
  },
});
```
**Server Relay:**
Relayed to peer as `webrtc:ice-candidate`.

### 2.6 Participant Left (`participant:left`)
Emitted by the server when a participant leaves or socket disconnects:
```json
{
  "consultationId": "uuid-consultation-id",
  "userId": "peer-user-id",
  "reason": "left_session | transport close | switched_room"
}
```
**Frontend Action:** The frontend transitions remote canvas back to `"Waiting for peer to reconnect..."` and resets the peer connection.

### 2.7 Leaving a Consultation (`consultation:leave`)
**Client Emission:**
```ts
socket.emit('consultation:leave', {
  consultationId: 'uuid-consultation-id',
});
```
---

## 3. Security & Privacy Guarantees

1. **Authorization Verification:** Only the patient assigned to the appointment and the assigned verified doctor can join the room.
2. **Room Capacity Limit:** The server enforces maximum 2 concurrent participants per consultation room (`ROOM_FULL` error for third parties).
3. **DTLS-SRTP Media Security:** Audio and video streams flow directly peer-to-peer (or through TURN) with DTLS-SRTP end-to-end encryption.
4. **Clean Hardware Teardown:** When a user exits the consultation, `useUserMedia` immediately calls `track.stop()` on all camera and microphone tracks to prevent background recording.


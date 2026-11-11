# RuralCare 360 Socket.IO signaling contract

Socket.IO 4 endpoint: `http://127.0.0.1:4000`, default path `/socket.io`. Use the same base host as HTTP and `socket.io-client` v4. WebSocket and polling transports are supported. CORS uses `FRONTEND_ORIGINS`; handshake origin is also validated. No cookies.

```ts
const socket = io('http://127.0.0.1:4000', {
  auth: { token: authResponse.token },
  transports: ['websocket', 'polling']
});
socket.on('connect_error', error => console.error(error.message, error.data));
socket.emit('consultation:join', { consultationId }, response => {
  if (!response.ok) return showError(response.error);
  const peer = new RTCPeerConnection({ iceServers: response.data.iceServers });
  // Frontend owns getUserMedia, media tracks, negotiation, remote video and cleanup.
});
```

Only the assigned patient and verified doctor of a confirmed video appointment can join. Consultation status must be scheduled or in_progress. Admins and other users are denied. The handshake validates a persistent, unexpired session; each event revalidates it and room authorization. A 10-second watchdog disconnects expired/revoked sessions or unavailable rooms. Logout disconnects matching sockets immediately. Completion/cancellation disconnects room sockets. One connection per participant per consultation; one joined room per socket, up to two participants per room.

## Client → server events

Every event supports an acknowledgement callback with either `{ "ok": true, "data": <value-or-null> }` or `{ "ok": false, "error": { "code": "FORBIDDEN", "message": "..." } }`. Always provide a callback. Without one the server sends the result through `signaling:error` (including a success result). Unknown fields are rejected.

| Event | Exact payload | Success acknowledgement data |
|---|---|---|
| `consultation:join` | `{ "consultationId": "<uuid>" }` | `{ consultationId: string, participants: string[], iceServers: IceServer[] }` |
| `webrtc:offer` | `{ "consultationId": "<uuid>", "description": { "type": "offer", "sdp": "<SDP>" } }` | null |
| `webrtc:answer` | `{ "consultationId": "<uuid>", "description": { "type": "answer", "sdp": "<SDP>" } }` | null |
| `webrtc:ice-candidate` | `{ "consultationId": "<uuid>", "candidate": { "candidate": "<ICE candidate>", "sdpMid": "0", "sdpMLineIndex": 0, "usernameFragment": "<optional>" } }` | null |
| `consultation:leave` | `{ "consultationId": "<uuid>" }` | null |

For ICE, `candidate` can be null to indicate end of candidates. Inside a nonnull candidate, candidate string is required; sdpMid, sdpMLineIndex and usernameFragment are optional and nullable. SDP is 1–64,000 characters; candidate string up to 4,000. SDP/candidate validation checks transport shape, not successful browser negotiation. Messages are capped at 128 KB and 240 events/minute/socket.

## Server → client events

| Event | Exact payload |
|---|---|
| `participant:joined` | `{ consultationId: string, userId: string, role: 'patient' \| 'doctor' }` |
| `participant:left` | `{ consultationId: string, userId: string, reason: string }` |
| `webrtc:offer` | `{ consultationId: string, description: { type: 'offer', sdp: string }, fromUserId: string }` |
| `webrtc:answer` | `{ consultationId: string, description: { type: 'answer', sdp: string }, fromUserId: string }` |
| `webrtc:ice-candidate` | `{ consultationId: string, candidate: Candidate \| null, fromUserId: string }` |
| `signaling:error` | Same acknowledgement envelope above |

Events are sent only to the other authorized room participant. They are not reflected to the sender. Leave reasons include `left_session`, `switched_room`, and Socket.IO disconnect reasons. `disconnect` is also a built-in Socket.IO client event.

Errors: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `DOCTOR_UNAVAILABLE`, `ROOM_UNAVAILABLE`, `PARTICIPANT_ALREADY_CONNECTED`, `ROOM_FULL`, `NOT_IN_ROOM`, `PEER_NOT_CONNECTED`, `RATE_LIMITED`, `INTERNAL_ERROR`. Handshake failures use `connect_error` with `error.data.code = 'UNAUTHENTICATED'`. Origin rejection may appear as a transport error.

## Browser work required

- Attach listeners before joining. Use acknowledgement participants plus participant:joined to know when the peer is available. Have the patient create the initial offer once both are joined; use a consistent negotiation strategy for later track changes.
- Acquire real media using `getUserMedia`; add tracks, setLocalDescription, send offer/answer; receive descriptions and setRemoteDescription.
- Send `candidate.toJSON()` on icecandidate. Buffer remote candidates until setRemoteDescription succeeds, then call addIceCandidate.
- Close RTCPeerConnection and stop local tracks on leave/disconnect/completion. Rejoin on reconnect and renegotiate; signaling messages are neither stored nor replayed.
- Localhost allows camera access; remote access requires HTTPS/WSS. STUN alone may fail across restrictive NATs. Configure a trusted TURN server and test across networks.

`IceServer = { urls: string[], username?: string, credential?: string }`. STUN defaults to `stun:stun.l.google.com:19302`. `STUN_URLS` and `TURN_URLS` are comma-separated; optional TURN requires TURN_USERNAME and TURN_PASSWORD. Join acknowledgements disclose these credentials to authorized participants; use scoped, short-lived service credentials for deployment rather than privileged administrative credentials.

This MVP uses one Node process and Socket.IO's in-memory adapter. Do not scale across multiple processes without shared room membership, session coordination and an adapter. The backend transports real signaling; tests use synthetic SDP/candidate fixtures to verify routing and authorization. Actual two-way audio/video requires the browser frontend and has not been verified.

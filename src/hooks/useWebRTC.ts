import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getStoredToken, isDemoModeActive } from '../services/api';
import { UserRole } from '../types';

export interface UseWebRTCOptions {
  consultationId: string;
  localStream: MediaStream | null;
  userRole?: UserRole;
  onRemoteStream?: (stream: MediaStream) => void;
  onPeerJoin?: (userId: string, role: string) => void;
  onPeerLeave?: (reason: string) => void;
}

export function useWebRTC({
  consultationId,
  localStream,
  userRole = 'patient',
  onRemoteStream,
  onPeerJoin,
  onPeerLeave,
}: UseWebRTCOptions) {
  const [isConnectedToSignaling, setIsConnectedToSignaling] = useState<boolean>(false);
  const [peerConnected, setPeerConnected] = useState<boolean>(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [signalingError, setSignalingError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingIceCandidatesRef = useRef<any[]>([]);
  const localStreamRef = useRef<MediaStream | null>(localStream);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    if (isDemoModeActive() || !consultationId || consultationId === 'consultation-active') {
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setSignalingError('Authentication token required for video signaling.');
      return;
    }

    // Connect to backend signaling server via proxy or direct port
    const socket = io({
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 5000,
    });

    socketRef.current = socket;
    let peerInRoom = false;
    let makingOffer = false;
    let offerTimer: ReturnType<typeof setTimeout> | undefined;

    const createPeerConnection = (iceServers: any[]) => {
      if (pcRef.current) {
        pcRef.current.close();
      }

      const pc = new RTCPeerConnection({
        iceServers: iceServers && iceServers.length > 0 ? iceServers : [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      pcRef.current = pc;
      pendingIceCandidatesRef.current = [];
      setPeerConnected(false);
      setRemoteStream(null);
      const inboundStream = new MediaStream();

      // Monitor connection state
      pc.onconnectionstatechange = () => {
        if (pcRef.current !== pc) return;
        setPeerConnected(peerInRoom && pc.connectionState === 'connected');
      };

      // When receiving remote tracks
      pc.ontrack = (event) => {
        if (pcRef.current !== pc) return;
        // Tracks can be streamless when media is enabled after SDP negotiation.
        // Keep audio and video together instead of replacing one with the other.
        if (!inboundStream.getTracks().some((track) => track.id === event.track.id)) {
          inboundStream.addTrack(event.track);
        }
        const showRemoteStream = () => {
          if (pcRef.current !== pc || !peerInRoom) return;
          setRemoteStream(inboundStream);
          if (onRemoteStream) onRemoteStream(inboundStream);
        };
        // A negotiated receiver exists before the remote camera is enabled.
        // Reveal the feed only when actual media starts arriving.
        event.track.onunmute = showRemoteStream;
        if (!event.track.muted) showRemoteStream();
      };

      // When gathering local ICE candidates
      pc.onicecandidate = (event) => {
        if (socket.connected) {
          socket.emit(
            'webrtc:ice-candidate',
            {
              consultationId,
              candidate: event.candidate
                ? {
                    candidate: event.candidate.candidate,
                    sdpMid: event.candidate.sdpMid,
                    sdpMLineIndex: event.candidate.sdpMLineIndex,
                    usernameFragment: event.candidate.usernameFragment,
                  }
                : null,
            },
            () => {}
          );
        }
      };

      // Reserve both media sections before the initial offer. Actual camera and
      // microphone tracks can then be enabled with replaceTrack without a new SDP
      // exchange, regardless of which participant enables their devices first.
      if (userRole === 'patient') {
        const stream = localStreamRef.current;
        (['audio', 'video'] as const).forEach((kind) => {
          const track = stream?.getTracks().find((item) => item.kind === kind);
          pc.addTransceiver(track || kind, {
            direction: 'sendrecv',
            ...(stream && track ? { streams: [stream] } : {}),
          });
        });
      }

      return pc;
    };

    const initiateOffer = async () => {
      const pc = pcRef.current;
      if (!pc || !socket.connected || !peerInRoom || makingOffer || pc.signalingState !== 'stable') return;
      makingOffer = true;
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);
        if (pcRef.current !== pc || !peerInRoom) return;
        socket.emit(
          'webrtc:offer',
          {
            consultationId,
            description: { type: 'offer', sdp: offer.sdp },
          },
          (ack: any) => {
            if (ack && !ack.ok) {
              console.warn('Offer ack:', ack.error);
            }
          }
        );
      } catch (err) {
        console.error('Error creating WebRTC offer:', err);
      } finally {
        makingOffer = false;
      }
    };

    const scheduleOffer = () => {
      if (offerTimer) clearTimeout(offerTimer);
      offerTimer = setTimeout(() => { void initiateOffer(); }, 300);
    };

    socket.on('connect', () => {
      setIsConnectedToSignaling(true);
      setSignalingError(null);

      // Join consultation room
      socket.emit(
        'consultation:join',
        { consultationId },
        (response: { ok: boolean; data?: any; error?: any }) => {
          if (!response.ok) {
            setSignalingError(response.error?.message || 'Failed to join consultation room');
            return;
          }

          const { participants, iceServers } = response.data;
          createPeerConnection(iceServers);
          peerInRoom = Boolean(participants && participants.length === 2);

          // If second participant already in room and this is the caller (patient)
          if (peerInRoom) {
            if (userRole === 'patient') {
              scheduleOffer();
            }
          }
        }
      );
    });

    socket.on('participant:joined', (payload: { consultationId: string; userId: string; role: string }) => {
      peerInRoom = true;
      if (onPeerJoin) onPeerJoin(payload.userId, payload.role);

      // Per signaling contract, have patient initiate the offer once peer connects
      if (userRole === 'patient') {
        scheduleOffer();
      }
    });

    socket.on('webrtc:offer', async (payload: { consultationId: string; description: any; fromUserId: string }) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.description));

        // Use the answerer's transceivers associated with the incoming offer.
        // Pre-created unmatched transceivers would leave these receivers recvonly.
        await Promise.all(pc.getTransceivers().filter((item) => item.mid !== null).map(async (transceiver) => {
          transceiver.direction = 'sendrecv';
          const track = localStreamRef.current?.getTracks().find((item) => item.kind === transceiver.receiver.track.kind);
          if (track && transceiver.sender.track !== track) {
            await transceiver.sender.replaceTrack(track);
          }
        }));

        // Drain buffered candidates
        while (pendingIceCandidatesRef.current.length > 0) {
          const candidate = pendingIceCandidatesRef.current.shift();
          if (candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.warn);
          }
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit(
          'webrtc:answer',
          {
            consultationId,
            description: { type: 'answer', sdp: answer.sdp },
          },
          () => {}
        );
      } catch (err) {
        console.error('Failed to handle incoming offer:', err);
      }
    });

    socket.on('webrtc:answer', async (payload: { consultationId: string; description: any; fromUserId: string }) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.description));

        // Drain buffered candidates
        while (pendingIceCandidatesRef.current.length > 0) {
          const candidate = pendingIceCandidatesRef.current.shift();
          if (candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.warn);
          }
        }
      } catch (err) {
        console.error('Failed to handle incoming answer:', err);
      }
    });

    socket.on('webrtc:ice-candidate', async (payload: { consultationId: string; candidate: any }) => {
      const pc = pcRef.current;
      if (!payload.candidate) return;

      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(console.warn);
      } else {
        pendingIceCandidatesRef.current.push(payload.candidate);
      }
    });

    socket.on('participant:left', (payload: { consultationId: string; userId: string; reason: string }) => {
      peerInRoom = false;
      if (offerTimer) clearTimeout(offerTimer);
      setPeerConnected(false);
      setRemoteStream(null);
      if (onPeerLeave) onPeerLeave(payload.reason);
    });

    socket.on('connect_error', (err: any) => {
      setIsConnectedToSignaling(false);
      setSignalingError('Socket connection notice: Signaling server unreachable or unauthenticated.');
    });

    socket.on('disconnect', () => {
      peerInRoom = false;
      setIsConnectedToSignaling(false);
      setPeerConnected(false);
      setRemoteStream(null);
    });

    return () => {
      if (offerTimer) clearTimeout(offerTimer);
      if (socketRef.current) {
        socketRef.current.emit('consultation:leave', { consultationId }, () => {});
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      setRemoteStream(null);
      setPeerConnected(false);
    };
  }, [consultationId, userRole]);

  // Synchronize dynamic local stream tracks
  useEffect(() => {
    if (pcRef.current && localStream) {
      pcRef.current.getTransceivers().forEach((transceiver) => {
        if (userRole !== 'patient' && transceiver.mid === null) return;
        const track = localStream.getTracks().find((item) => item.kind === transceiver.receiver.track.kind);
        if (track && transceiver.sender.track !== track) {
          void transceiver.sender.replaceTrack(track).catch((err) => {
            console.error('Failed to attach local media track:', err);
            setSignalingError('Unable to attach camera or microphone to the consultation.');
          });
        }
      });
    }
  }, [localStream, userRole]);

  return {
    isConnectedToSignaling,
    peerConnected,
    remoteStream,
    signalingError,
  };
}

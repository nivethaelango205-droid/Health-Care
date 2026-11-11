import React, { useEffect, useRef, useState } from 'react';
import { useUserMedia } from '../../hooks/useUserMedia';
import { useWebRTC } from '../../hooks/useWebRTC';
import { MediaControls } from './MediaControls';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { UserRole } from '../../types';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  ShieldCheck,
  User,
  Clock,
  Wifi,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface VideoRoomProps {
  consultationId: string;
  appointmentNumber?: string;
  participantName: string;
  userRole: UserRole;
  onLeave: () => void;
}

export const VideoRoom: React.FC<VideoRoomProps> = ({
  consultationId,
  appointmentNumber = 'RC360-DEL-8941',
  participantName,
  userRole,
  onLeave,
}) => {
  const {
    stream,
    isVideoEnabled,
    isAudioEnabled,
    permissionGranted,
    permissionError,
    toggleVideo,
    toggleAudio,
    startMedia,
    stopMedia,
  } = useUserMedia();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  // WebRTC socket signaling and peer connection integration
  const { isConnectedToSignaling, peerConnected, remoteStream, signalingError } = useWebRTC({
    consultationId,
    localStream: stream,
    userRole,
  });

  // Bind local stream to video element
  useEffect(() => {
    if (localVideoRef.current && stream) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [stream]);

  // Bind remote stream to remote video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  // Start timer once media is active
  useEffect(() => {
    let interval: any;
    if (permissionGranted) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [permissionGranted]);

  const handleStartSession = async () => {
    setHasStarted(true);
    await startMedia();
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const remotePeerRole = userRole === 'patient' ? 'Doctor' : 'Patient';

  return (
    <div className="flex flex-col h-[750px] max-h-[85vh] w-full bg-navy-950 rounded-2xl overflow-hidden border border-navy-800 shadow-2xl relative select-none">
      {/* Top Session Bar */}
      <div className="bg-navy-900/90 backdrop-blur-md px-5 py-3.5 border-b border-navy-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Secure Telemedicine Room
              </h3>
              <span className="text-[10px] font-mono bg-navy-800 text-teal-400 px-2 py-0.5 rounded border border-navy-700">
                {appointmentNumber}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Session with <span className="text-slate-200 font-semibold">{participantName}</span> ({remotePeerRole})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Call timer */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-800/80 text-slate-200 text-xs font-mono border border-navy-700">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span>{formatTimer(callDuration)}</span>
          </div>

          {/* Connection quality badge */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-teal-400 bg-teal-950/40 border border-teal-800/50 px-2.5 py-1 rounded-full">
            <Wifi className="h-3 w-3" />
            <span>{peerConnected ? 'P2P Connected' : isConnectedToSignaling ? 'Signaling Ready' : 'Standby'}</span>
          </div>
        </div>
      </div>

      {/* Main Video Arena */}
      <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden bg-gradient-to-b from-navy-950 to-[#081524]">
        {/* Remote Participant Canvas (Main Display) */}
        <div className="w-full h-full rounded-xl bg-navy-900/70 border border-navy-800/90 flex flex-col items-center justify-center relative overflow-hidden text-center shadow-inner">
          {/* If remote stream is active, render the live video feed */}
          {remoteStream ? (
            <div className="relative w-full h-full bg-black">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs text-white flex items-center gap-2 border border-white/10">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{participantName} ({remotePeerRole}) - Live Feed</span>
              </div>
            </div>
          ) : (
            <div className="p-6 relative z-10 max-w-md space-y-4">
              {/* Subtle medical grid background */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e3a5f_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

              <div className="h-20 w-20 rounded-2xl bg-navy-800 border border-navy-700/80 text-teal-400 flex items-center justify-center mx-auto shadow-xl ring-4 ring-navy-800/50">
                <User className="h-10 w-10 stroke-[1.5]" />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium mb-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                  Waiting for {remotePeerRole} to connect...
                </div>
                <h4 className="text-lg font-bold text-white">{participantName}</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                  The remote video feed will display here once {participantName.toLowerCase()} enters the room through WebRTC signaling.
                </p>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 border-t border-navy-800 max-w-xs mx-auto">
                Signaling Room: <span className="font-mono text-teal-400/80">{consultationId}</span>
              </div>
            </div>
          )}
        </div>

        {/* Local Participant Preview (Picture-in-Picture) */}
        <div className="absolute bottom-6 right-6 w-44 sm:w-56 aspect-video bg-navy-900 rounded-xl border-2 border-teal-500/60 shadow-2xl overflow-hidden z-20 transition-all hover:scale-105">
          {permissionGranted && stream ? (
            <div className="relative w-full h-full bg-black">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 ${
                  !isVideoEnabled ? 'hidden' : 'block'
                }`}
              />
              {!isVideoEnabled && (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-navy-950 p-2 text-center">
                  <CameraOff className="h-6 w-6 text-slate-500 mb-1" />
                  <span className="text-[10px]">Camera Disabled</span>
                </div>
              )}
              {/* Local user badge */}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] text-white flex items-center gap-1.5 font-medium">
                <span>You ({userRole})</span>
                {!isAudioEnabled && <MicOff className="h-2.5 w-2.5 text-rose-400" />}
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-navy-900/90 text-slate-400">
              <Camera className="h-6 w-6 text-teal-400/80 mb-1" />
              <p className="text-[10px] text-slate-300 font-medium">Camera Inactive</p>
            </div>
          )}
        </div>

        {/* Permission Request Overlay (When media not yet started) */}
        {!permissionGranted && (
          <div className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-30 animate-in fade-in">
            <div className="max-w-md w-full bg-navy-900 border border-navy-700 rounded-2xl p-6 text-center shadow-2xl space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center mx-auto shadow-inner">
                <Camera className="h-8 w-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Join Video Consultation</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  RuralCare 360 requires access to your camera and microphone to establish this telemedicine consultation.
                </p>
              </div>

              {permissionError && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 text-xs text-left flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-rose-300">Device Access Notice</p>
                    <p className="text-[11px] mt-0.5 text-rose-300/90">{permissionError}</p>
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLeave}
                  className="bg-transparent border-navy-700 text-slate-300 hover:bg-navy-800 hover:text-white"
                >
                  Exit Room
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Camera className="h-4 w-4" />}
                  onClick={handleStartSession}
                >
                  Enable Camera & Join Call
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Controls */}
      <div className="p-4 bg-navy-900/95 border-t border-navy-800 flex items-center justify-center z-20">
        <MediaControls
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onLeaveCall={onLeave}
          disabled={!permissionGranted}
        />
      </div>
    </div>
  );
};

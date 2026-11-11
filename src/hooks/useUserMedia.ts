import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseUserMediaReturn {
  stream: MediaStream | null;
  videoTrack: MediaStreamTrack | null;
  audioTrack: MediaStreamTrack | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  permissionGranted: boolean;
  permissionError: string | null;
  toggleVideo: () => void;
  toggleAudio: () => void;
  startMedia: () => Promise<MediaStream | null>;
  stopMedia: () => void;
}

export function useUserMedia(): UseUserMediaReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);

  const startMedia = useCallback(async (): Promise<MediaStream | null> => {
    setPermissionError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera and microphone access is not supported on this browser or connection is not secure (requires HTTPS or localhost).');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setPermissionGranted(true);
      setIsVideoEnabled(true);
      setIsAudioEnabled(true);
      return mediaStream;
    } catch (err: any) {
      console.warn('Media permission failed:', err);
      let message = 'Unable to access camera or microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera and microphone access was denied. Please allow camera and microphone permissions in your browser address bar.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No camera or microphone devices were detected on this machine.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = 'Hardware device is currently in use by another application.';
      } else {
        message = err.message || message;
      }
      setPermissionError(message);
      setPermissionGranted(false);
      return null;
    }
  }, []);

  const stopMedia = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (streamRef.current) {
      const vTrack = streamRef.current.getVideoTracks()[0];
      if (vTrack) {
        vTrack.enabled = !vTrack.enabled;
        setIsVideoEnabled(vTrack.enabled);
      }
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (streamRef.current) {
      const aTrack = streamRef.current.getAudioTracks()[0];
      if (aTrack) {
        aTrack.enabled = !aTrack.enabled;
        setIsAudioEnabled(aTrack.enabled);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      stopMedia();
    };
  }, [stopMedia]);

  const videoTrack = stream?.getVideoTracks()[0] || null;
  const audioTrack = stream?.getAudioTracks()[0] || null;

  return {
    stream,
    videoTrack,
    audioTrack,
    isVideoEnabled,
    isAudioEnabled,
    permissionGranted,
    permissionError,
    toggleVideo,
    toggleAudio,
    startMedia,
    stopMedia,
  };
}


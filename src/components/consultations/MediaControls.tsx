import React from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Settings, Shield } from 'lucide-react';

interface MediaControlsProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onLeaveCall: () => void;
  disabled?: boolean;
}

export const MediaControls: React.FC<MediaControlsProps> = ({
  isAudioEnabled,
  isVideoEnabled,
  onToggleAudio,
  onToggleVideo,
  onLeaveCall,
  disabled = false,
}) => {
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4 px-6 py-3.5 bg-navy-950/90 backdrop-blur-md rounded-2xl border border-navy-800 shadow-2xl">
      {/* Microphone Toggle */}
      <button
        onClick={onToggleAudio}
        disabled={disabled}
        className={`p-3.5 rounded-full transition-all duration-200 flex items-center justify-center ${
          isAudioEnabled
            ? 'bg-navy-800 hover:bg-navy-700 text-white ring-1 ring-slate-700'
            : 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-500/40'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isAudioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
        aria-label={isAudioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
      >
        {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </button>

      {/* Camera Toggle */}
      <button
        onClick={onToggleVideo}
        disabled={disabled}
        className={`p-3.5 rounded-full transition-all duration-200 flex items-center justify-center ${
          isVideoEnabled
            ? 'bg-navy-800 hover:bg-navy-700 text-white ring-1 ring-slate-700'
            : 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-500/40'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
        aria-label={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
      >
        {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </button>

      {/* End / Leave Call */}
      <button
        onClick={onLeaveCall}
        className="px-5 py-3 rounded-full bg-emergency-600 hover:bg-emergency-700 text-white font-semibold text-xs transition-all duration-200 flex items-center gap-2 shadow-lg shadow-rose-950/40 hover:scale-105"
        title="Leave Consultation"
        aria-label="Leave Consultation"
      >
        <PhoneOff className="h-4 w-4" />
        <span className="hidden sm:inline">Leave Call</span>
      </button>
    </div>
  );
};


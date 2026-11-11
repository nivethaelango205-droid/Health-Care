import React, { useEffect, useState, useRef } from 'react';
import { Volume2, Mic, Sparkles, AlertCircle, type LucideIcon } from 'lucide-react';

export type AvatarState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'disconnected' | 'error';

interface SpeakingAvatarProps {
  state: AvatarState;
  amplitude: number; // 0.0 (silent) to 1.0 (loud)
  className?: string;
  assistantName?: string;
  compact?: boolean;
}

interface StatusItem {
  label: string;
  color: string;
  icon: LucideIcon;
  glow: string;
}

const STATUS_CONFIG: Record<AvatarState, StatusItem> = {
  idle: {
    label: 'காத்திருக்கிறது (Ready)',
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    icon: Sparkles,
    glow: 'shadow-emerald-500/10',
  },
  connecting: {
    label: 'இணைக்கப்படுகிறது (Connecting...)',
    color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: Sparkles,
    glow: 'shadow-amber-500/10',
  },
  listening: {
    label: 'கவனிக்கிறது (Listening to you...)',
    color: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    icon: Mic,
    glow: 'shadow-sky-500/30 ring-4 ring-sky-500/30',
  },
  thinking: {
    label: 'யோசிக்கிறது (Analyzing...)',
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    icon: Sparkles,
    glow: 'shadow-purple-500/30 ring-4 ring-purple-500/30',
  },
  speaking: {
    label: 'பேசுகிறது (Speaking Tamil...)',
    color: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    icon: Volume2,
    glow: 'shadow-teal-500/40 ring-4 ring-teal-500/40',
  },
  disconnected: {
    label: 'இணைப்பு இல்லை (Disconnected)',
    color: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    icon: AlertCircle,
    glow: '',
  },
  error: {
    label: 'தவறு (Connection Error)',
    color: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    icon: AlertCircle,
    glow: 'shadow-rose-500/20',
  },
};

export const SpeakingAvatar: React.FC<SpeakingAvatarProps> = ({
  state,
  amplitude,
  className = '',
  assistantName = 'ரூரல்கேர் அசிஸ்ட் (RuralCare Assist)',
  compact = false,
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [smoothedAmp, setSmoothedAmp] = useState(0);
  const smoothedAmpRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // Smooth amplitude transitions for natural lip movement
  useEffect(() => {
    let currentAmp = smoothedAmpRef.current;
    const targetAmp = state === 'speaking' ? Math.min(Math.max(amplitude, 0), 1) : 0;

    const smooth = () => {
      currentAmp += (targetAmp - currentAmp) * 0.35;
      smoothedAmpRef.current = currentAmp;
      setSmoothedAmp(currentAmp);

      if (Math.abs(targetAmp - currentAmp) > 0.01 || state === 'speaking') {
        animFrameRef.current = requestAnimationFrame(smooth);
      }
    };

    animFrameRef.current = requestAnimationFrame(smooth);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [amplitude, state]);

  // Occasional natural blinking (every 3 to 5 seconds)
  useEffect(() => {
    if (state === 'disconnected') return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let blinkTimeoutId: ReturnType<typeof setTimeout> | undefined;

    const scheduleBlink = () => {
      const delay = 2500 + Math.random() * 3000;
      timeoutId = setTimeout(() => {
        setIsBlinking(true);
        blinkTimeoutId = setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 160);
      }, delay);
    };

    scheduleBlink();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (blinkTimeoutId) clearTimeout(blinkTimeoutId);
    };
  }, [state]);

  // Mouth aperture: height scale from 0.0 (closed smile) to 1.0 (wide open viseme)
  const mouthHeight = Math.max(0, Math.min(smoothedAmp * 26, 26));
  const mouthWidth = 32 + smoothedAmp * 10;

  // Active status config based on current avatar state
  const currentStatus = STATUS_CONFIG[state] || STATUS_CONFIG.idle;
  const StatusIcon = currentStatus.icon;

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Background ambient medical glow */}
      <div
        className={`absolute inset-0 rounded-full blur-3xl opacity-30 transition-all duration-700 pointer-events-none ${
          state === 'speaking'
            ? 'bg-teal-400/40 scale-110'
            : state === 'listening'
            ? 'bg-sky-400/40 scale-105'
            : state === 'thinking'
            ? 'bg-purple-500/30 scale-105 animate-pulse'
            : 'bg-teal-900/20 scale-100'
        }`}
      />

      {/* Main Avatar Canvas / SVG Frame */}
      <div
        className={`relative z-10 ${
          compact ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-72 h-72 sm:w-84 sm:h-84 md:w-96 md:h-96'
        } rounded-full p-1.5 bg-gradient-to-b from-navy-800 to-navy-950 border-2 border-teal-500/30 shadow-2xl transition-all duration-500 ${currentStatus.glow}`}
      >
        <svg
          viewBox="0 0 300 300"
          className="w-full h-full rounded-full overflow-hidden"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Background radial gradient */}
            <radialGradient id="clinicBg" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="60%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#081726" />
            </radialGradient>

            {/* Skin tone gradient */}
            <linearGradient id="skinTone" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e5a87b" />
              <stop offset="100%" stopColor="#d28e5e" />
            </linearGradient>

            {/* Hair gradient */}
            <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#221e1e" />
              <stop offset="100%" stopColor="#0d0c0c" />
            </linearGradient>

            {/* Doctor coat gradient */}
            <linearGradient id="doctorCoat" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>

            {/* Teal scrub collar */}
            <linearGradient id="scrubCollar" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0d9488" />
              <stop offset="100%" stopColor="#0f766e" />
            </linearGradient>

            {/* Stethoscope metallic gradient */}
            <linearGradient id="stethoMetal" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <rect width="300" height="300" fill="url(#clinicBg)" />

          {/* Clinic soft backdrop cross */}
          <g opacity="0.08" stroke="#38bdf8" strokeWidth="6">
            <line x1="150" y1="40" x2="150" y2="100" />
            <line x1="120" y1="70" x2="180" y2="70" />
          </g>

          {/* Subtle Breathing Float Group */}
          <g
            className={`transition-transform duration-1000 ${
              state === 'disconnected'
                ? 'opacity-60'
                : 'animate-[bounce_5s_ease-in-out_infinite]'
            }`}
          >
            {/* Torso & Doctor's Apron / Scrubs */}
            {/* Teal scrub base */}
            <path d="M 90 230 Q 150 250 210 230 L 225 300 L 75 300 Z" fill="url(#scrubCollar)" />
            {/* Scrub V-neck */}
            <polygon points="125,230 175,230 150,265" fill="#115e59" />

            {/* White Doctor's Lab Coat Left */}
            <path
              d="M 50 250 Q 80 235 120 235 L 115 300 L 40 300 Z"
              fill="url(#doctorCoat)"
              stroke="#cbd5e1"
              strokeWidth="0.8"
            />
            {/* White Doctor's Lab Coat Right */}
            <path
              d="M 250 250 Q 220 235 180 235 L 185 300 L 260 300 Z"
              fill="url(#doctorCoat)"
              stroke="#cbd5e1"
              strokeWidth="0.8"
            />

            {/* Stethoscope around neck */}
            {/* Left tube */}
            <path
              d="M 115 228 Q 105 260 120 280 Q 130 295 145 285"
              fill="none"
              stroke="#0f172a"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Right tube with chest piece */}
            <path
              d="M 185 228 Q 195 260 180 280 Q 170 295 155 285"
              fill="none"
              stroke="#0f172a"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Stethoscope bell */}
            <circle cx="150" cy="285" r="9" fill="url(#stethoMetal)" stroke="#334155" strokeWidth="1.5" />
            <circle cx="150" cy="285" r="4" fill="#0f766e" />

            {/* Neck */}
            <rect x="135" y="195" width="30" height="40" rx="6" fill="#c98254" />
            {/* Neck shadow */}
            <ellipse cx="150" cy="205" rx="14" ry="5" fill="#ab6a41" opacity="0.4" />

            {/* Back Hair Bun */}
            <circle cx="150" cy="95" r="54" fill="url(#hairGrad)" />

            {/* Ears */}
            <ellipse cx="98" cy="155" rx="8" ry="12" fill="#d28e5e" />
            <circle cx="98" cy="162" r="2.5" fill="#f8fafc" /> {/* Small earring */}
            <ellipse cx="202" cy="155" rx="8" ry="12" fill="#d28e5e" />
            <circle cx="202" cy="162" r="2.5" fill="#f8fafc" />

            {/* Face Oval */}
            <path
              d="M 104 135 C 104 88 196 88 196 135 C 196 182 178 214 150 214 C 122 214 104 182 104 135 Z"
              fill="url(#skinTone)"
            />

            {/* Hair Front Styling */}
            <path
              d="M 102 128 C 104 80 145 80 150 102 C 155 80 196 80 198 128 C 192 108 175 96 150 108 C 125 96 108 108 102 128 Z"
              fill="url(#hairGrad)"
            />
            {/* Side hair strands */}
            <path d="M 103 125 Q 98 145 101 165 Q 106 145 106 128 Z" fill="url(#hairGrad)" />
            <path d="M 197 125 Q 202 145 199 165 Q 194 145 194 128 Z" fill="url(#hairGrad)" />

            {/* Traditional small auspicious Bindi (cultural health worker touch) */}
            <circle cx="150" cy="130" r="2.2" fill="#991b1b" />

            {/* Eyebrows */}
            <path
              d="M 120 137 Q 130 134 140 138"
              fill="none"
              stroke="#261a15"
              strokeWidth="2.4"
              strokeLinecap="round"
              className={state === 'listening' || state === 'thinking' ? '-translate-y-0.5' : ''}
            />
            <path
              d="M 160 138 Q 170 134 180 137"
              fill="none"
              stroke="#261a15"
              strokeWidth="2.4"
              strokeLinecap="round"
              className={state === 'listening' || state === 'thinking' ? '-translate-y-0.5' : ''}
            />

            {/* Eyes */}
            {isBlinking || state === 'disconnected' ? (
              // Closed eye lids
              <g stroke="#261a15" strokeWidth="2.2" strokeLinecap="round" fill="none">
                <path d="M 122 148 Q 131 154 139 148" />
                <path d="M 161 148 Q 169 154 178 148" />
              </g>
            ) : (
              // Open animated expressive eyes
              <g>
                {/* Left eye */}
                <ellipse cx="130" cy="148" rx="8" ry="6.5" fill="#ffffff" />
                <circle cx="131" cy="148" r="4.2" fill="#38241c" />
                <circle cx="132" cy="148" r="2.2" fill="#0f172a" />
                <circle cx="133" cy="146.5" r="1.4" fill="#ffffff" /> {/* Eye reflection */}
                <path d="M 122 144 Q 130 141 138 144" fill="none" stroke="#1f2937" strokeWidth="1.8" />

                {/* Right eye */}
                <ellipse cx="170" cy="148" rx="8" ry="6.5" fill="#ffffff" />
                <circle cx="169" cy="148" r="4.2" fill="#38241c" />
                <circle cx="168" cy="148" r="2.2" fill="#0f172a" />
                <circle cx="169" cy="146.5" r="1.4" fill="#ffffff" /> {/* Eye reflection */}
                <path d="M 162 144 Q 170 141 178 144" fill="none" stroke="#1f2937" strokeWidth="1.8" />
              </g>
            )}

            {/* Nose */}
            <path
              d="M 150 149 L 148 165 Q 150 168 153 167"
              fill="none"
              stroke="#ab6a41"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Small traditional nose stud */}
            <circle cx="145" cy="166" r="1.2" fill="#fbbf24" />

            {/* Cheeks soft blush */}
            <ellipse cx="120" cy="164" rx="7" ry="4" fill="#f87171" opacity="0.22" />
            <ellipse cx="180" cy="164" rx="7" ry="4" fill="#f87171" opacity="0.22" />

            {/* DYNAMIC SPEAKING MOUTH */}
            <g transform={`translate(150, 184)`}>
              {mouthHeight > 2 ? (
                // Open speaking mouth shaped by live audio volume
                <g>
                  {/* Inside mouth dark cavity */}
                  <ellipse
                    cx="0"
                    cy="0"
                    rx={mouthWidth / 2}
                    ry={mouthHeight / 2}
                    fill="#581c1c"
                    stroke="#991b1b"
                    strokeWidth="1.2"
                  />
                  {/* Teeth bar */}
                  <rect
                    x={-(mouthWidth / 3)}
                    y={-(mouthHeight / 2)}
                    width={(mouthWidth * 2) / 3}
                    height={Math.min(mouthHeight * 0.4, 4)}
                    rx="1.5"
                    fill="#ffffff"
                    opacity="0.9"
                  />
                  {/* Tongue */}
                  {mouthHeight > 8 && (
                    <ellipse
                      cx="0"
                      cy={mouthHeight * 0.28}
                      rx={mouthWidth * 0.32}
                      ry={mouthHeight * 0.28}
                      fill="#e11d48"
                      opacity="0.85"
                    />
                  )}
                  {/* Upper and lower lip outlines */}
                  <path
                    d={`M ${-mouthWidth / 2} 0 Q 0 ${-(mouthHeight * 0.3)} ${mouthWidth / 2} 0`}
                    fill="none"
                    stroke="#b91c1c"
                    strokeWidth="2"
                  />
                  <path
                    d={`M ${-mouthWidth / 2} 0 Q 0 ${mouthHeight * 0.4} ${mouthWidth / 2} 0`}
                    fill="none"
                    stroke="#b91c1c"
                    strokeWidth="2"
                  />
                </g>
              ) : (
                // Gentle, warm resting smile
                <path
                  d="M -13 -1 Q 0 7 13 -1"
                  fill="none"
                  stroke="#991b1b"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
              )}
            </g>
          </g>
        </svg>

        {/* Real-time Voice Audio Visualizer Wavebars (Around bottom of avatar frame) */}
        {state === 'speaking' && (
          <div
            className={`absolute ${
              compact ? '-bottom-2 inset-x-2 py-0.5 px-1.5' : '-bottom-3 inset-x-12 py-1 px-3'
            } flex items-center justify-center gap-1 bg-navy-950/90 rounded-full border border-teal-500/50 shadow-lg backdrop-blur-md`}
          >
            {[0.4, 0.9, 0.6, 1.0, 0.7, 0.3, 0.8].map((mult, i) => {
              const barHeight = Math.max(compact ? 2 : 4, Math.min(compact ? 12 : 24, smoothedAmp * (compact ? 14 : 28) * mult));
              return (
                <span
                  key={i}
                  className="w-1 bg-gradient-to-t from-teal-500 to-emerald-400 rounded-full transition-all duration-75"
                  style={{ height: `${barHeight}px` }}
                />
              );
            })}
          </div>
        )}

        {/* Listening Sound Waveform Pulse */}
        {state === 'listening' && (
          <div
            className={`absolute ${
              compact ? '-bottom-2 inset-x-1 py-0.5 px-1.5' : '-bottom-3 inset-x-12 py-1 px-3'
            } flex items-center justify-center gap-1 bg-navy-950/90 rounded-full border border-sky-500/50 shadow-lg backdrop-blur-md`}
          >
            <Mic className="h-3 w-3 text-sky-400 animate-pulse mr-0.5" />
            <span className="text-[10px] font-semibold text-sky-300 tracking-wide">
              பேசுங்கள்...
            </span>
          </div>
        )}
      </div>

      {/* Assistant Title & Real-Time Status Pill (Only in full/consultation mode) */}
      {!compact && (
        <div className="mt-5 flex flex-col items-center text-center gap-2 z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {assistantName}
            </h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
              AI Assistant
            </span>
          </div>

          {/* Dynamic State Pill */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors shadow-sm ${currentStatus.color}`}
          >
            <StatusIcon className="h-3.5 w-3.5 animate-spin-slow" />
            <span>{currentStatus.label}</span>
          </div>
        </div>
      )}
    </div>
  );
};


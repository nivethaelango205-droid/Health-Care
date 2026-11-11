import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { aiAssistantService, getPageMetadata, PageMetadata } from '../services/aiAssistantService';
import { AvatarState } from '../components/avatar/SpeakingAvatar';

export interface AssistantCaption {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionId?: string;
  actionTarget?: string;
}

export interface AssistantAction {
  actionId: string;
  actionTarget?: string;
  labelEn: string;
  labelTa: string;
}

interface GlobalAssistantContextType {
  isOpen: boolean;
  isMinimized: boolean;
  language: 'ta' | 'en';
  avatarState: AvatarState;
  amplitude: number;
  currentCaption: AssistantCaption | null;
  history: AssistantCaption[];
  pageMeta: PageMetadata;
  activeAction: AssistantAction | null;
  isListening: boolean;
  isSpeaking: boolean;
  isSpeakerOn: boolean;
  openAssistant: () => void;
  closeAssistant: () => void;
  toggleMinimize: () => void;
  setLanguage: (lang: 'ta' | 'en') => void;
  toggleSpeaker: () => void;
  startListening: () => void;
  stopListening: () => void;
  sendMessage: (text: string) => Promise<void>;
  repeatLastInstruction: () => void;
  executeAction: (action: AssistantAction) => void;
  highlightElement: (selector: string) => void;
}

const GlobalAssistantContext = createContext<GlobalAssistantContextType | undefined>(undefined);

export const GlobalAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [language, setLanguageState] = useState<'ta' | 'en'>('ta');
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  const [amplitude, setAmplitude] = useState<number>(0);
  const [currentCaption, setCurrentCaption] = useState<AssistantCaption | null>(null);
  const [history, setHistory] = useState<AssistantCaption[]>([]);
  const [activeAction, setActiveAction] = useState<AssistantAction | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);

  // Audio References
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const lastInstructionRef = useRef<string>('');
  const lastAudioBufferRef = useRef<ArrayBuffer | null>(null);
  const userExplicitLanguageRef = useRef<boolean>(false);
  const previousRoleRef = useRef<string | undefined>(user?.role);

  const pageMeta = getPageMetadata(location.pathname);

  // Role and route change listener
  useEffect(() => {
    if (user?.role !== previousRoleRef.current) {
      previousRoleRef.current = user?.role;
      setHistory([]);
      setCurrentCaption(null);
      setActiveAction(null);
      if (currentSourceRef.current) {
        try { currentSourceRef.current.stop(); } catch {}
      }
      setIsSpeaking(false);
      setAvatarState('idle');
    }
  }, [user?.role]);

  useEffect(() => {
    if (!userExplicitLanguageRef.current && location.pathname.startsWith('/patient')) {
      setLanguageState('ta');
    }
  }, [location.pathname]);

  // Audio setup
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      analyserRef.current.connect(gainNodeRef.current);
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return {
      ctx: audioContextRef.current,
      analyser: analyserRef.current!,
      gain: gainNodeRef.current!,
    };
  }, []);

  // Real-time lip-sync amplitude tracker
  const startLipSync = useCallback(() => {
    if (!analyserRef.current) return;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / bufferLength) / 128;
      setAmplitude(Math.min(rms * 1.8, 1.0));
      animFrameRef.current = requestAnimationFrame(update);
    };
    update();
  }, []);

  // Stop current playing audio
  const stopAudio = useCallback(() => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch {}
      currentSourceRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsSpeaking(false);
    setAmplitude(0);
    setAvatarState('idle');
  }, []);

  // Play synthesized audio buffer with mouth animation
  const playAudio = useCallback(
    async (arrayBuffer: ArrayBuffer): Promise<void> => {
      stopAudio();
      const { ctx, analyser, gain } = getAudioContext();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyser);
      gain.gain.value = isSpeakerOn ? 1.0 : 0.0;
      currentSourceRef.current = source;

      setIsSpeaking(true);
      setAvatarState('speaking');
      startLipSync();

      return new Promise((resolve) => {
        source.onended = () => {
          stopAudio();
          resolve();
        };
        source.start(0);
      });
    },
    [getAudioContext, isSpeakerOn, startLipSync, stopAudio]
  );

  // Fallback speech synthesis if audio buffer playback fails or is unavailable
  const fallbackSpeak = useCallback(
    (text: string, lang: 'ta' | 'en'): Promise<void> => {
      return new Promise((resolve) => {
        if (!('speechSynthesis' in window)) {
          resolve();
          return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;

        // Try to pick a voice matching the language
        const voices = window.speechSynthesis.getVoices();
        const matchingVoice = voices.find((v) => v.lang.toLowerCase().includes(lang));
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        } else if (lang === 'ta') {
          // If no Tamil voice exists on client machine, do not speak with English voice!
          console.warn('No native Tamil voice on client OS; subtitles displayed cleanly.');
          resolve();
          return;
        }

        let interval: NodeJS.Timeout | null = null;
        utterance.onstart = () => {
          setIsSpeaking(true);
          setAvatarState('speaking');
          interval = setInterval(() => {
            setAmplitude(0.2 + Math.random() * 0.5);
          }, 120);
        };

        const cleanup = () => {
          if (interval) clearInterval(interval);
          setIsSpeaking(false);
          setAmplitude(0);
          setAvatarState('idle');
          resolve();
        };

        utterance.onend = cleanup;
        utterance.onerror = cleanup;
        window.speechSynthesis.speak(utterance);
      });
    },
    []
  );

  // Highlight a specific button or element on the page
  const highlightElement = useCallback((selector: string) => {
    try {
      const el = document.querySelector(selector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-4', 'ring-teal-400', 'ring-offset-2', 'transition-all', 'duration-300');
        setTimeout(() => {
          el.classList.remove('ring-4', 'ring-teal-400', 'ring-offset-2');
        }, 4000);
      }
    } catch (e) {
      console.warn('Could not highlight element:', selector, e);
    }
  }, []);

  // Execute suggested navigation or UI action
  const executeAction = useCallback(
    (action: AssistantAction) => {
      switch (action.actionId) {
        case 'navigate_doctors':
          navigate('/patient/doctors');
          break;
        case 'navigate_appointments':
          navigate('/patient/appointments');
          break;
        case 'navigate_consultations':
          navigate('/patient/consultations');
          break;
        case 'navigate_records':
          navigate('/patient/records');
          break;
        case 'navigate_ambulance':
          navigate('/patient/ambulance');
          break;
        case 'navigate_dashboard':
          navigate(user?.role === 'doctor' ? '/doctor/dashboard' : user?.role === 'admin' ? '/admin/dashboard' : '/patient/dashboard');
          break;
        case 'call_112':
          window.location.href = 'tel:112';
          break;
        case 'call_108':
          window.location.href = 'tel:108';
          break;
        case 'highlight_element':
          if (action.actionTarget) highlightElement(action.actionTarget);
          break;
        default:
          break;
      }
      setActiveAction(null);
    },
    [highlightElement, navigate, user?.role]
  );

  // Send a message to AI Assistant
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userCaption: AssistantCaption = {
        id: `usr-${Date.now()}`,
        sender: 'user',
        text: trimmed,
        timestamp: new Date().toISOString(),
      };

      setCurrentCaption(userCaption);
      setHistory((prev) => [...prev, userCaption]);
      setAvatarState('thinking');

      try {
        const historyTurns = history.slice(-6).map((h) => ({
          sender: h.sender,
          text: h.text,
        }));

        const response = await aiAssistantService.askVoice({
          message: trimmed,
          history: historyTurns,
          language,
          role: user?.role || 'patient',
          currentPage: location.pathname,
          availableActions: pageMeta.keyActions.map((a) => a.id),
        });

        lastInstructionRef.current = response.reply;

        const asstCaption: AssistantCaption = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: response.reply,
          timestamp: new Date().toISOString(),
          actionId: response.actionId,
          actionTarget: response.actionTarget,
        };

        setCurrentCaption(asstCaption);
        setHistory((prev) => [...prev, asstCaption]);

        // If action received, prepare interactive action pill
        if (response.actionId) {
          const actionMeta: Record<string, { labelEn: string; labelTa: string }> = {
            navigate_doctors: { labelEn: 'Go to Find Doctors', labelTa: 'மருத்துவர்கள் பக்கம் போங்கள்' },
            navigate_appointments: { labelEn: 'Go to My Appointments', labelTa: 'எனது சந்திப்புகள் பக்கம் போங்கள்' },
            navigate_consultations: { labelEn: 'Open Video Consultation', labelTa: 'வீடியோ அழைப்பை திறக்கவும்' },
            navigate_records: { labelEn: 'Go to Health Records', labelTa: 'மருத்துவ பதிவுகள் பக்கம் போங்கள்' },
            navigate_ambulance: { labelEn: 'Open Ambulance Assistance', labelTa: 'ஆம்புலன்ஸ் உதவி பக்கம் போங்கள்' },
            navigate_dashboard: { labelEn: 'Go to Dashboard', labelTa: 'முகப்பு பலகைக்கு போங்கள்' },
            call_112: { labelEn: 'Call 112 (National Emergency)', labelTa: '112 அவசர அழைப்பு' },
            call_108: { labelEn: 'Call 108 (State Ambulance)', labelTa: '108 ஆம்புலன்ஸ் அழைப்பு' },
            open_form: { labelEn: 'Fill Request Form', labelTa: 'கோரிக்கை படிவம் நிரப்புக' },
            share_location: { labelEn: 'Share GPS Location', labelTa: 'இருப்பிடம் பகிர்க' },
            check_status: { labelEn: 'Check Request Status', labelTa: 'நிலை சரிபார்க்கவும்' },
            highlight_element: { labelEn: 'View Highlighted Button', labelTa: 'குறிப்பிட்ட பட்டனை காண்க' },
          };

          const matched = actionMeta[response.actionId] || {
            labelEn: 'Take Action',
            labelTa: 'செயல்படுங்கள்',
          };

          setActiveAction({
            actionId: response.actionId,
            actionTarget: response.actionTarget,
            labelEn: matched.labelEn,
            labelTa: matched.labelTa,
          });

          // Auto-highlight if requested
          if (response.actionTarget) {
            highlightElement(response.actionTarget);
          }
        } else {
          setActiveAction(null);
        }

        // Play real Gemini TTS Audio
        if (response.audioBase64) {
          try {
            const binary = atob(response.audioBase64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            lastAudioBufferRef.current = bytes.buffer;
            await playAudio(bytes.buffer);
          } catch (audioErr) {
            console.warn('Audio decoding fallback:', audioErr);
            await fallbackSpeak(response.reply, response.language);
          }
        } else {
          lastAudioBufferRef.current = null;
          await fallbackSpeak(response.reply, response.language);
        }
      } catch (err) {
        console.error('Assistant error:', err);
        const errReply =
          language === 'ta'
            ? 'மன்னிக்கவும், தகவல் பெறுவதில் சிறிய சிக்கல். அவசர உதவிக்கு 108 அல்லது 112 ஐ அழைக்கவும்.'
            : 'Sorry, could not process request right now. In emergencies please dial 108 or 112.';

        const errCaption: AssistantCaption = {
          id: `asst-err-${Date.now()}`,
          sender: 'assistant',
          text: errReply,
          timestamp: new Date().toISOString(),
        };

        setCurrentCaption(errCaption);
        setHistory((prev) => [...prev, errCaption]);
        await fallbackSpeak(errReply, language);
      }
    },
    [fallbackSpeak, highlightElement, history, language, location.pathname, pageMeta.keyActions, playAudio, user?.role]
  );

  // Repeat last instruction (replays authentic Gemini Tamil audio if available)
  const repeatLastInstruction = useCallback(async () => {
    if (lastAudioBufferRef.current) {
      await playAudio(lastAudioBufferRef.current);
    } else if (lastInstructionRef.current) {
      await fallbackSpeak(lastInstructionRef.current, language);
    }
  }, [fallbackSpeak, language, playAudio]);

  // Speech Recognition Setup
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please type your message.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }

      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = language === 'ta' ? 'ta-IN' : 'en-IN';

      rec.onstart = () => {
        setIsListening(true);
        setAvatarState('listening');
      };

      rec.onresult = (e: any) => {
        const transcript = Array.from(e.results)
          .map((r: any) => r[0].transcript)
          .join('');

        if (transcript) {
          setCurrentCaption({
            id: 'interim',
            sender: 'user',
            text: transcript,
            timestamp: new Date().toISOString(),
          });
        }

        if (e.results[0].isFinal) {
          rec.stop();
          sendMessage(transcript);
        }
      };

      rec.onerror = (e: any) => {
        console.warn('Speech recognition warning:', e.error);
        setIsListening(false);
        setAvatarState('idle');
      };

      rec.onend = () => {
        setIsListening(false);
        if (avatarState === 'listening') {
          setAvatarState('idle');
        }
      };

      rec.start();
      recognitionRef.current = rec;
    } catch (err) {
      console.warn('Could not start recognition:', err);
      setIsListening(false);
    }
  }, [avatarState, language, sendMessage]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
    setAvatarState('idle');
  }, []);

  const openAssistant = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const closeAssistant = useCallback(() => {
    setIsOpen(false);
    stopAudio();
    stopListening();
  }, [stopAudio, stopListening]);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  const setLanguage = useCallback((lang: 'ta' | 'en') => {
    userExplicitLanguageRef.current = true;
    setLanguageState(lang);
  }, []);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => !prev);
  }, []);

  // Update initial greeting when opening the first time
  useEffect(() => {
    if (history.length === 0) {
      const initialGreeting: AssistantCaption = {
        id: 'init-asst',
        sender: 'assistant',
        text:
          language === 'ta'
            ? 'வணக்கம்! நான் உங்கள் ரூரல்கேர் AI வழிகாட்டி. மருத்துவ ஆலோசனை பெற, முன்பதிவு செய்ய அல்லது அவசர உதவிக்கு என்னை கேட்கலாம்.'
            : 'Hello! I am your RuralCare AI Guide. Ask me anything to navigate appointments, medical records, or emergency assistance.',
        timestamp: new Date().toISOString(),
      };
      setHistory([initialGreeting]);
      lastInstructionRef.current = initialGreeting.text;
    }
  }, [history.length, language]);

  return (
    <GlobalAssistantContext.Provider
      value={{
        isOpen,
        isMinimized,
        language,
        avatarState,
        amplitude,
        currentCaption,
        history,
        pageMeta,
        activeAction,
        isListening,
        isSpeaking,
        isSpeakerOn,
        openAssistant,
        closeAssistant,
        toggleMinimize,
        setLanguage,
        toggleSpeaker,
        startListening,
        stopListening,
        sendMessage,
        repeatLastInstruction,
        executeAction,
        highlightElement,
      }}
    >
      {children}
    </GlobalAssistantContext.Provider>
  );
};

export const useGlobalAssistant = () => {
  const context = useContext(GlobalAssistantContext);
  if (!context) {
    throw new Error('useGlobalAssistant must be used within a GlobalAssistantProvider');
  }
  return context;
};


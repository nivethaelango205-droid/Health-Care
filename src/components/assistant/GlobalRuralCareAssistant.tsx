import React, { useState, useRef, useEffect } from 'react';
import { useGlobalAssistant } from '../../contexts/GlobalAssistantContext';
import { SpeakingAvatar } from '../avatar/SpeakingAvatar';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Minus,
  Maximize2,
  Send,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Bot,
  HeartPulse,
} from 'lucide-react';

export const GlobalRuralCareAssistant: React.FC = () => {
  const {
    isOpen,
    isMinimized,
    language,
    avatarState,
    amplitude,
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
  } = useGlobalAssistant();

  const [inputMessage, setInputMessage] = useState('');
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [history, isSpeaking]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;
    sendMessage(inputMessage);
    setInputMessage('');
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const suggestions = language === 'ta' ? pageMeta.suggestionsTa : pageMeta.suggestionsEn;

  // 1. FLOATING LAUNCHER BUTTON (when closed or minimized)
  if (!isOpen || isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 group">
        <button
          onClick={openAssistant}
          className="flex items-center gap-2.5 sm:gap-3 bg-gradient-to-r from-navy-950 via-navy-900 to-teal-900 text-white pl-3 pr-3.5 sm:pl-3.5 sm:pr-4 py-2 sm:py-2.5 rounded-full shadow-2xl border border-teal-500/40 hover:border-teal-400 hover:scale-105 active:scale-95 transition-all duration-200"
          aria-label="Open RuralCare AI Assistant"
        >
          {/* Avatar Icon with Pulse Ring */}
          <div className="relative">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-teal-600 border-2 border-white flex items-center justify-center text-white shadow-md overflow-hidden">
              <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            {/* Live Indicator */}
            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-navy-900 animate-pulse" />
          </div>

          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs tracking-tight text-white">
                {language === 'ta' ? 'AI வழிகாட்டி' : 'AI Guide'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 bg-teal-500/30 text-teal-300 rounded font-semibold border border-teal-500/30">
                {language === 'ta' ? 'தமிழ்' : 'English'}
              </span>
            </div>
            <p className="text-[10px] text-slate-300">
              {language === 'ta' ? 'குரல் உதவிக்கு கிளிக் செய்' : 'Click to talk'}
            </p>
          </div>

          <div className="h-8 w-8 rounded-full bg-teal-700/60 flex items-center justify-center text-teal-200 ml-0.5">
            <Mic className="h-4 w-4" />
          </div>
        </button>
      </div>
    );
  }

  // 2. EXPANDED AI ASSISTANT PANEL (Mobile Bottom Sheet / Desktop Drawer)
  return (
    <div
      className="fixed inset-x-2 bottom-2 sm:inset-x-auto sm:right-6 sm:bottom-6 z-50 w-auto sm:w-[420px] max-w-[calc(100vw-1rem)] sm:max-w-none h-[88vh] sm:h-[660px] max-h-[92vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
      role="dialog"
      aria-labelledby="assistant-title"
    >
      {/* HEADER */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-[#0F2A4A] text-white p-3 sm:p-3.5 px-3.5 sm:px-4 flex items-center justify-between border-b border-navy-800 shrink-0">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
            <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 id="assistant-title" className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                {language === 'ta' ? 'ரூரல்கேர் AI வழிகாட்டி' : 'RuralCare AI Guide'}
              </h2>
            </div>
            <p className="text-[10px] text-teal-300 font-medium truncate">
              {language === 'ta' ? 'மருத்துவ வழிகாட்டி' : 'Navigation Guide'}
            </p>
          </div>
        </div>

        {/* Actions: Language Switch, Minimize, Close */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Language Toggle Pill */}
          <div className="flex bg-navy-800/90 rounded-lg p-0.5 border border-navy-700">
            <button
              onClick={() => setLanguage('ta')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-all min-h-[32px] ${
                language === 'ta'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              தமிழ்
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-all min-h-[32px] ${
                language === 'en'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
          </div>

          <button
            onClick={toggleMinimize}
            title={language === 'ta' ? 'சுருக்குக' : 'Minimize'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={closeAssistant}
            title={language === 'ta' ? 'மூடுக' : 'Close'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* AVATAR STAGE (Lip-syncing healthcare avatar) */}
      <div className="bg-gradient-to-b from-navy-950 to-navy-900 p-2 text-center shrink-0 border-b border-navy-800">
        <div className="relative mx-auto max-w-[200px] h-[115px] flex items-center justify-center">
          <SpeakingAvatar
            state={avatarState}
            amplitude={amplitude}
            compact={true}
            className="h-full w-full max-h-[115px]"
            assistantName={language === 'ta' ? 'ரூரல்கேர் அசிஸ்ட்' : 'RuralCare Assist'}
          />
        </div>

        {/* Current Page Context Pill */}
        <div className="flex items-center justify-center gap-1.5 mt-1 text-[10px] text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
          <span>
            {language === 'ta' ? 'தற்போது: ' + pageMeta.nameTa : 'On: ' + pageMeta.nameEn}
          </span>
        </div>
      </div>

      {/* ACTIVE ACTION PROMPT (If AI recommended a step) */}
      {activeAction && (
        <div className="p-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 flex items-center justify-between gap-2 shrink-0 animate-in slide-in-from-top-2">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
              {language === 'ta' ? 'பரிந்துரைக்கப்பட்ட செயல்' : 'Suggested Action'}
            </span>
            <p className="text-xs font-semibold">
              {language === 'ta' ? activeAction.labelTa : activeAction.labelEn}
            </p>
          </div>
          <button
            onClick={() => executeAction(activeAction)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm shrink-0 flex items-center gap-1 transition-colors"
          >
            <span>{language === 'ta' ? 'திறக்க' : 'Open'}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* LIVE SUBTITLES & CHAT AREA */}
      <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/70">
        {history.map((turn) => (
          <div
            key={turn.id}
            className={`flex items-start gap-2 ${
              turn.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold ${
                turn.sender === 'user'
                  ? 'bg-teal-600 text-white'
                  : 'bg-navy-900 text-teal-400'
              }`}
            >
              {turn.sender === 'user' ? 'U' : <Bot className="h-3.5 w-3.5" />}
            </div>

            <div
              className={`max-w-[82%] p-2.5 rounded-2xl text-xs leading-relaxed ${
                turn.sender === 'user'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-800 border border-slate-200/90 shadow-sm'
              }`}
            >
              <p className="whitespace-pre-line font-medium">{turn.text}</p>
            </div>
          </div>
        ))}

        {avatarState === 'thinking' && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="h-6 w-6 rounded-lg bg-navy-900 text-teal-400 flex items-center justify-center">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-1 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-bounce" />
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      {/* CONTEXTUAL QUICK SUGGESTIONS (Based on current page) */}
      <div className="p-2 border-t border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <Sparkles className="h-3.5 w-3.5 text-teal-600 shrink-0 ml-1" />
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(s)}
            className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-transparent transition-colors shrink-0"
          >
            {s}
          </button>
        ))}
      </div>

      {/* CONTROLS FOOTER: BIG MIC, REPEAT, SPEAKER, TEXT FORM */}
      <div className="p-3 sm:p-3.5 border-t border-slate-200 bg-white space-y-2.5 shrink-0">
        {/* Main Audio Control Bar */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Repeat Instruction */}
          <button
            type="button"
            onClick={repeatLastInstruction}
            title={language === 'ta' ? 'மீண்டும் கேட்கவும்' : 'Repeat Instruction'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold min-h-[44px] transition-colors"
          >
            <RotateCcw className="h-4 w-4 text-teal-600 shrink-0" />
            <span className="text-[11px] leading-tight text-left">
              {language === 'ta' ? 'மீண்டும் கேள்' : 'Repeat Voice'}
            </span>
          </button>

          {/* LARGE ACCESSIBLE MIC BUTTON */}
          <button
            type="button"
            onClick={handleMicClick}
            className={`relative flex items-center justify-center h-13 w-13 min-h-[48px] min-w-[48px] rounded-full transition-all duration-200 shadow-lg ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-4 ring-rose-200'
                : 'bg-teal-600 hover:bg-teal-700 text-white ring-4 ring-teal-100 active:scale-95'
            }`}
            aria-label={isListening ? 'Stop Listening' : 'Start Tamil Voice Input'}
          >
            {isListening ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6 stroke-[2.2]" />
            )}
          </button>

          {/* Speaker / Mute Toggle */}
          <button
            type="button"
            onClick={toggleSpeaker}
            title={isSpeakerOn ? 'Mute Audio' : 'Unmute Audio'}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold min-h-[44px] transition-colors ${
              isSpeakerOn
                ? 'border-teal-200 text-teal-700 bg-teal-50/70'
                : 'border-slate-200 text-slate-400 bg-slate-50'
            }`}
          >
            {isSpeakerOn ? <Volume2 className="h-4 w-4 shrink-0 text-teal-600" /> : <VolumeX className="h-4 w-4 shrink-0" />}
            <span className="text-[11px]">{isSpeakerOn ? (language === 'ta' ? 'ஒலி: ON' : 'Audio ON') : (language === 'ta' ? 'ஒலி: OFF' : 'Muted')}</span>
          </button>
        </div>

        {/* Text Input Row (Accessible Alternative) */}
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              language === 'ta'
                ? 'கேள்வியை தமிழில் தட்டச்சு செய்யலாம்...'
                : 'Type your question here...'
            }
            className="flex-1 text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 min-h-[42px] focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="h-10 w-10 min-h-[40px] min-w-[40px] rounded-xl bg-teal-600 disabled:opacity-40 text-white flex items-center justify-center hover:bg-teal-700 active:scale-95 transition-all shrink-0 shadow-sm"
            aria-label="Send Message"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

        {/* Bottom Safety Label */}
        <p className="text-[10px] text-slate-400 text-center leading-tight">
          {language === 'ta'
            ? 'ரூரல்கேர் AI வழிகாட்டி — அவசரத்திற்கு 108 / 112 ஐ அழைக்கவும்'
            : 'RuralCare AI Guide — For emergencies dial 108 or 112'}
        </p>
      </div>
    </div>
  );
};


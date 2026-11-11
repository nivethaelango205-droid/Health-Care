import React, { useState, useRef, useEffect } from 'react';
import {
  ChatMessage,
  assistanceService,
  INITIAL_GREETING,
} from '../../services/assistanceService';
import { AmbulanceRequest } from '../../types';
import { Button } from '../common/Button';
import {
  Send,
  RotateCcw,
  Sparkles,
  PhoneCall,
  Navigation,
  FileText,
  AlertTriangle,
  Bot,
  User,
  ShieldCheck,
} from 'lucide-react';

interface EmergencyChatPanelProps {
  activeRequests: AmbulanceRequest[];
  onTriggerLocation: () => void;
  onFocusForm: () => void;
}

export const EmergencyChatPanel: React.FC<EmergencyChatPanelProps> = ({
  activeRequests,
  onTriggerLocation,
  onFocusForm,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_GREETING]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeMode, setActiveMode] = useState<'guided' | 'ai'>('guided');
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (messages.length > 1 || isTyping) {
      scrollToBottom();
    }
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await assistanceService.sendMessage(text, newHistory, activeRequests);
      setActiveMode(response.mode);

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        timestamp: new Date().toISOString(),
        actionId: response.actionId,
        mode: response.mode,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'For immediate assistance, please dial 112 or 108 directly. If non-urgent, please submit the request form.',
        timestamp: new Date().toISOString(),
        actionId: 'call_112',
        mode: 'guided',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClear = () => {
    setMessages([INITIAL_GREETING]);
    setActiveMode('guided');
  };

  const suggestions = [
    'How do I request an ambulance?',
    'Help me share my location.',
    'What should I do in an emergency?',
    'Check my assistance request status.',
  ];

  return (
    <div className="flex flex-col h-[650px] bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
      {/* Header */}
      <div className="bg-navy-900 text-white px-5 py-3.5 border-b border-navy-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">RuralCare Assist</h3>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                  activeMode === 'ai'
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
                title={
                  activeMode === 'ai'
                    ? 'Connected to server-side AI model'
                    : 'Safety-verified guided assistance mode'
                }
              >
                {activeMode === 'ai' ? 'AI Assisted' : 'Guided Assistance'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Emergency & Ambulance Guidance</p>
          </div>
        </div>

        <button
          onClick={handleClear}
          title="Reset Conversation"
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-navy-800 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.sender === 'user'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-navy-900 text-teal-400 border border-navy-800'
              }`}
            >
              {msg.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-800 border border-slate-200/80 shadow-sm'
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>

              {/* Action Buttons attached to assistant messages */}
              {msg.actionId && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                  {msg.actionId === 'call_112' && (
                    <a href="tel:112">
                      <Button
                        variant="emergency"
                        size="sm"
                        leftIcon={<PhoneCall className="h-3 w-3" />}
                        className="text-[11px] py-1"
                      >
                        Call 112 Directly
                      </Button>
                    </a>
                  )}

                  {msg.actionId === 'call_108' && (
                    <a href="tel:108">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<PhoneCall className="h-3 w-3" />}
                        className="text-[11px] py-1"
                      >
                        Call 108 Ambulance
                      </Button>
                    </a>
                  )}

                  {msg.actionId === 'share_location' && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Navigation className="h-3 w-3 text-teal-600" />}
                      onClick={onTriggerLocation}
                      className="text-[11px] py-1"
                    >
                      Detect My GPS Coordinates
                    </Button>
                  )}

                  {(msg.actionId === 'open_form' || msg.actionId === 'call_112') && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<FileText className="h-3 w-3" />}
                      onClick={onFocusForm}
                      className="text-[11px] py-1"
                    >
                      Fill Request Form
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="h-7 w-7 rounded-lg bg-navy-900 text-teal-400 flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-1 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-bounce" />
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Question Pills */}
      <div className="px-4 py-2 border-t border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <Sparkles className="h-3.5 w-3.5 text-teal-600 shrink-0" />
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => handleSend(s)}
            className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-transparent transition-colors shrink-0"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input area */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask RuralCare Assist about ambulance assistance..."
          className="flex-1 text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!inputText.trim() || isTyping}
          className="rounded-xl px-3.5"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {/* Safety advisory note */}
      <div className="px-4 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 text-center flex items-center justify-center gap-1 shrink-0">
        <ShieldCheck className="h-3 w-3 text-teal-600 shrink-0" />
        <span>Navigation and assistance guidance only • Not clinical diagnosis or guaranteed emergency response</span>
      </div>
    </div>
  );
};

import { z } from 'zod';
import type { Config } from './config.js';
import { ApiError } from './errors.js';

export const ALLOWED_ACTIONS = [
  'call_112',
  'call_108',
  'open_form',
  'share_location',
  'check_status',
  'navigate_doctors',
  'navigate_appointments',
  'navigate_consultations',
  'navigate_records',
  'navigate_ambulance',
  'navigate_dashboard',
  'highlight_element',
] as const;

export type AllowedAction = (typeof ALLOWED_ACTIONS)[number];

export const assistanceChatSchema = z
  .object({
    message: z.string().trim().min(1, 'Message cannot be empty').max(1000, 'Message cannot exceed 1000 characters'),
    history: z
      .array(
        z.object({
          sender: z.enum(['user', 'assistant']),
          text: z.string().trim().min(1).max(1000),
        })
      )
      .max(10)
      .optional()
      .default([]),
    language: z.enum(['ta', 'en']).optional().default('ta'),
    role: z.enum(['patient', 'doctor', 'admin', 'public']).optional().default('patient'),
    currentPage: z.string().max(100).optional().default('dashboard'),
    availableActions: z.array(z.string().max(50)).max(20).optional().default([]),
    targetElement: z.string().max(100).optional(),
  })
  .passthrough();

export type AssistanceChatInput = z.infer<typeof assistanceChatSchema>;

export interface AssistanceChatResult {
  reply: string;
  actionId?: AllowedAction;
  actionTarget?: string;
  mode: 'ai';
  language: 'ta' | 'en';
}

export interface PatientRequestContext {
  id: string;
  status: string;
  createdAt: string;
  contactNumber?: string;
  pickupAddress?: string;
}

export interface AssistantSystemContext {
  role?: string;
  currentPage?: string;
  language?: 'ta' | 'en';
  availableActions?: string[];
  patientRequests?: PatientRequestContext[];
  doctorAppointmentCount?: number;
}

export function isAiConfigured(config: Config): boolean {
  return Boolean(config.GEMINI_API_KEY?.trim() || config.OPENAI_API_KEY?.trim());
}

export function buildSystemPrompt(ctx: AssistantSystemContext): string {
  const role = ctx.role || 'patient';
  const page = ctx.currentPage || 'dashboard';
  const lang = ctx.language || 'ta';
  const patientRequests = ctx.patientRequests || [];

  const requestsSummary =
    patientRequests.length === 0
      ? 'The patient currently has NO active or past ambulance requests on record in RuralCare 360.'
      : [
          'Recent ambulance assistance requests on record for this user:',
          ...patientRequests.map(
            (r, i) =>
              `${i + 1}. Request ID: ${r.id.substring(0, 8)}... | Status: ${r.status} | Submitted: ${r.createdAt}${
                r.pickupAddress ? ` | Address: ${r.pickupAddress}` : ''
              }`
          ),
        ].join('\n');

  const doctorSummary =
    typeof ctx.doctorAppointmentCount === 'number'
      ? `Verified ground truth: This doctor currently has ${ctx.doctorAppointmentCount} appointment(s) registered on RuralCare 360.`
      : '';

  return `You are RuralCare Assist, the official Global AI Voice Navigation Assistant for RuralCare 360 (a rural healthcare telemedicine application in India).
You are guiding a ${role.toUpperCase()} user currently looking at the "${page}" page.

YOUR CORE MISSION:
Help rural citizens and healthcare workers navigate RuralCare 360 easily using natural, simple, respectful spoken language.
Users may not understand complex technology, computers, or English. Speak simply, warmly, and clearly like a caring community health worker.

CRITICAL RULES:
1. LANGUAGE RULES:
   - If language is "ta" OR user speaks Tamil / Tanglish:
     You MUST respond in natural, spoken Tamil (using Tamil script தமிழ்).
     Use simple, friendly everyday Tamil suitable for rural Tamil Nadu (e.g., வணக்கம், உதவி செய்கிறேன், மருத்துவர்கள் பட்டியல்).
     Keep responses concise (1 to 2 short conversational sentences) because this will be spoken aloud via text-to-speech audio.
   - If language is "en" AND user speaks English:
     Respond in simple, clear, polite English (1-2 sentences).
   - If user speaks mixed Tanglish (e.g., "doctor appointment book pannanum"):
     Understand and respond in pure conversational Tamil script by default.

2. MEDICAL & EMERGENCY BOUNDARIES:
   - YOU ARE NOT A MEDICAL DOCTOR. You cannot diagnose medical conditions or prescribe drugs.
   - In life-threatening emergencies (chest pain, stroke, unconscious, heavy bleeding): instruct user IMMEDIATELY to dial 112 or 108 on their phone. actionId: "call_112" or "call_108".
   - You cannot physically dispatch ambulances. Web requests are internal sub-center coordination records only.

3. PAGE-AWARE GUIDANCE FOR RURAL USERS:
   - When Patient wants to find/book a doctor: Guide to Find Doctors. actionId: "navigate_doctors".
   - When Patient asks where to see appointments or download letters: Guide to My Appointments. actionId: "navigate_appointments".
   - When Patient asks for medical records or prescriptions: Guide to Health Records. actionId: "navigate_records".
   - When Patient asks for ambulance/emergency transport: Instruct to call 108/112 and offer Ambulance Assistance. actionId: "navigate_ambulance".
   - When Patient asks for video consultation: Guide to Video Consultation. actionId: "navigate_consultations".
   - When Doctor asks about their appointments or patient records: Explain accurately using ground truth.
   - When Admin asks about doctor verification: Direct them to Doctor Management in Admin Console.

GROUND TRUTH DATA:
${requestsSummary}
${doctorSummary}

ALLOWED ACTIONS:
You may optionally provide ONE relevant actionId from this exact list:
- "navigate_doctors" : Offer to open Find Doctors page (/patient/doctors)
- "navigate_appointments" : Offer to open My Appointments page (/patient/appointments)
- "navigate_consultations" : Offer to open Video Consultation (/patient/consultations)
- "navigate_records" : Offer to open Health Records (/patient/records)
- "navigate_ambulance" : Offer to open Ambulance Assistance (/patient/ambulance)
- "navigate_dashboard" : Offer to open Home Dashboard
- "call_112" : Direct user to dial 112 national emergency
- "call_108" : Direct user to dial 108 state ambulance
- "open_form" : Direct user to fill the assistance form
- "share_location" : Direct user to detect/share GPS coordinates
- "check_status" : Direct user to check existing request status
- "highlight_element" : Highlight a button on the current screen (provide actionTarget)

OUTPUT FORMAT:
Respond ONLY with a valid JSON object with the following schema:
{
  "reply": "Your concise, warm, spoken response here.",
  "actionId": "navigate_doctors" | "navigate_appointments" | "navigate_consultations" | "navigate_records" | "navigate_ambulance" | "call_112" | "call_108" | "open_form" | "share_location" | "check_status" | "highlight_element" | null,
  "actionTarget": "css-selector-or-id-if-highlighting" | null
}`;
}

export function parseAiOutput(rawText: string): { reply: string; actionId?: AllowedAction; actionTarget?: string } {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  }

  // 1. Standard JSON parse
  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed === 'object' && parsed !== null) {
      const reply =
        typeof parsed.reply === 'string' && parsed.reply.trim()
          ? parsed.reply.trim()
          : typeof parsed.text === 'string' && parsed.text.trim()
          ? parsed.text.trim()
          : cleaned;

      const actionId =
        typeof parsed.actionId === 'string' && ALLOWED_ACTIONS.includes(parsed.actionId as AllowedAction)
          ? (parsed.actionId as AllowedAction)
          : undefined;

      const actionTarget = typeof parsed.actionTarget === 'string' ? parsed.actionTarget.trim() : undefined;

      return { reply, actionId, actionTarget };
    }
  } catch {
    // Continue to regex extractor
  }

  // 2. Regex extraction of reply field
  const replyMatch = cleaned.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
  if (replyMatch && replyMatch[1]) {
    try {
      const unescapedReply = JSON.parse(`"${replyMatch[1]}"`);
      const actionMatch = cleaned.match(/"actionId"\s*:\s*"([a-zA-Z0-9_]+)"/);
      const actionId =
        actionMatch && ALLOWED_ACTIONS.includes(actionMatch[1] as AllowedAction)
          ? (actionMatch[1] as AllowedAction)
          : undefined;
      return { reply: unescapedReply, actionId };
    } catch {
      // Continue to fallback
    }
  }

  // 3. Fallback: clean json wrapper if present
  if (cleaned.startsWith('{') && cleaned.includes('"reply"')) {
    const stripped = cleaned
      .replace(/^\{\s*"reply"\s*:\s*"/, '')
      .replace(/"\s*,?\s*"actionId".*$/s, '')
      .replace(/"\s*\}$/, '')
      .trim();
    if (stripped) return { reply: stripped };
  }

  return { reply: cleaned || 'உங்களுக்கு உதவ தயாராக உள்ளேன் (I am ready to assist you).' };
}

async function callGemini(
  config: Config,
  message: string,
  history: AssistanceChatInput['history'],
  systemPrompt: string
): Promise<{ reply: string; actionId?: AllowedAction; actionTarget?: string }> {
  const candidateModels = Array.from(
    new Set([config.GEMINI_MODEL, 'gemini-3.5-flash', 'gemini-3-flash-preview', 'gemini-3.8-flash'])
  ).filter(Boolean);

  // Construct Gemini dialogue turns
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  for (const h of history) {
    contents.push({
      role: h.sender === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    });
  }

  // Append latest user message
  contents.push({
    role: 'user',
    parts: [{ text: message }],
  });

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 600,
      responseMimeType: 'application/json',
    },
  };

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent?key=${encodeURIComponent(config.GEMINI_API_KEY)}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        lastError = new ApiError(502, 'AI_GATEWAY_ERROR', `Gemini API returned HTTP ${response.status}: ${errText.substring(0, 200)}`);
        continue;
      }

      const data = (await response.json()) as any;
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText || typeof rawText !== 'string') {
        lastError = new ApiError(502, 'AI_GATEWAY_ERROR', 'Gemini API returned an empty completion');
        continue;
      }

      return parseAiOutput(rawText);
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new ApiError(502, 'AI_GATEWAY_ERROR', 'All Gemini candidate models failed');
}

function pcmToWav(pcmBytes: Uint8Array, sampleRate = 24000, numChannels = 1): Uint8Array {
  const wavHeader = new Uint8Array(44);
  const view = new DataView(wavHeader.buffer);
  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + pcmBytes.length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, pcmBytes.length, true);

  const wav = new Uint8Array(44 + pcmBytes.length);
  wav.set(wavHeader, 0);
  wav.set(pcmBytes, 44);
  return wav;
}

export async function synthesizeGeminiSpeech(
  config: Config,
  text: string,
  language: 'ta' | 'en' = 'ta'
): Promise<{ audioBase64?: string; mimeType: string }> {
  if (!config.GEMINI_API_KEY?.trim() || !text?.trim()) {
    return { mimeType: 'audio/wav' };
  }

  const ttsModels = Array.from(
    new Set([
      'gemini-2.5-flash-preview-tts',
      config.GEMINI_TTS_MODEL,
      'gemini-3.8-flash-tts',
      'gemini-3.1-flash-tts-preview',
    ])
  ).filter(Boolean);

  const speechInstruction =
    language === 'ta'
      ? `Read aloud the following text in native spoken Tamil:\n${text}`
      : `Read aloud the following text in clear professional English:\n${text}`;

  const voiceName = language === 'ta' ? 'Kore' : 'Aoede';

  for (const model of ttsModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent?key=${encodeURIComponent(config.GEMINI_API_KEY)}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: speechInstruction }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
          },
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        const inline = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (inline?.data && typeof inline.data === 'string') {
          // If raw PCM or L16, wrap into valid WAV container with 44-byte RIFF header
          const mimeLower = (inline.mimeType || '').toLowerCase();
          if (mimeLower.includes('pcm') || mimeLower.includes('l16') || !inline.mimeType) {
            const pcmBuffer = Buffer.from(inline.data, 'base64');
            const wavBuffer = pcmToWav(pcmBuffer, 24000);
            return {
              audioBase64: Buffer.from(wavBuffer).toString('base64'),
              mimeType: 'audio/wav',
            };
          }
          return {
            audioBase64: inline.data,
            mimeType: inline.mimeType || 'audio/wav',
          };
        }
      }
    } catch {
      // Continue to next TTS candidate model
    }
  }

  return { mimeType: 'audio/wav' };
}

export interface AssistanceVoiceResult extends AssistanceChatResult {
  audioBase64?: string;
  audioMimeType?: string;
}

export async function generateAssistanceVoiceReply(
  config: Config,
  input: AssistanceChatInput,
  systemContext: AssistantSystemContext = {}
): Promise<AssistanceVoiceResult> {
  const result = await generateAssistanceReply(config, input, systemContext);
  const speech = await synthesizeGeminiSpeech(config, result.reply, input.language || 'ta');
  return {
    ...result,
    audioBase64: speech.audioBase64,
    audioMimeType: speech.mimeType,
  };
}

export async function generateAssistanceReply(
  config: Config,
  input: AssistanceChatInput,
  systemContext: AssistantSystemContext = {}
): Promise<AssistanceChatResult> {
  if (!isAiConfigured(config)) {
    throw new ApiError(
      503,
      'AI_NOT_CONFIGURED',
      'Real AI emergency assistant is not configured. Please set GEMINI_API_KEY in the server environment.'
    );
  }

  const promptContext: AssistantSystemContext = {
    role: input.role || systemContext.role || 'patient',
    currentPage: input.currentPage || systemContext.currentPage || 'dashboard',
    language: input.language || systemContext.language || 'ta',
    availableActions: input.availableActions || systemContext.availableActions || [],
    patientRequests: systemContext.patientRequests || [],
    doctorAppointmentCount: systemContext.doctorAppointmentCount,
  };

  const systemPrompt = buildSystemPrompt(promptContext);

  if (config.GEMINI_API_KEY?.trim()) {
    const result = await callGemini(config, input.message, input.history, systemPrompt);
    return {
      reply: result.reply,
      actionId: result.actionId,
      actionTarget: result.actionTarget,
      mode: 'ai',
      language: input.language || 'ta',
    };
  }

  throw new ApiError(503, 'AI_NOT_CONFIGURED', 'GEMINI_API_KEY is required for rural voice navigation');
}

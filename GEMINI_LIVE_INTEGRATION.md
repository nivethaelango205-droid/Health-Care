# RuralCare 360 — Gemini Live & Tamil Voice AI Avatar Integration Contract

**Document Version:** 1.0.0  
**Project:** RuralCare 360 (CODIENYCH 1.0 Hackathon — Team Hack Rat / CODIENYCH-2026-0003)  
**Component:** Real-Time Tamil AI Avatar Video Consultation  
**Architectural Approach:** Approach B — Secure Server-Side Streaming & Ephemeral Token Coordination  

---

## 1. Overview & Architecture

The **RuralCare Assist AI Virtual Consultation** system provides a real-time, bidirectional Tamil voice-to-voice consultation experience featuring an animated healthcare assistant avatar. 

### Core Responsibilities & Boundaries:
- **Assistant Persona:** "RuralCare Assist" — Friendly, virtual healthcare navigation assistant for rural Tamil-speaking patients.
- **Medical Safety:** STRICTLY an educational and navigation guide. **NOT a doctor, NOT authorized to diagnose, and NOT authorized to prescribe medicines.**
- **Emergency Priority:** Critical symptoms (chest pain, stroke, heavy bleeding, unconsciousness, severe trauma) immediately trigger National Emergency `112` and State Ambulance `108` routing.
- **Credential Protection:** Google Gemini API keys are held exclusively on the Node.js backend. **No API key is ever transmitted to or exposed in browser bundles, DOM attributes, or public environment variables.**

```
+----------------------------------------------------------------------------------------------------+
|                                          CLIENT BROWSER                                            |
|                                                                                                    |
|   +--------------------+     Web Speech API (ta-IN)      +-------------------------------------+   |
|   | Patient Microphone | ------------------------------> | Real-Time Tamil Speech Recognition  |   |
|   +--------------------+                                 +-------------------------------------+   |
|                                                                             |                      |
|                                                                             v                      |
|   +--------------------+      Web Audio API Analyser     +-------------------------------------+   |
|   |   Animated Avatar  | <------------------------------ | Base64 WAV Decoded Audio Playback   |   |
|   |  (Lip Amplitude)   |                                 +-------------------------------------+   |
+----------------------------------------------------------------------------------------------------+
                                           ^                                  |
                                           | Spoken Audio (WAV)               | User Tamil Utterance
                                           | & Captions JSON                  | & Session Token
                                           |                                  v
+----------------------------------------------------------------------------------------------------+
|                                    RURALCARE 360 NODE.JS BACKEND                                   |
|                                                                                                    |
|   • Bearer Token Authentication (Patient Role Verified)                                             |
|   • Session Rate Limiting (30 requests/min)                                                        |
|   • SQLite Decrypted Ground-Truth Context (AES-256-GCM Ambulance Request Status)                   |
|   • LLM Reasoning (Google Gemini 3.5 Flash / Gemini 3.8 Flash)                                     |
|   • Speech Synthesis (Google Gemini Flash TTS: gemini-3.8-flash-tts -> 24kHz WAV)                   |
|   • Multimodal Live WebSocket Relay (v1alpha BidiGenerateContent where enabled)                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Selected Models & Specifications

| Role | Primary Model | Fallback Models | Format / Modality |
|---|---|---|---|
| **Conversational Reasoning** | `models/gemini-3.5-flash` | `models/gemini-3-flash-preview`, `models/gemini-3.8-flash` | Text / JSON (`responseMimeType: "application/json"`) |
| **Spoken Audio Synthesis** | `models/gemini-3.8-flash-tts` | `models/gemini-2.5-flash-preview-tts` | Binary WAV (`audio/wav`), 24,000 Hz Little-Endian |
| **Multimodal Live Bidi** | `models/gemini-2.0-flash-exp` | `models/gemini-2.5-flash` | WebSocket (`BidiGenerateContent`), 16kHz PCM In / 24kHz PCM Out |

---

## 3. Environment Variables (Server-Only)

Configure these variables in `server/.env`:

```env
# Google Gemini API Credentials (Strictly confidential on backend)
GEMINI_API_KEY=<your_google_gemini_api_key>

# Configurable Reasoning Models
GEMINI_MODEL=gemini-3.5-flash

# Configurable Speech Synthesis Model
GEMINI_TTS_MODEL=gemini-3.8-flash-tts

# Gemini Live WebSocket Endpoint (for Bidi streaming)
GEMINI_LIVE_URL=wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent
```

> [!CAUTION]
> Never prepend `VITE_` to these variables. The Vite client connects strictly to the backend endpoint `/api/assistance/voice` using the patient's existing JWT/session bearer token.

---

## 4. API Endpoints & Contracts

### A. Real-Time Tamil Voice Consultation (`POST /api/assistance/voice`)

- **Security:** Requires `Authorization: Bearer <token>` (Patient or Doctor role).
- **Rate Limit:** 30 requests / minute.

#### Request Payload:
```json
{
  "message": "வணக்கம், எனக்கு மருத்துவரைச் சந்திக்க வேண்டும்",
  "history": [
    { "sender": "user", "text": "வணக்கம்" },
    { "sender": "assistant", "text": "வணக்கம்! நான் ரூரல்கேர் அசிஸ்ட். உங்களுக்கு எப்படி உதவட்டும்?" }
  ]
}
```

#### Success Response (`200 OK`):
```json
{
  "reply": "வணக்கம்! நமது போர்ட்டலில் உள்ள மருத்துவர்கள் பட்டியலைப் பார்த்து நீங்கள் நேரடியாக வீடியோ ஆலோசனையை பதிவு செய்யலாம்.",
  "audioBase64": "UklGRiS5AwBXQVZFZm10IBAAAAABAAEA...",
  "audioMimeType": "audio/wav",
  "actionId": "open_form",
  "mode": "ai"
}
```

#### Error Responses:
- `401 UNAUTHENTICATED`: Missing, expired, or invalid session bearer token.
- `422 VALIDATION_ERROR`: Empty message or invalid payload schema.
- `503 AI_NOT_CONFIGURED`: Neither `GEMINI_API_KEY` nor `OPENAI_API_KEY` is set in the server environment.
- `502 AI_GATEWAY_ERROR`: Upstream Google Gemini quota, network timeout, or service interruption (client falls back safely to browser Web Speech synthesis without crashing).

---

## 5. Audio Pipeline & Avatar Synchronization

1. **Patient Speech Input (Mic -> Browser -> Server):**
   - Captured via `navigator.mediaDevices.getUserMedia({ audio: true })`.
   - Web Speech API speech recognition engine configured for `lang: 'ta-IN'` (Tamil — India) with continuous streaming.
   - User speech is transcribed instantly on-screen (`You: வணக்கம்...`).
2. **AI Voice Synthesis (Server -> Browser):**
   - `gemini-3.5-flash` receives conversation turns and outputs warm, colloquial Tamil advice (1–3 concise sentences).
   - `gemini-3.8-flash-tts` renders the Tamil script into high-fidelity WAV audio (`audioBase64`).
3. **Avatar Lip-Sync Synchronization:**
   - Client decodes `audioBase64` into an `AudioBuffer` via browser `AudioContext`.
   - An `AnalyserNode` with FFT size 256 connects between source and speakers.
   - An active `requestAnimationFrame` loop calculates real-time RMS amplitude (`0.0` to `1.0`).
   - The avatar's mouth vertical opening (`scaleY` / SVG aperture) directly maps to amplitude.
   - When audio ends, the mouth returns to a closed smile, transitioning state from `speaking` to `listening`.

---

## 6. Live Subtitles & Captions

- **You (Patient):** Real-time recognized Tamil speech with interim recognition updates.
- **RuralCare Assist (AI):** Exact transcript of the generated Tamil spoken sentence.
- Captions can be toggled on/off via the video call toolbar `CC` button.

---

## 7. Healthcare Safety & Emergency Escalation

1. **Persistent Disclaimer:** The call window prominently displays:
   `AI Virtual Assistant — Not a Doctor (ஆரம்ப சுகாதார வழிகாட்டி மட்டுமே)`
2. **Emergency Triggers:**
   Keywords such as *நெஞ்சு வலி* (chest pain), *மூச்சுத்திணறல்* (breathlessness), *மயக்கம்* (unconsciousness), or *ரத்தப்போக்கு* (heavy bleeding) trigger:
   - Immediate audio instruction to call emergency numbers.
   - Clickable `tel:112` and `tel:108` emergency action buttons.
3. **No False Dispatches:**
   Ambulance assistance requests are strictly logged for internal primary health sub-center coordination and never claim municipal dispatch or fake arrival times.


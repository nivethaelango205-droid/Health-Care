# RuralCare 360 — Global AI Voice Assistant & Tamil TTS Contract

## Document Overview
- **Team**: Hack Rat (CODIENYCH-2026-0003)
- **Problem Statement**: Telemedicine Access for Rural Healthcare
- **Integration Scope**: Global Gemini AI Voice Assistant (`GlobalRuralCareAssistant`) & Native Tamil Text-to-Speech Architecture

---

## 1. Architecture Summary

Antigravity has implemented the complete frontend architecture and initial backend gateway for the application-wide **Global AI Voice Navigation Assistant**.

### Key Deliverables Completed:
1. **Root-Level Floating Assistant**:
   - `GlobalRuralCareAssistant` is rendered globally across all routes (Patient Portal, Doctor Workspace, Admin Console, and Landing/Login).
   - Preserves continuous conversation state, avatar animation, and playback without unmounting when switching pages.
2. **Native Spoken Tamil Synthesis**:
   - Fixed the spoken voice defect where Tamil text prompted English browser speech.
   - Calls Google Gemini TTS (`gemini-3.8-flash-tts`) to generate native 16-bit PCM WAV base64 audio in natural Tamil.
   - Decodes audio in browser Web Audio API, piping frequency RMS amplitude directly to the `SpeakingAvatar` mouth viseme.
3. **Structured Page Context**:
   - Every request passes sanitized user context:
     ```json
     {
       "message": "வணக்கம், எனக்கு டாக்டர் அப்பாயின்ட்மென்ட் புக் பண்ணணும்.",
       "history": [],
       "language": "ta",
       "role": "patient",
       "currentPage": "/patient/dashboard",
       "availableActions": ["find_doctors", "emergency_108", "ai_consult"]
     }
     ```
4. **Action Dispatch Protocol**:
   - AI outputs allowlisted actions (e.g. `navigate_doctors`, `navigate_appointments`, `call_112`, `call_108`, `highlight_element`).
   - Elements feature registered CSS IDs (e.g. `#action-find-doctors`, `#action-download-letter`, `#action-call-108`).

---

## 2. API Contract Specification

### Endpoint 1: Voice Guidance & Native Tamil Synthesis
- **URL**: `POST /api/assistance/voice`
- **Auth**: Required (`Bearer <token>`)
- **Rate Limit**: 30 requests / 15 minutes

#### Request Body
```json
{
  "message": "வணக்கம், எனக்கு டாக்டர் அப்பாயின்ட்மென்ட் புக் பண்ணணும்.",
  "history": [
    { "sender": "user", "text": "முந்தைய செய்தி" },
    { "sender": "assistant", "text": "முந்தைய பதில்" }
  ],
  "language": "ta",
  "role": "patient",
  "currentPage": "/patient/dashboard",
  "availableActions": ["find_doctors", "emergency_108"]
}
```

#### Response Body
```json
{
  "reply": "வணக்கம்! நான் உங்களுக்கு மருத்துவர் முன்பதிவு பக்கத்தை திறந்து காட்டுகிறேன்.",
  "actionId": "navigate_doctors",
  "actionTarget": "#action-find-doctors",
  "audioBase64": "UklGRtp+AgBXQVZF...",
  "audioMimeType": "audio/wav",
  "mode": "ai",
  "language": "ta"
}
```

---

### Endpoint 2: Text-Only Guidance
- **URL**: `POST /api/assistance/chat`
- **Auth**: Required (`Bearer <token>`)
- **Request Body**: Same schema as `/api/assistance/voice`.
- **Response Body**: Omits `audioBase64` for low-bandwidth rural connections.

---

## 3. Allowed Actions Registry

| Action ID | Description | Frontend Handler |
|---|---|---|
| `navigate_doctors` | Guide patient to doctor listing | `navigate('/patient/doctors')` |
| `navigate_appointments` | Guide patient to scheduled appointments | `navigate('/patient/appointments')` |
| `navigate_consultations` | Guide patient/doctor to video room | `navigate('/patient/consultations')` |
| `navigate_records` | Guide patient to health records | `navigate('/patient/records')` |
| `navigate_ambulance` | Guide to ambulance coordination | `navigate('/patient/ambulance')` |
| `navigate_dashboard` | Return to user's home dashboard | Role-based dashboard redirect |
| `call_112` | Immediate national emergency hotline | Triggers `tel:112` |
| `call_108` | Immediate state ambulance hotline | Triggers `tel:108` |
| `highlight_element` | Highlight button with animated pulse ring | `highlightElement(actionTarget)` |

---

## 4. Handoff Checklist for Codex Backend Lead

1. **Verify Rate Limits & Caching**:
   - Cache common TTS responses (e.g. initial greeting, standard 112 emergency warning) in memory or Redis to optimize Gemini API quota.
2. **Authorized Doctor Schedules**:
   - When a logged-in Doctor asks `"இன்னைக்கு எனக்கு எத்தனை appointments இருக்கு?"`, ensure the query calculates actual appointment rows for `doctor_id = req.user.id` on the current date.
3. **Privacy Boundary**:
   - Never forward medical records or full patient history to third-party AI endpoints. Only send sanitized, non-sensitive page context.


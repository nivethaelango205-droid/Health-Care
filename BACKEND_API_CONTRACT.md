# RuralCare 360 backend API contract

Base URL: `http://127.0.0.1:4000`. All dates are ISO 8601 strings with an explicit timezone; responses normalize them to UTC (`2026-10-09T09:00:00.000Z`). IDs are UUID strings. Roles are lowercase `patient`, `doctor`, `admin`.

Protected requests require `Authorization: Bearer <token>`. Send JSON with `Content-Type: application/json`. No cookies are used; CORS credentials are false. Keep tokens in memory where possible and clear them on logout. Do not put tokens in URLs. Default frontend origins: `http://localhost:5173` and `http://127.0.0.1:5173`. Configurable through `FRONTEND_ORIGINS`.

Responses have the exact wrappers below; no generic `data` wrapper. Lists are arrays and currently unpaginated. Request objects reject unknown fields. Do not send display names, patient IDs or status when booking; the server associates the authenticated patient.

## Shared response schemas

These definitions are exact, reusable JSON schemas expressed as TypeScript notation. Every field is required unless marked `?`. `string` dates and IDs have the formats above; `null` means explicitly absent.

```ts
type User = {
  id: string; name: string; email: string;
  role: 'patient' | 'doctor' | 'admin'; createdAt: string;
};
type AuthResponse = { user: User; token: string; expiresAt: string };
type Doctor = {
  id: string; name: string; specialty: string; verified: boolean;
  availability: { id: string; startsAt: string; endsAt: string }[];
};
type Appointment = {
  id: string; number: string; patientId: string; doctorId: string;
  patientName: string; doctorName: string; startsAt: string; endsAt: string;
  mode: 'video' | 'in_person';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string; updatedAt: string;
};
type Consultation = {
  id: string; appointmentId: string; patientId: string; doctorId: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  healthRecordId: string | null; createdAt: string; updatedAt: string;
};
type HealthRecord = {
  id: string; patientId: string; doctorId: string; consultationId: string;
  consultationDate: string; symptoms: string; clinicalNotes: string;
  recommendations: string; createdAt: string; updatedAt: string;
};
type AmbulanceRequest = {
  id: string; patientId: string; contactNumber: string; pickupAddress: string;
  coordinates?: { latitude: number; longitude: number };
  status: 'submitted' | 'acknowledged' | 'closed';
  createdAt: string; updatedAt: string;
  notice: 'Internal assistance request only. This is not emergency dispatch.';
};
type ErrorResponse = {
  error: { code: string; message: string; details?: { path: string; message: string }[] }
};
```

Example error: `{"error":{"code":"FORBIDDEN","message":"Role is not permitted"}}`.

All protected endpoints can return **401 UNAUTHENTICATED** for absent, expired or revoked tokens. All requests can return **429 RATE_LIMITED** or **500 INTERNAL_ERROR**. JSON request endpoints can return **400 INVALID_JSON**, **413 PAYLOAD_TOO_LARGE**, **422 VALIDATION_ERROR** (including details). Invalid UUID path IDs return 422. Unknown endpoints return **404 NOT_FOUND**. Endpoint-specific errors are listed below in addition to these common errors.

## Authentication

| Method and URL | Required role | Request JSON | Success response | Additional errors |
|---|---|---|---|---|
| POST `/api/auth/register` | Public | `{ "name": "Demo Patient", "email": "patient@example.test", "password": "a-unique-long-password", "role": "patient" }` (`role` optional) | 201 `AuthResponse` | 409 EMAIL_EXISTS; 422 for doctor/admin role |
| POST `/api/auth/login` | Public | `{ "email": "patient@example.test", "password": "a-unique-long-password" }` | 200 `AuthResponse` | 401 INVALID_CREDENTIALS |
| GET `/api/auth/me` | All authenticated | No body | 200 `{ user: User }` | Common errors |
| POST `/api/auth/logout` | All authenticated | No body | 204, empty body | Common errors |

Registration passwords: 12–128 characters; name: 2–100 characters; email: valid and at most 254 characters, normalized lowercase. Login does not accept role: the database determines it. Sessions last `SESSION_HOURS` (default 12), expire without renewal, and are revoked on logout. Logout also disconnects sockets authenticated with that token. Doctors/admins are provisioned through trusted server-side processes; this MVP provides a development-only seed script and no public provisioning route.

## Doctors

| Method and URL | Required role | Request JSON | Success response | Additional errors |
|---|---|---|---|---|
| GET `/api/doctors` | All authenticated | No body | 200 `{ doctors: Doctor[] }` | Common errors |
| GET `/api/doctors/:id` | All authenticated | No body | 200 `{ doctor: Doctor }` | 404 NOT_FOUND |

Records come from SQLite. Availability returns future configured windows; empty means no configured restriction, not guaranteed free slots. Booking still checks overlaps. Seeded doctor verification is fictional and explicitly for demonstration.

## Appointments

| Method and URL | Required role | Request JSON | Success response | Additional errors |
|---|---|---|---|---|
| POST `/api/appointments` | Patient | `{ "doctorId": "<uuid>", "startsAt": "2026-10-09T14:30:00+05:30", "mode": "video" }` (`mode` optional, default video) | 201 `{ appointment: Appointment }` | 403 FORBIDDEN; 422 PAST_SLOT; 409 DOCTOR_UNAVAILABLE, OUTSIDE_AVAILABILITY, SLOT_TAKEN |
| GET `/api/appointments` | All authenticated | No body | 200 `{ appointments: Appointment[] }` | Common errors |
| GET `/api/appointments/:id` | Assigned patient/doctor or admin | No body | 200 `{ appointment: Appointment }` | 403 FORBIDDEN; 404 NOT_FOUND |
| PATCH `/api/appointments/:id/status` | Assigned participants or admin, subject to transitions below | `{ "status": "confirmed" }` or `cancelled` or `completed` | 200 `{ appointment: Appointment }` | 403 FORBIDDEN; 404 NOT_FOUND; 409 INVALID_TRANSITION, DOCTOR_UNAVAILABLE, PAST_SLOT |
| GET `/api/appointments/:id/letter` | Assigned patient/doctor or admin | No body | 200 PDF binary, `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="RC360-<uuid>.pdf"` | 403 FORBIDDEN; 404 NOT_FOUND; 409 NOT_CONFIRMED |

Appointments last exactly 30 minutes. Atomic `BEGIN IMMEDIATE` transactions prevent doctor and patient overlaps, including pending slots. If availability windows exist, the full slot must fit one. Past starts are rejected. Pending → confirmed requires the assigned verified doctor. Pending/confirmed → cancelled is allowed for the assigned patient/doctor or admin, unless a consultation is active or completed. Terminal statuses cannot be reversed. Direct `completed` requests return INVALID_TRANSITION: completing the consultation completes the appointment. Lists contain the user's appointments; admins can review all appointment metadata. PDFs are generated only while status is confirmed. Date/time display in the PDF is IST; frontend dates should use an explicit timezone.

## Consultations

| Method and URL | Required role | Request JSON | Success response | Additional errors |
|---|---|---|---|---|
| POST `/api/consultations` | Assigned patient or doctor | `{ "appointmentId": "<uuid>" }` | 201 `{ consultation: Consultation }`, or 200 existing consultation for the same appointment | 403 FORBIDDEN; 404 NOT_FOUND; 409 NOT_CONFIRMED, INVALID_MODE, DOCTOR_UNAVAILABLE |
| GET `/api/consultations/:id` | Assigned patient or doctor | No body | 200 `{ consultation: Consultation }` | 403 FORBIDDEN; 404 NOT_FOUND |
| PATCH `/api/consultations/:id` | Assigned verified doctor | `{ "status": "in_progress" }` or `{ "status": "completed" }` | 200 `{ consultation: Consultation }` | 403 FORBIDDEN; 404 NOT_FOUND; 409 INVALID_TRANSITION, DOCTOR_UNAVAILABLE |

Only confirmed video appointments create consultations. One consultation per appointment. Status follows scheduled → in_progress → completed. Cancellation/completion removes access to signaling rooms. The assigned patient can retrieve doctor status updates and linked `healthRecordId`. Admins have no consultation or record access.

## Health records

| Method and URL | Required role | Request JSON | Success response | Additional errors |
|---|---|---|---|---|
| GET `/api/health-records` | Patient or doctor | No body | 200 `{ healthRecords: HealthRecord[] }` | 403 FORBIDDEN |
| GET `/api/health-records/:id` | Assigned patient or doctor | No body | 200 `{ healthRecord: HealthRecord }` | 403 FORBIDDEN; 404 NOT_FOUND |
| POST `/api/health-records` | Assigned verified doctor | See full JSON below | 201 `{ healthRecord: HealthRecord }` | 403 FORBIDDEN; 404 NOT_FOUND; 422 PARTICIPANT_MISMATCH, FUTURE_RECORD; 409 CONSULTATION_NOT_STARTED, RECORD_EXISTS, DOCTOR_UNAVAILABLE |
| PATCH `/api/health-records/:id` | Assigned verified doctor | `{ "clinicalNotes": "Updated fictional clinical note" }` (any nonempty subset of symptoms, clinicalNotes, recommendations) | 200 `{ healthRecord: HealthRecord }` | 403 FORBIDDEN; 404 NOT_FOUND; 409 DOCTOR_UNAVAILABLE |

```json
{
  "patientId": "<assigned-patient-uuid>",
  "doctorId": "<assigned-doctor-uuid>",
  "consultationId": "<consultation-uuid>",
  "consultationDate": "2026-10-08T15:00:00+05:30",
  "symptoms": "Fictional symptoms for demonstration",
  "clinicalNotes": "Fictional clinician note",
  "recommendations": "Fictional recommendations"
}
```

Every clinical field is trimmed, 1–10,000 characters. Patient/doctor IDs must match the consultation. Records require in_progress/completed consultations and a nonfuture date; one per consultation. Lists are scoped to the assigned patient or doctor. No admin override exists. Clinical fields are encrypted together with AES-256-GCM, random IVs and record-specific authenticated context. Database metadata (IDs, dates, names, emails) is not full-disk encrypted. Keys are external environment secrets; retain them with secured backups. Application authorization runs before decryption.

## Ambulance assistance

| Method and URL | Required role | Request JSON | Success response | Additional errors |
|---|---|---|---|---|
| POST `/api/ambulance/requests` | Patient | See full JSON below | 201 `{ ambulanceRequest: AmbulanceRequest }` | 403 FORBIDDEN |
| GET `/api/ambulance/requests` | Patient or admin | No body | 200 `{ ambulanceRequests: AmbulanceRequest[] }` | 403 FORBIDDEN |
| PATCH `/api/ambulance/requests/:id/status` | Admin | `{ "status": "acknowledged" }` or `{ "status": "closed" }` | 200 `{ ambulanceRequest: AmbulanceRequest }` | 403 FORBIDDEN; 404 NOT_FOUND; 409 INVALID_TRANSITION |

```json
{
  "contactNumber": "+91 9999999999",
  "pickupAddress": "Fictional Village Lane",
  "coordinates": { "latitude": 20, "longitude": 78 }
}
```

Coordinates are optional; latitude −90..90, longitude −180..180. Contact number accepts 7–25 characters composed of digits, spaces, parentheses and hyphens, optionally prefixed with +. Address length: 5–1,000. Contact/address/coordinates are encrypted at rest. Patient ID is taken from the session. Patients see only their requests. Admins review all and can change submitted → acknowledged/closed, acknowledged → closed. Closed is terminal. No dispatched status exists and no emergency provider is integrated. The frontend must display the returned notice: submission is not emergency dispatch.

## Emergency assistance chat (RuralCare Assist AI)

| Method and URL | Required role | Request JSON | Success response | Additional errors |
|---|---|---|---|---|
| POST `/api/assistance/chat` | All authenticated | See full JSON below | 200 `{ "reply": string, "actionId"?: "call_112" \| "call_108" \| "open_form" \| "share_location" \| "check_status", "mode": "ai" }` | 401 UNAUTHENTICATED; 422 VALIDATION_ERROR; 503 AI_NOT_CONFIGURED; 502 AI_GATEWAY_ERROR |

```json
{
  "message": "How can I request ambulance assistance?",
  "history": [
    { "sender": "user", "text": "Hello" },
    { "sender": "assistant", "text": "Hello! I am RuralCare Assist." }
  ]
}
```

Ground-truth context: Queries only the authenticated user's recent ambulance requests from SQLite (decrypted with AES-256-GCM) and feeds them into the system prompt.
Configurable providers: Google Gemini (`GEMINI_API_KEY`) or OpenAI (`OPENAI_API_KEY`). If neither key is configured in the server environment, returns HTTP 503 (`AI_NOT_CONFIGURED`) without fabricating AI answers, allowing the frontend to fall back honestly to Guided Assistance mode.
Strict safety rules: Never diagnoses medical conditions or prescribes medications. In acute life-threatening emergencies, immediately advises dialing 112 or 108. Does not hallucinate ambulance dispatch or arrival times.

## Health

| Method and URL | Required role | Request JSON | Response | Errors |
|---|---|---|---|---|
| GET `/api/health` | Public | No body | 200 `{ "status": "ok", "api": "up", "database": "up", "timestamp": "<UTC ISO datetime>" }` | 503 `{ "status": "degraded", "api": "up", "database": "down", "timestamp": "<UTC ISO datetime>" }` |

The endpoint executes a database query on every call. It is not a cached availability claim.

## Antigravity integration sequence

1. Login and store `token`, `user`, `expiresAt`; attach bearer token to API calls.
2. Fetch doctors, book a future 30-minute slot, display pending status.
3. Doctor confirms; refresh appointment. Download letter with authenticated `fetch`, create a Blob URL; a bare anchor cannot attach the bearer token.
4. Create/retrieve the consultation with appointmentId. Pass consultation.id to sockets; see WEBRTC_SIGNALING_CONTRACT.md.
5. Doctor sets in_progress, creates record, then completes consultation. Patient retrieves doctor updates and their records.
6. Display ambulance request notice and internal statuses verbatim; do not claim dispatch.

No frontend files were changed. No existing API_CONTRACT.md was present in the supplied empty workspace. If Antigravity has a contract elsewhere, reconcile it with this document before connecting.

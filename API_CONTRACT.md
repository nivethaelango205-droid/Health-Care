# RuralCare 360 — API Contract Specification

**Project:** RuralCare 360  
**Hackathon:** CODIENYCH 1.0  
**Team:** Hack Rat (ID: CODIENYCH-2026-0003)  
**Author:** Antigravity (Frontend Lead)  
**Consumer:** Codex (Backend Lead)  

---

## 1. Overview & Architectural Principles

This document defines the interface contract between the React frontend and Express backend. All contracts below align precisely with the production schemas verified in `server/src/app.ts` and `server/src/signaling.ts`.

### 1.1 Base Conventions
- **Base URL:** Configured via `VITE_API_BASE_URL` (default: `/api` proxied to `http://127.0.0.1:4000/api`).
- **Content-Type:** `application/json` (except PDF download which is `application/pdf`).
- **Standard Success Format:** JSON object wrapping resource (e.g. `{ user, token, expiresAt }`, `{ appointments: [...] }`, `{ healthRecord: {...} }`).
- **Standard Error Convention:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHENTICATED | FORBIDDEN | NOT_FOUND | RATE_LIMITED | INTERNAL_ERROR",
    "message": "Human-readable error description",
    "details": [
      { "path": "startsAt", "message": "Choose a future appointment" }
    ]
  }
}
```

---

## 2. Authentication & Session Management

Authentication uses 256-bit secure session tokens passed in the standard HTTP header:
`Authorization: Bearer <token>`

### 2.1 Register Patient
- **Endpoint:** `POST /api/auth/register`
- **Access:** Public (Patients only)
- **Request Body:**
```json
{
  "name": "Asha Sharma",
  "email": "asha@ruralcare.in",
  "password": "SecurePassword123",
  "role": "patient"
}
```
- **Response (201 Created):**
```json
{
  "user": {
    "id": "d0e1f2a3-b4c5-...",
    "name": "Asha Sharma",
    "email": "asha@ruralcare.in",
    "role": "patient",
    "createdAt": "2026-03-01T08:00:00.000Z"
  },
  "token": "64_hex_character_token",
  "expiresAt": "2026-03-01T20:00:00.000Z"
}
```

### 2.2 User Login
- **Endpoint:** `POST /api/auth/login`
- **Access:** Public
- **Request Body:**
```json
{
  "email": "patient@demo.ruralcare.test",
  "password": "DemoPatient@2026"
}
```
- **Response (200 OK):** Same structure as register.

### 2.3 Current Session Profile
- **Endpoint:** `GET /api/auth/me`
- **Access:** Authenticated (Bearer Token)
- **Response (200 OK):**
```json
{
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "role": "patient | doctor | admin",
    "createdAt": "..."
  }
}
```

### 2.4 Logout
- **Endpoint:** `POST /api/auth/logout`
- **Access:** Authenticated
- **Response:** `204 No Content`

---

## 3. Doctors & Directory

### 3.1 List Doctors
- **Endpoint:** `GET /api/doctors`
- **Access:** Authenticated
- **Response (200 OK):**
```json
{
  "doctors": [
    {
      "id": "uuid-doctor-user-id",
      "name": "Dr. Meera Nambiar",
      "specialty": "General Medicine & Rural Health",
      "verified": true,
      "availability": [
        {
          "id": "avail-1",
          "startsAt": "2026-03-02T10:00:00.000Z",
          "endsAt": "2026-03-02T10:30:00.000Z"
        }
      ]
    }
  ]
}
```

### 3.2 Doctor by ID
- **Endpoint:** `GET /api/doctors/:id`
- **Access:** Authenticated
- **Response (200 OK):** `{ "doctor": { ... } }`

---

## 4. Appointments & Confirmation Letters

### 4.1 Book Appointment
- **Endpoint:** `POST /api/appointments`
- **Access:** Patient only
- **Request Body:**
```json
{
  "doctorId": "uuid-doctor-id",
  "startsAt": "2026-03-05T14:00:00.000Z",
  "mode": "video"
}
```
- **Response (201 Created):**
```json
{
  "appointment": {
    "id": "uuid-appt",
    "number": "RC360-DEL-8941",
    "patientId": "...",
    "doctorId": "...",
    "patientName": "Asha Sharma",
    "doctorName": "Dr. Meera Nambiar",
    "startsAt": "2026-03-05T14:00:00.000Z",
    "endsAt": "2026-03-05T14:30:00.000Z",
    "mode": "video",
    "status": "pending",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### 4.2 List Appointments
- **Endpoint:** `GET /api/appointments`
- **Access:** Authenticated (Patient sees own, Doctor sees assigned, Admin sees all)
- **Response (200 OK):** `{ "appointments": [ ... ] }`

### 4.3 Update Appointment Status
- **Endpoint:** `PATCH /api/appointments/:id/status`
- **Access:**
  - Patient: can only request `"cancelled"`
  - Doctor: can transition from `"pending"` to `"confirmed"` or `"cancelled"`
- **Request Body:**
```json
{
  "status": "confirmed"
}
```
- **Response (200 OK):** `{ "appointment": { ... } }`

### 4.4 Download Appointment Confirmation Letter (PDF)
- **Endpoint:** `GET /api/appointments/:id/letter`
- **Access:** Assigned Patient, Doctor, or Admin
- **Condition:** Status must be `"confirmed"`
- **Response (200 OK):** Binary PDF stream (`Content-Type: application/pdf`, `Content-Disposition: attachment; filename="RC360-DEL-8941.pdf"`).

---

## 5. Telemedicine Consultations

### 5.1 Initialize Consultation
- **Endpoint:** `POST /api/consultations`
- **Access:** Patient or Doctor
- **Request Body:**
```json
{
  "appointmentId": "uuid-confirmed-video-appointment"
}
```
- **Response (200 or 201):**
```json
{
  "consultation": {
    "id": "uuid-consultation",
    "appointmentId": "...",
    "patientId": "...",
    "doctorId": "...",
    "status": "scheduled",
    "healthRecordId": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### 5.2 Update Consultation Status
- **Endpoint:** `PATCH /api/consultations/:id`
- **Access:** Doctor only
- **Request Body:**
```json
{
  "status": "in_progress | completed"
}
```

---

## 6. Digital Health Records (Encrypted Clinical History)

### 6.1 List Records
- **Endpoint:** `GET /api/health-records`
- **Access:** Patient (own records) or Doctor (patient history)
- **Response (200 OK):**
```json
{
  "healthRecords": [
    {
      "id": "uuid-record",
      "patientId": "...",
      "doctorId": "...",
      "consultationId": "...",
      "consultationDate": "2026-03-01T10:00:00.000Z",
      "symptoms": "Reported symptoms...",
      "clinicalNotes": "Clinical assessment...",
      "recommendations": "Prescription and advice...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

### 6.2 Create Clinical Record
- **Endpoint:** `POST /api/health-records`
- **Access:** Doctor only (during or after consultation)
- **Request Body:**
```json
{
  "patientId": "uuid-patient",
  "doctorId": "uuid-doctor",
  "consultationId": "uuid-consultation",
  "consultationDate": "2026-03-01T10:30:00.000Z",
  "symptoms": "Persistent cough for 2 weeks",
  "clinicalNotes": "Vitals stable, chest clear on auscultation",
  "recommendations": "1. Tab Levocetirizine 5mg OD\n2. Steam inhalation"
}
```

---

## 7. Emergency Ambulance Assistance

### 7.1 Submit Assistance Request
- **Endpoint:** `POST /api/ambulance/requests`
- **Access:** Patient only
- **Request Body:**
```json
{
  "contactNumber": "+91 98765 43210",
  "pickupAddress": "Near Gram Panchayat Bhavan, Village Bilaspur",
  "coordinates": {
    "latitude": 22.598,
    "longitude": 80.371
  }
}
```
- **Response (201 Created):**
```json
{
  "ambulanceRequest": {
    "id": "uuid-ambulance-req",
    "patientId": "...",
    "contactNumber": "+91 98765 43210",
    "pickupAddress": "...",
    "coordinates": { "latitude": 22.598, "longitude": 80.371 },
    "status": "submitted",
    "notice": "Internal assistance request only. This is not emergency dispatch.",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### 7.2 List Requests
- **Endpoint:** `GET /api/ambulance/requests`
- **Access:** Patient (sees own) or Admin (sees all operations)

### 7.3 Update Ambulance Request Status
- **Endpoint:** `PATCH /api/ambulance/requests/:id/status`
- **Access:** Admin only
- **Request Body:**
```json
{
  "status": "acknowledged | closed"
}
```

---

## 8. System Health
- **Endpoint:** `GET /api/health`
- **Access:** Public
- **Response (200 OK):**
```json
{
  "status": "ok",
  "api": "up",
  "database": "up",
  "timestamp": "2026-03-01T08:00:00.000Z"
}
```


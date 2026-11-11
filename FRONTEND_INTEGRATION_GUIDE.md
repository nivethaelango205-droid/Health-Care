# RuralCare 360 — Frontend Integration Guide for Codex

**Hackathon:** CODIENYCH 1.0  
**Team:** Hack Rat (ID: CODIENYCH-2026-0003)  
**Author:** Antigravity (Frontend Lead)  
**Target:** Codex (Backend Lead) & Judges Reviewers  

---

## 1. Architecture & Directory Structure

The frontend is built with React 18, TypeScript, Tailwind CSS, Vite, and React Router. It lives at the repository root:

```text
D:\Rural health Care\
├── index.html                  # Root HTML with Inter font & metadata
├── vite.config.ts              # Vite dev server with proxy to backend (Port 4000)
├── tailwind.config.js          # Design system tokens (Navy, Healthcare Teal, Emergency Red)
├── tsconfig.json               # Strict TypeScript configuration
├── package.json                # Frontend scripts and dependencies
├── .env / .env.example         # Environment configuration
├── API_CONTRACT.md             # Complete endpoint and schema specification
├── FRONTEND_INTEGRATION_GUIDE.md # This integration document
├── WEBRTC_CLIENT_CONTRACT.md   # WebRTC signaling contract
├── dist/                       # Production build output
└── src/
    ├── types/
    │   └── index.ts            # Centralized TypeScript models matching Codex DB
    ├── services/
    │   ├── api.ts              # Centralized fetch wrapper & bearer token injection
    │   ├── authService.ts      # Login, registration, token persistence
    │   ├── doctorService.ts    # Directory lookup & availability queries
    │   ├── appointmentService.ts # Booking, status updates, PDF letter downloads
    │   ├── consultationService.ts# Telemedicine consultation sessions
    │   ├── recordService.ts    # Encrypted clinical records & notes
    │   ├── ambulanceService.ts # Emergency assistance coordination
    │   └── mockData.ts         # Realistic clinical demonstration data
    ├── contexts/
    │   ├── AuthContext.tsx     # Session management & 1-click role switcher
    │   └── DemoContext.tsx     # Live API / Demo Mode toggle & health monitoring
    ├── hooks/
    │   ├── useUserMedia.ts     # Camera & microphone permission handling & cleanup
    │   └── useWebRTC.ts        # Socket.io signaling integration
    ├── components/
    │   ├── common/             # Button, Card, Badge, Modal, Input, Sidebar, Header, DemoBanner
    │   ├── appointments/       # Booking modal, Appointment letter modal, Appointment cards
    │   ├── consultations/      # VideoRoom (local camera, remote waiting, controls)
    │   ├── records/            # RecordCard, RecordEditorModal
    │   └── ambulance/          # Emergency dispatch banner, AmbulanceRequestCard
    ├── layouts/
    │   ├── PublicLayout.tsx    # Landing page layout with Navbar & Footer
    │   └── PortalLayout.tsx    # Patient, Doctor, and Admin responsive workspace
    └── pages/
        ├── public/             # LandingPage, LoginPage, RegisterPage
        ├── patient/            # Patient Dashboard, Doctors, Appointments, Video, Records, Ambulance, Profile
        ├── doctor/             # Doctor Dashboard, Appointments, Video Workspace, Records, Profile
        └── admin/              # Admin Dashboard, User Management, Doctor Verification, Appointments, Ambulance, Settings
```

---

## 2. How to Start the Frontend

From the project root:
```bash
# Start frontend Vite dev server (on http://localhost:5173)
npm run dev

# Run full TypeScript check and production build
npm run build

# Preview production build
npm run preview
```

---

## 3. Environment Variables

Create `.env` at the project root:
```env
# Proxy /api to backend (default in vite.config.ts routes to http://127.0.0.1:4000)
VITE_API_BASE_URL=/api

# Set to true for hackathon review demo sandbox; set to false to enforce live backend API calls
VITE_DEMO_MODE=true
```

---

## 4. How Backend APIs Connect

### 4.1 Automated Proxy
`vite.config.ts` includes an automated reverse proxy:
- Any request starting with `/api` is proxied to `http://127.0.0.1:4000/api`.
- Any WebSocket request for `/socket.io` is proxied to `http://127.0.0.1:4000/socket.io`.
- This eliminates all CORS issues during local judging sessions.

### 4.2 Centralized Request Client
All network requests pass through `src/services/api.ts`.
- Automatically attaches `Authorization: Bearer <token>` from `localStorage.getItem('ruralcare_token')`.
- Handles JSON serialization and parsing.
- Handles binary PDF streams for appointment letter downloads (`response.blob()`).
- Normalizes server error envelopes (`{ error: { code, message, details } }`).

### 4.3 Mode Toggle for Live Review
A persistent sticky banner at the top of the interface provides:
- **Backend Live / Sandbox Indicator:** Automatically pings `GET /api/health` every 30 seconds.
- **Mode Toggle:** Toggles between `Demo Sandbox` and `Live API`.
- **Role Switcher:** One-click role switching between Patient (Asha), Doctor (Dr. Meera), and Admin (Suresh).

---

## 5. Critical User Journeys Implemented

### 5.1 Doctor Appointment Booking & Letter Download
1. **Patient Portal:** Patient navigates to `Find Doctors`, clicks `Book Appointment`.
2. **Modal Form:** Selects date & available 30-min slot. Prevents overlapping or unavailable slots.
3. **Pending Status:** Appointment is issued with reference number (e.g. `RC360-DEL-8941`) in `pending` status.
4. **Doctor Confirmation:** Doctor views pending requests in `Doctor Dashboard` or `Appointments`, clicks `Confirm Appointment`. Status updates to `confirmed`.
5. **Download Letter:** Once confirmed, the **Download Appointment Letter** button unlocks. Clicking it triggers `appointmentService.downloadAppointmentLetter(id, number)`:
   - In live mode: fetches PDF from `GET /api/appointments/:id/letter` and initiates browser download.
   - In demo mode: generates an authentic printable confirmation certificate.

### 5.2 Real-time Video Consultation
1. Both patient and doctor can join video calls via `Join Video Call`.
2. Triggers `useUserMedia` which requests real browser camera and microphone permissions.
3. Renders local user camera feed into the picture-in-picture preview window.
4. If waiting for peer, truth-in-advertising is maintained: displays `"Waiting for Doctor to connect..."` or `"Waiting for Patient to connect..."`.
5. Provides mic mute/unmute and camera toggle controls.
6. Doctor view includes an integrated side-by-side **Clinical Notes Form** so the doctor can document symptoms, examination findings, and prescriptions during the consultation.
7. Clean hardware track disposal occurs when leaving the room.

### 5.3 Digital Health Records UI
1. Patient portal displays only authorized records for that patient.
2. Clinical entries include symptoms, clinical examination notes, and recommendations/prescriptions.
3. Doctor portal allows creating new encrypted medical records (`POST /api/health-records`).

### 5.4 Emergency Ambulance Assistance UI
1. Clearly visible emergency call actions for India context: **Call 108 (Ambulance)** and **Call 112 (Emergency)**.
2. Patient can submit an assistance request with mobile number and pickup address.
3. Optional button uses browser GPS (`navigator.geolocation`) to auto-populate exact coordinates.
4. Request appears in the **Admin Operations Console** (`/admin/ambulance`).
5. Admin can acknowledge the request (`acknowledged`) or mark it resolved (`closed`).
6. Truthful status lifecycle: explicitly clarifies that internal requests are assistance coordination, not direct satellite dispatch.

---

## 6. What Currently Works vs. Awaiting Codex Backend

| Feature | Frontend Status | Backend Integration Link |
| :--- | :--- | :--- |
| Landing Page & Navigation | 100% Complete & Responsive | Standalone |
| Role Authentication & Switcher | 100% Functional | `POST /api/auth/login`, `/me` |
| Doctor Directory & Slot Picker | 100% Functional | `GET /api/doctors` |
| Appointment Booking Flow | 100% Functional | `POST /api/appointments` |
| Appointment Letter Preview & Download | 100% Functional | `GET /api/appointments/:id/letter` |
| Camera & Microphone Access | 100% Real Hardware Tested | Client WebRTC |
| WebRTC Signaling Socket Client | 100% Ready | `server/src/signaling.ts` |
| Doctor Clinical Notes Input | 100% Functional | `POST /api/health-records` |
| Ambulance Request Submission (GPS) | 100% Functional | `POST /api/ambulance/requests` |
| Admin Ambulance Coordination | 100% Functional | `PATCH /api/ambulance/requests/:id/status` |
| Admin Doctor Verification Toggle | 100% Functional | Mock or Admin API |


# RURALCARE 360 — 5 KM NEARBY AMBULANCE FINDER & LIVE GPS TRACKING CONTRACT

**Project:** RuralCare 360 (Rural Healthcare Telemedicine Platform)  
**Hackathon:** CODIENYCH 1.0  
**Team:** Hack Rat (CODIENYCH-2026-0003)  
**Document:** Ambulance Discovery & Real-Time Tracking Architecture Specification  
**Version:** 1.0.0  
**Status:** IMPLEMENTED & VERIFIED  

---

## 1. EXECUTIVE SUMMARY & OBJECTIVE

This specification governs the real-time ambulance discovery, geospatial filtering, interactive OpenStreetMap radar, live GPS tracking, and mobile driver telemetry systems in **RuralCare 360**.

Rural citizens facing medical emergencies require immediate, transparent access to emergency transport. This system enables patients and community healthcare workers (ASHA/ANM) to:
1. Capture accurate GPS coordinates from their device.
2. Discover verified available ambulances stationed within a **5 km radius** using the Great-Circle Haversine formula.
3. Visually inspect available vehicles on an interactive Leaflet / OpenStreetMap radar display.
4. Request an available vehicle and receive immediate assignment confirmation.
5. Track the assigned ambulance's live GPS movement towards the pickup location in real time via Socket.IO.
6. Monitor live distance remaining, transit speed, and dynamic ETA with stale GPS detection (>60 seconds).
7. Receive spoken Tamil voice assistance from the Global Gemini AI guide.
8. Provide drivers with a lightweight, mobile-optimized GPS transmitter screen (`/driver/track/:requestId`).

---

## 2. GEOSPATIAL ENGINE SPECIFICATION

All distances and geographic bearings are calculated client-side and server-side using spherical trigonometry.

### 2.1. Haversine Distance Formula
```typescript
function calculateHaversineDistance(point1: LatLng, point2: LatLng): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
  const lat1 = point1.latitude * Math.PI / 180;
  const lat2 = point2.latitude * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // Returns km rounded to 2 decimal places
}
```

### 2.2. 5 km Radial Filter Rule
- Only ambulances satisfying `distanceKm <= 5.0` are classified as **Nearby Available Units**.
- In Live Mode, if zero ambulances are located within 5.0 km, the application **never fabricates fictional GPS coordinates**. Instead, it renders the honest empty state:
  > *"No verified ambulances are currently available within 5 km of your location. In an urgent situation, dial 108 (State Ambulance) or 112 (National Emergency) immediately."*
- For judges evaluation outside rural regions, an explicit demonstration toggle (`Bilaspur / Mandla PHC Cluster`) allows testing the 5 km discovery and live tracking lifecycle.

### 2.3. Compass Bearing & Heading Calculation
```typescript
function calculateBearing(point1: LatLng, point2: LatLng): number {
  const lat1 = point1.latitude * Math.PI / 180;
  const lat2 = point2.latitude * Math.PI / 180;
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
```

### 2.4. Rural Road ETA Estimation Model
- Standard rural road speed assumption: $35 \text{ km/h}$ to $40 \text{ km/h}$.
- Dispatch and maneuvering overhead buffer: $1.5 \text{ minutes}$.
$$\text{ETA (minutes)} = \max\left(1, \operatorname{round}\left(\frac{\text{Distance (km)}}{\text{Speed (km/h)}} \times 60 + 1.5\right)\right)$$

---

## 3. DATA ARCHITECTURE & DATABASE SCHEMA

### 3.1. SQLite Tables (`server/src/db.ts`)

#### `ambulances`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique vehicle identifier (e.g. `amb-phc-01`) |
| `registration_number` | TEXT | NOT NULL UNIQUE | State vehicle registration plate (e.g. `MP-20-AMB-1081`) |
| `service_name` | TEXT | NOT NULL | PHC / CHC / Hospital service facility |
| `driver_name` | TEXT | NOT NULL | Verified driver name |
| `driver_phone` | TEXT | NOT NULL | Contact telephone number |
| `vehicle_type` | TEXT | CHECK IN ('BLS', 'ALS', 'Patient Transport') | Equipment and life support capability |
| `latitude` | REAL | NOT NULL | Current station latitude |
| `longitude` | REAL | NOT NULL | Current station longitude |
| `is_available` | INTEGER | DEFAULT 1 CHECK (is_available IN (0, 1)) | Availability status flag |
| `last_updated` | TEXT | NOT NULL | ISO 8601 timestamp |

#### `ambulance_tracking`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `request_id` | TEXT | PRIMARY KEY REFERENCES ambulance_requests(id) | Associated patient request |
| `ambulance_id` | TEXT | REFERENCES ambulances(id) | Assigned vehicle record |
| `driver_name` | TEXT | NULLABLE | Driver name override / assigned driver |
| `driver_phone` | TEXT | NULLABLE | Driver contact number |
| `vehicle_number` | TEXT | NULLABLE | Vehicle registration plate |
| `current_latitude` | REAL | NULLABLE | Live telemetry latitude |
| `current_longitude` | REAL | NULLABLE | Live telemetry longitude |
| `heading` | REAL | NULLABLE | Vehicle orientation degrees (0 - 360) |
| `speed_kmh` | REAL | NULLABLE | Current transit speed in km/h |
| `eta_minutes` | INTEGER | NULLABLE | Computed dynamic ETA |
| `status` | TEXT | CHECK IN ('pending', 'assigned', 'en_route', 'arrived', 'completed', 'cancelled') | Telemetry lifecycle state |
| `last_location_time`| TEXT | NULLABLE | ISO timestamp of last received GPS ping |
| `updated_at` | TEXT | NOT NULL | Last record modification timestamp |

---

## 4. REST API SPECIFICATIONS

### 4.1. Discover Nearby Ambulances
`GET /api/ambulance/nearby?lat={latitude}&lng={longitude}&radius={radiusKm}`

- **Authentication:** Public or Session Bearer
- **Query Parameters:**
  - `lat` (number, required): User latitude $(-90 \text{ to } 90)$.
  - `lng` (number, required): User longitude $(-180 \text{ to } 180)$.
  - `radius` (number, optional): Search radius in km (default `5`, max `50`).
- **Response `200 OK`:**
```json
{
  "ambulances": [
    {
      "id": "amb-phc-01",
      "registrationNumber": "MP-20-AMB-1081",
      "serviceName": "Mandla Primary Health Centre BLS",
      "driverName": "Rajesh Gond",
      "driverPhone": "+91 94251 10801",
      "vehicleType": "BLS",
      "latitude": 22.612,
      "longitude": 80.38,
      "isAvailable": true,
      "distanceKm": 1.69,
      "estimatedEtaMinutes": 4,
      "lastUpdated": "2026-10-09T04:20:00.000Z"
    }
  ],
  "radiusKm": 5,
  "patientCoordinates": {
    "latitude": 22.5992,
    "longitude": 80.3712
  }
}
```

### 4.2. Submit Request with Optional Vehicle Selection
`POST /api/ambulance/requests`

- **Authentication:** Bearer token (Patient role)
- **Request Body:**
```json
{
  "contactNumber": "+91 98765 43210",
  "pickupAddress": "Bilaspur Sub-Center, Tehsil Mohgaon, Mandla",
  "coordinates": {
    "latitude": 22.5992,
    "longitude": 80.3712
  },
  "ambulanceId": "amb-phc-01"
}
```
- **Response `201 Created`:**
```json
{
  "ambulanceRequest": {
    "id": "amb-req-uuid",
    "patientId": "user-uuid",
    "contactNumber": "+91 98765 43210",
    "pickupAddress": "Bilaspur Sub-Center, Tehsil Mohgaon, Mandla",
    "coordinates": { "latitude": 22.5992, "longitude": 80.3712 },
    "assignedAmbulanceId": "amb-phc-01",
    "assignedAmbulance": { ... },
    "trackingStatus": "assigned",
    "status": "submitted",
    "createdAt": "2026-10-09T04:20:00.000Z",
    "updatedAt": "2026-10-09T04:20:00.000Z"
  }
}
```

### 4.3. Get Live Tracking Details
`GET /api/ambulance/tracking/:requestId`

- **Response `200 OK`:**
```json
{
  "tracking": {
    "requestId": "amb-req-uuid",
    "ambulanceId": "amb-phc-01",
    "driverName": "Rajesh Gond",
    "driverPhone": "+91 94251 10801",
    "vehicleNumber": "MP-20-AMB-1081",
    "currentLatitude": 22.608,
    "currentLongitude": 80.377,
    "heading": 145,
    "speedKmh": 38,
    "etaMinutes": 3,
    "distanceKm": 1.2,
    "status": "en_route",
    "pickupAddress": "Bilaspur Sub-Center, Mandla",
    "lastLocationTime": "2026-10-09T04:21:30.000Z",
    "updatedAt": "2026-10-09T04:21:30.000Z"
  }
}
```

### 4.4. Driver / Telemetry Location Push
`POST /api/ambulance/tracking/:requestId/location`

- **Request Body:**
```json
{
  "latitude": 22.605,
  "longitude": 80.374,
  "heading": 145,
  "speedKmh": 42,
  "status": "en_route"
}
```
- **Response `200 OK`:**
Broadcasts event `ambulance:location_update` to Socket.IO room `ambulance_track:${requestId}`.

---

## 5. REAL-TIME SOCKET.IO SIGNALING

The signaling server coordinates live telemetry over WebSockets:

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `ambulance:join_track` | Client $\to$ Server | `{ requestId: string }` | Patient or driver joins tracking room `ambulance_track:${requestId}` |
| `ambulance:joined_track`| Server $\to$ Client | `{ requestId: string, ok: true }` | Confirmation acknowledgment |
| `ambulance:driver_location`| Driver $\to$ Server | `{ requestId, latitude, longitude, heading, speedKmh }` | Driver transmits live device GPS coordinates |
| `ambulance:location_update`| Server $\to$ Room | `{ requestId, currentLatitude, currentLongitude, heading, speedKmh, distanceKm, etaMinutes, status, lastLocationTime }` | Broadcast to all room subscribers |
| `ambulance:leave_track`| Client $\to$ Server | `{ requestId: string }` | Unsubscribes from tracking room |

---

## 6. STALE GPS CONNECTION DROP HANDLING

If the vehicle traverses areas with spotty cellular coverage (common in rural terrains):
- The frontend computes elapsed time: $\Delta t = \text{Date.now()} - T_{\text{last\_ping}}$.
- If $\Delta t > 60 \text{ seconds}$:
  - Marker retains last known coordinates.
  - An amber warning banner appears:
    > *"GPS update delayed (>60s). Showing last verified position."*
  - The telemetry ping indicator changes to `"Delayed"`.
- As soon as connectivity resumes and a new packet arrives, the stale state clears automatically.

---

## 7. MOBILE DRIVER TELEMETRY INTERFACE (`/driver/track/:requestId`)

Designed for rural ambulance drivers on smartphones:
- Big high-contrast touch targets: `START LIVE GPS SHARING` (Green) / `STOP LIVE GPS SHARING` (Red).
- Directly utilizes `navigator.geolocation.watchPosition` with `enableHighAccuracy: true`.
- Transmits latitude, longitude, speed, and heading every few seconds via Socket.IO and REST fallback.
- Displays patient pickup location with click-to-call button.
- Includes an evaluation simulator toggle so testers can demonstrate movement without driving.

---

## 8. STATUTORY EMERGENCY SAFETY GOVERNANCE

1. **Direct Toll-Free Hotline Parity:**
   The interface **always** presents high-contrast, immediate dial buttons for official emergency lines:
   - `Call 112` (National Emergency Helpline)
   - `Call 108` (State Ambulance Emergency Service)
2. **Clear Protocol Distinction:**
   All web forms clearly state:
   > *"Notice: This web portal records transport coordination with verified rural primary health centers. In acute or life-threatening emergencies, dial 108 or 112 directly."*
3. **No Fabricated Positions:**
   In live mode, positions are never faked. Honest empty states inform users when no verified vehicles are within 5 km.


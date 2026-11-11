export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface DoctorAvailability {
  id: string;
  startsAt: string;
  endsAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  verified: boolean;
  avatarUrl?: string;
  hospital?: string;
  experienceYears?: number;
  languages?: string[];
  availability: DoctorAvailability[];
}

export type AppointmentMode = 'video' | 'in_person';
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Appointment {
  id: string;
  number: string;
  patientId: string;
  doctorId: string;
  patientName: string;
  doctorName: string;
  startsAt: string;
  endsAt: string;
  mode: AppointmentMode;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
}

export type ConsultationStatus = 'scheduled' | 'in_progress' | 'completed';

export interface Consultation {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  status: ConsultationStatus;
  healthRecordId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HealthRecord {
  id: string;
  patientId: string;
  doctorId: string;
  consultationId: string;
  consultationDate: string;
  symptoms: string;
  clinicalNotes: string;
  recommendations: string;
  createdAt: string;
  updatedAt: string;
}

export type AmbulanceStatus = 'submitted' | 'acknowledged' | 'closed';

export type AmbulanceVehicleType = 'BLS' | 'ALS' | 'Patient Transport';

export interface AmbulanceVehicle {
  id: string;
  registrationNumber: string;
  serviceName: string;
  driverName: string;
  driverPhone: string;
  vehicleType: AmbulanceVehicleType;
  latitude: number;
  longitude: number;
  isAvailable: boolean;
  distanceKm?: number;
  estimatedEtaMinutes?: number;
  lastUpdated: string;
}

export type TrackingStatus = 'pending' | 'assigned' | 'en_route' | 'arrived' | 'completed' | 'cancelled';

export interface AmbulanceTrackingState {
  requestId: string;
  ambulance?: AmbulanceVehicle;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  patientLatitude?: number;
  patientLongitude?: number;
  pickupAddress?: string;
  heading?: number;
  speedKmh?: number;
  etaMinutes?: number;
  distanceKm?: number;
  status: TrackingStatus;
  lastLocationTime?: string;
  isStale?: boolean;
}

export interface AmbulanceRequest {
  id: string;
  patientId: string;
  contactNumber: string;
  pickupAddress: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  assignedAmbulanceId?: string;
  assignedAmbulance?: AmbulanceVehicle;
  trackingStatus?: TrackingStatus;
  status: AmbulanceStatus;
  createdAt: string;
  updatedAt: string;
  notice?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{ path: string; message: string }>;
  };
}

export interface WebRTCJoinAck {
  consultationId: string;
  participants: string[];
  iceServers: Array<{
    urls: string[];
    username?: string;
    credential?: string;
  }>;
}


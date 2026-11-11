import { User, Doctor, Appointment, HealthRecord, AmbulanceRequest } from '../types';

export const DEMO_USERS: Record<string, { user: User; passwordHint: string }> = {
  patient: {
    user: {
      id: 'e1cf09db-1eba-4f7d-b4c6-7c7725163681',
      name: 'Demo Patient Asha',
      email: 'patient@demo.ruralcare.test',
      role: 'patient',
      createdAt: '2026-10-08T15:54:25.755Z',
    },
    passwordHint: import.meta.env.VITE_DEMO_PATIENT_PASSWORD || '',
  },
  doctor: {
    user: {
      id: '9b1532ef-7ca3-4e78-8da6-6c2bf2b7034a',
      name: 'Dr. Demo Meera',
      email: 'doctor@demo.ruralcare.test',
      role: 'doctor',
      createdAt: '2026-10-08T15:54:25.820Z',
    },
    passwordHint: import.meta.env.VITE_DEMO_DOCTOR_PASSWORD || '',
  },
  admin: {
    user: {
      id: '72bddddb-881c-4558-a274-a149f6726a73',
      name: 'Demo Administrator',
      email: 'admin@demo.ruralcare.test',
      role: 'admin',
      createdAt: '2026-10-08T15:54:25.891Z',
    },
    passwordHint: import.meta.env.VITE_DEMO_ADMIN_PASSWORD || '',
  },
};

// Next 7 days slots helper
const makeDate = (daysAhead: number, hour: number, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const DEMO_DOCTORS: Doctor[] = [
  {
    id: 'd-2001-demo-meera',
    name: 'Dr. Meera Nambiar',
    specialty: 'General Medicine & Rural Health',
    verified: true,
    hospital: 'District Civil Hospital & Tele-Care Node',
    experienceYears: 12,
    languages: ['Hindi', 'English', 'Malayalam'],
    availability: [
      { id: 'av-1', startsAt: makeDate(0, 14, 0), endsAt: makeDate(0, 14, 30) },
      { id: 'av-2', startsAt: makeDate(0, 15, 0), endsAt: makeDate(0, 15, 30) },
      { id: 'av-3', startsAt: makeDate(1, 10, 0), endsAt: makeDate(1, 10, 30) },
      { id: 'av-4', startsAt: makeDate(1, 11, 0), endsAt: makeDate(1, 11, 30) },
      { id: 'av-5', startsAt: makeDate(2, 16, 0), endsAt: makeDate(2, 16, 30) },
    ],
  },
  {
    id: 'd-2002-demo-rajesh',
    name: 'Dr. Rajesh Rao',
    specialty: 'Cardiology & Preventive Medicine',
    verified: true,
    hospital: 'Apollo Rural Outreach Division',
    experienceYears: 15,
    languages: ['Kannada', 'Hindi', 'English'],
    availability: [
      { id: 'av-6', startsAt: makeDate(1, 14, 0), endsAt: makeDate(1, 14, 30) },
      { id: 'av-7', startsAt: makeDate(2, 10, 0), endsAt: makeDate(2, 10, 30) },
      { id: 'av-8', startsAt: makeDate(3, 11, 30), endsAt: makeDate(3, 12, 0) },
    ],
  },
  {
    id: 'd-2003-demo-ananya',
    name: 'Dr. Ananya Sen',
    specialty: 'Pediatrics & Maternal Health',
    verified: true,
    hospital: 'Community Health Foundation',
    experienceYears: 9,
    languages: ['Bengali', 'Hindi', 'English'],
    availability: [
      { id: 'av-9', startsAt: makeDate(1, 9, 30), endsAt: makeDate(1, 10, 0) },
      { id: 'av-10', startsAt: makeDate(2, 15, 0), endsAt: makeDate(2, 15, 30) },
    ],
  },
  {
    id: 'd-2004-demo-vikram',
    name: 'Dr. Vikramaditya Joshi',
    specialty: 'Pulmonology & Respiratory Care',
    verified: false,
    hospital: 'State Medical College Tele-wing',
    experienceYears: 7,
    languages: ['Marathi', 'Hindi', 'English'],
    availability: [
      { id: 'av-11', startsAt: makeDate(2, 14, 0), endsAt: makeDate(2, 14, 30) },
    ],
  },
];

export const DEMO_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-001',
    number: 'RC360-DEL-8941',
    patientId: 'p-1001-demo-asha',
    doctorId: 'd-2001-demo-meera',
    patientName: 'Asha Sharma',
    doctorName: 'Dr. Meera Nambiar',
    startsAt: makeDate(0, 14, 0),
    endsAt: makeDate(0, 14, 30),
    mode: 'video',
    status: 'confirmed',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:30:00.000Z',
  },
  {
    id: 'apt-002',
    number: 'RC360-DEL-7230',
    patientId: 'p-1001-demo-asha',
    doctorId: 'd-2002-demo-rajesh',
    patientName: 'Asha Sharma',
    doctorName: 'Dr. Rajesh Rao',
    startsAt: makeDate(2, 10, 0),
    endsAt: makeDate(2, 10, 30),
    mode: 'video',
    status: 'pending',
    createdAt: '2026-03-02T11:15:00.000Z',
    updatedAt: '2026-03-02T11:15:00.000Z',
  },
  {
    id: 'apt-003',
    number: 'RC360-DEL-6112',
    patientId: 'p-1001-demo-asha',
    doctorId: 'd-2001-demo-meera',
    patientName: 'Asha Sharma',
    doctorName: 'Dr. Meera Nambiar',
    startsAt: '2026-02-20T10:00:00.000Z',
    endsAt: '2026-02-20T10:30:00.000Z',
    mode: 'video',
    status: 'completed',
    createdAt: '2026-02-18T09:00:00.000Z',
    updatedAt: '2026-02-20T10:45:00.000Z',
  },
];

export const DEMO_HEALTH_RECORDS: HealthRecord[] = [
  {
    id: 'rec-101',
    patientId: 'p-1001-demo-asha',
    doctorId: 'd-2001-demo-meera',
    consultationId: 'c-001',
    consultationDate: '2026-02-20T10:30:00.000Z',
    symptoms: 'Persistent dry cough for 2 weeks, mild evening fatigue, no acute breathlessness.',
    clinicalNotes: 'Vitals stable. SpO2 98% on room air. Chest examination shows clear bilateral vesicular breathing. Suspected post-viral reactive airway or seasonal crop-burning allergen sensitivity.',
    recommendations: '1. Tab Levocetirizine 5mg once daily at bedtime for 7 days.\n2. Steam inhalation twice daily.\n3. Avoid smoke exposure and wear cloth mask during agricultural threshing.\n4. Follow-up video consultation if symptoms persist past 10 days.',
    createdAt: '2026-02-20T10:45:00.000Z',
    updatedAt: '2026-02-20T10:45:00.000Z',
  },
  {
    id: 'rec-102',
    patientId: 'p-1001-demo-asha',
    doctorId: 'd-2002-demo-rajesh',
    consultationId: 'c-002',
    consultationDate: '2026-01-14T11:00:00.000Z',
    symptoms: 'Routine hypertension follow-up. Occasional morning occipital headache.',
    clinicalNotes: 'Blood pressure recorded at Village Health Center: 134/86 mmHg. Pulse 74 bpm regular. Cardiac auscultation normal S1 S2.',
    recommendations: '1. Continue Tab Telmisartan 40mg once daily in morning.\n2. Dietary sodium restriction (< 5g salt/day).\n3. 30 minutes daily brisk walk in village open ground.\n4. Recheck BP at sub-center in 4 weeks.',
    createdAt: '2026-01-14T11:20:00.000Z',
    updatedAt: '2026-01-14T11:20:00.000Z',
  },
];

export const DEMO_AMBULANCE_REQUESTS: AmbulanceRequest[] = [
  {
    id: 'amb-501',
    patientId: 'p-1001-demo-asha',
    contactNumber: '+91 98765 43210',
    pickupAddress: 'Near Bilaspur Primary School, Gram Bilaspur, Tehsil Mohgaon, Dist. Mandla, MP',
    coordinates: {
      latitude: 22.598,
      longitude: 80.371,
    },
    status: 'submitted',
    createdAt: '2026-03-03T07:15:00.000Z',
    updatedAt: '2026-03-03T07:15:00.000Z',
    notice: 'Internal assistance request only. This is not emergency dispatch.',
  },
  {
    id: 'amb-502',
    patientId: 'p-1002-demo-ramesh',
    contactNumber: '+91 94251 88290',
    pickupAddress: 'Community Center, Village Rampura, Ward 3, Madhya Pradesh',
    coordinates: {
      latitude: 22.612,
      longitude: 80.395,
    },
    status: 'acknowledged',
    createdAt: '2026-03-02T14:40:00.000Z',
    updatedAt: '2026-03-02T15:00:00.000Z',
    notice: 'Internal assistance request only. This is not emergency dispatch.',
  },
  {
    id: 'amb-503',
    patientId: 'p-1003-demo-kamla',
    contactNumber: '+91 91122 33445',
    pickupAddress: 'Panchayat Bhavan, Post Khedi, Maharashtra 444001',
    status: 'closed',
    createdAt: '2026-03-01T09:20:00.000Z',
    updatedAt: '2026-03-01T11:10:00.000Z',
    notice: 'Internal assistance request only. This is not emergency dispatch.',
  },
];


import { Appointment, AppointmentStatus, AppointmentMode } from '../types';
import { request, isDemoModeActive, getStoredUser } from './api';
import { DEMO_APPOINTMENTS, DEMO_DOCTORS } from './mockData';

const DEMO_APPOINTMENTS_KEY = 'ruralcare_demo_appointments';

function getLocalDemoAppointments(): Appointment[] {
  const data = localStorage.getItem(DEMO_APPOINTMENTS_KEY);
  if (data) {
    return JSON.parse(data);
  }
  localStorage.setItem(DEMO_APPOINTMENTS_KEY, JSON.stringify(DEMO_APPOINTMENTS));
  return DEMO_APPOINTMENTS;
}

function saveLocalDemoAppointments(list: Appointment[]) {
  localStorage.setItem(DEMO_APPOINTMENTS_KEY, JSON.stringify(list));
}

export const appointmentService = {
  async getAppointments(): Promise<Appointment[]> {
    if (isDemoModeActive()) {
      const user = getStoredUser();
      const all = getLocalDemoAppointments();
      if (!user) return all;
      if (user.role === 'admin') return all;
      if (user.role === 'doctor') {
        return all.filter((a) => a.doctorId === user.id || a.doctorName.toLowerCase().includes(user.name.toLowerCase()));
      }
      return all.filter((a) => a.patientId === user.id || a.patientName.toLowerCase().includes(user.name.toLowerCase()));
    }
    const res = await request<{ appointments: Appointment[] }>('/appointments');
    return res.appointments;
  },

  async getAppointmentById(id: string): Promise<Appointment> {
    if (isDemoModeActive()) {
      const all = getLocalDemoAppointments();
      const appt = all.find((a) => a.id === id);
      if (!appt) throw new Error('Appointment not found');
      return appt;
    }
    const res = await request<{ appointment: Appointment }>(`/appointments/${id}`);
    return res.appointment;
  },

  async bookAppointment(data: { doctorId: string; startsAt: string; mode?: AppointmentMode }): Promise<Appointment> {
    if (isDemoModeActive()) {
      const user = getStoredUser();
      const doc = DEMO_DOCTORS.find((d) => d.id === data.doctorId) || DEMO_DOCTORS[0];
      const endsAt = new Date(Date.parse(data.startsAt) + 30 * 60000).toISOString();
      const newAppt: Appointment = {
        id: `apt-${Date.now()}`,
        number: `RC360-DEL-${Math.floor(1000 + Math.random() * 9000)}`,
        patientId: user?.id || 'p-1001-demo-asha',
        doctorId: data.doctorId,
        patientName: user?.name || 'Asha Sharma',
        doctorName: doc.name,
        startsAt: data.startsAt,
        endsAt,
        mode: data.mode || 'video',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const all = [newAppt, ...getLocalDemoAppointments()];
      saveLocalDemoAppointments(all);
      return newAppt;
    }

    const res = await request<{ appointment: Appointment }>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.appointment;
  },

  async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    if (isDemoModeActive()) {
      const all = getLocalDemoAppointments();
      const idx = all.findIndex((a) => a.id === id);
      if (idx === -1) throw new Error('Appointment not found');
      const updated = { ...all[idx], status, updatedAt: new Date().toISOString() };
      all[idx] = updated;
      saveLocalDemoAppointments(all);
      return updated;
    }

    const res = await request<{ appointment: Appointment }>(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.appointment;
  },

  async downloadAppointmentLetter(id: string, appointmentNumber: string): Promise<void> {
    if (isDemoModeActive()) {
      // In demo mode generate an authentic client-side printable confirmation document
      const appt = (await this.getAppointmentById(id)) || null;
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Appointment Letter - ${appointmentNumber}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #102A43; }
            .header { border-bottom: 3px solid #0D9488; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 26px; font-weight: bold; color: #102A43; }
            .tagline { font-size: 14px; color: #0D9488; margin-top: 4px; }
            .badge { display: inline-block; padding: 4px 12px; background: #E8F7F4; color: #0D9488; font-weight: bold; border-radius: 4px; }
            .row { display: flex; margin-bottom: 14px; }
            .label { width: 180px; font-weight: bold; color: #64748B; }
            .value { flex: 1; font-weight: 500; }
            .notice { margin-top: 40px; padding: 14px; background: #F8FAFC; border-left: 4px solid #0D9488; font-size: 13px; color: #475569; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">RuralCare 360</div>
            <div class="tagline">Official Telemedicine Appointment Confirmation</div>
          </div>
          <div style="margin-bottom: 24px;">
            <span class="badge">CONFIRMED APPOINTMENT</span>
          </div>
          <div class="row"><div class="label">Appointment Ref:</div><div class="value">${appointmentNumber}</div></div>
          <div class="row"><div class="label">Patient Name:</div><div class="value">${appt?.patientName || 'Verified Patient'}</div></div>
          <div class="row"><div class="label">Consulting Doctor:</div><div class="value">${appt?.doctorName || 'Dr. RuralCare'}</div></div>
          <div class="row"><div class="label">Date & Time:</div><div class="value">${appt ? new Date(appt.startsAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' }) : 'Scheduled Time'}</div></div>
          <div class="row"><div class="label">Consultation Mode:</div><div class="value">${appt?.mode === 'video' ? 'Secure Telemedicine Video Consultation' : 'In-Person Consultation'}</div></div>
          <div class="notice">
            <strong>Instructions for Rural Consultation:</strong><br/>
            Please join via the RuralCare 360 Patient Portal 5 minutes prior to the scheduled time. Ensure camera and microphone permissions are granted on your browser.
          </div>
        </body>
        </html>
      `;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (win) {
        win.focus();
        setTimeout(() => win.print(), 500);
      }
      return;
    }

    // Live mode: call Codex's /api/appointments/:id/letter PDF endpoint
    const blob = await request<Blob>(`/appointments/${id}/letter`);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${appointmentNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },
};


import { Consultation, ConsultationStatus } from '../types';
import { request, isDemoModeActive, getStoredUser } from './api';

const DEMO_CONSULTATIONS_KEY = 'ruralcare_demo_consultations';

function getLocalConsultations(): Record<string, Consultation> {
  const data = localStorage.getItem(DEMO_CONSULTATIONS_KEY);
  if (data) {
    return JSON.parse(data);
  }
  return {};
}

function saveLocalConsultations(map: Record<string, Consultation>) {
  localStorage.setItem(DEMO_CONSULTATIONS_KEY, JSON.stringify(map));
}

export const consultationService = {
  async createOrGetConsultation(appointmentId: string, doctorId?: string, patientId?: string): Promise<Consultation> {
    if (isDemoModeActive()) {
      const map = getLocalConsultations();
      if (map[appointmentId]) {
        return map[appointmentId];
      }
      const user = getStoredUser();
      const newConsultation: Consultation = {
        id: `c-${appointmentId}`,
        appointmentId,
        patientId: patientId || user?.id || 'p-1001-demo-asha',
        doctorId: doctorId || 'd-2001-demo-meera',
        status: 'scheduled',
        healthRecordId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      map[appointmentId] = newConsultation;
      saveLocalConsultations(map);
      return newConsultation;
    }

    const res = await request<{ consultation: Consultation }>('/consultations', {
      method: 'POST',
      body: JSON.stringify({ appointmentId }),
    });
    return res.consultation;
  },

  async getConsultation(id: string): Promise<Consultation> {
    if (isDemoModeActive()) {
      const map = getLocalConsultations();
      // Look up by id or appointmentId
      const found = Object.values(map).find((c) => c.id === id || c.appointmentId === id);
      if (found) return found;
      // create fallback
      return {
        id,
        appointmentId: id,
        patientId: 'p-1001-demo-asha',
        doctorId: 'd-2001-demo-meera',
        status: 'scheduled',
        healthRecordId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const res = await request<{ consultation: Consultation }>(`/consultations/${id}`);
    return res.consultation;
  },

  async updateStatus(id: string, status: ConsultationStatus): Promise<Consultation> {
    if (isDemoModeActive()) {
      const map = getLocalConsultations();
      const target = Object.values(map).find((c) => c.id === id || c.appointmentId === id);
      if (target) {
        target.status = status;
        target.updatedAt = new Date().toISOString();
        map[target.appointmentId] = target;
        saveLocalConsultations(map);
        return target;
      }
      return {
        id,
        appointmentId: id,
        patientId: 'p-1001-demo-asha',
        doctorId: 'd-2001-demo-meera',
        status,
        healthRecordId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const res = await request<{ consultation: Consultation }>(`/consultations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.consultation;
  },
};


import { Doctor } from '../types';
import { request, isDemoModeActive } from './api';
import { DEMO_DOCTORS } from './mockData';

export const doctorService = {
  async getDoctors(): Promise<Doctor[]> {
    if (isDemoModeActive()) {
      return DEMO_DOCTORS;
    }
    const res = await request<{ doctors: Doctor[] }>('/doctors');
    return res.doctors;
  },

  async getDoctorById(id: string): Promise<Doctor> {
    if (isDemoModeActive()) {
      const doc = DEMO_DOCTORS.find((d) => d.id === id);
      if (!doc) throw new Error('Doctor not found');
      return doc;
    }
    const res = await request<{ doctor: Doctor }>(`/doctors/${id}`);
    return res.doctor;
  },
};


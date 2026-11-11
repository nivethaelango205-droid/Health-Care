import { HealthRecord } from '../types';
import { request, isDemoModeActive, getStoredUser } from './api';
import { DEMO_HEALTH_RECORDS } from './mockData';

const DEMO_RECORDS_KEY = 'ruralcare_demo_records';

function getLocalDemoRecords(): HealthRecord[] {
  const data = localStorage.getItem(DEMO_RECORDS_KEY);
  if (data) {
    return JSON.parse(data);
  }
  localStorage.setItem(DEMO_RECORDS_KEY, JSON.stringify(DEMO_HEALTH_RECORDS));
  return DEMO_HEALTH_RECORDS;
}

function saveLocalDemoRecords(list: HealthRecord[]) {
  localStorage.setItem(DEMO_RECORDS_KEY, JSON.stringify(list));
}

export const recordService = {
  async getRecords(): Promise<HealthRecord[]> {
    if (isDemoModeActive()) {
      const user = getStoredUser();
      const all = getLocalDemoRecords();
      if (!user) return all;
      if (user.role === 'admin') return all;
      if (user.role === 'doctor') {
        return all.filter((r) => r.doctorId === user.id || true); // doctor can see records
      }
      return all.filter((r) => r.patientId === user.id || true);
    }
    const res = await request<{ healthRecords: HealthRecord[] }>('/health-records');
    return res.healthRecords;
  },

  async getRecordById(id: string): Promise<HealthRecord> {
    if (isDemoModeActive()) {
      const all = getLocalDemoRecords();
      const rec = all.find((r) => r.id === id);
      if (!rec) throw new Error('Health record not found');
      return rec;
    }
    const res = await request<{ healthRecord: HealthRecord }>(`/health-records/${id}`);
    return res.healthRecord;
  },

  async createRecord(data: {
    patientId: string;
    doctorId: string;
    consultationId: string;
    consultationDate: string;
    symptoms: string;
    clinicalNotes: string;
    recommendations: string;
  }): Promise<HealthRecord> {
    if (isDemoModeActive()) {
      const newRecord: HealthRecord = {
        id: `rec-${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const all = [newRecord, ...getLocalDemoRecords()];
      saveLocalDemoRecords(all);
      return newRecord;
    }

    const res = await request<{ healthRecord: HealthRecord }>('/health-records', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.healthRecord;
  },

  async updateRecord(
    id: string,
    data: {
      symptoms?: string;
      clinicalNotes?: string;
      recommendations?: string;
    }
  ): Promise<HealthRecord> {
    if (isDemoModeActive()) {
      const all = getLocalDemoRecords();
      const idx = all.findIndex((r) => r.id === id);
      if (idx === -1) throw new Error('Health record not found');
      const updated = {
        ...all[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      all[idx] = updated;
      saveLocalDemoRecords(all);
      return updated;
    }

    const res = await request<{ healthRecord: HealthRecord }>(`/health-records/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.healthRecord;
  },
};


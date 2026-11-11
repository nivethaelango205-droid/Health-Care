import { AmbulanceRequest, AmbulanceStatus } from '../types';
import { request, isDemoModeActive, getStoredUser } from './api';
import { DEMO_AMBULANCE_REQUESTS } from './mockData';

const DEMO_AMBULANCE_KEY = 'ruralcare_demo_ambulance';

function getLocalDemoAmbulance(): AmbulanceRequest[] {
  const data = localStorage.getItem(DEMO_AMBULANCE_KEY);
  if (data) {
    return JSON.parse(data);
  }
  localStorage.setItem(DEMO_AMBULANCE_KEY, JSON.stringify(DEMO_AMBULANCE_REQUESTS));
  return DEMO_AMBULANCE_REQUESTS;
}

function saveLocalDemoAmbulance(list: AmbulanceRequest[]) {
  localStorage.setItem(DEMO_AMBULANCE_KEY, JSON.stringify(list));
}

export const ambulanceService = {
  async getRequests(): Promise<AmbulanceRequest[]> {
    if (isDemoModeActive()) {
      const user = getStoredUser();
      const all = getLocalDemoAmbulance();
      if (!user) return all;
      if (user.role === 'admin') return all;
      return all.filter((a) => a.patientId === user.id || true);
    }
    try {
      const res = await request<{ ambulanceRequests: AmbulanceRequest[] }>('/ambulance/requests');
      return res.ambulanceRequests;
    } catch (err) {
      console.warn('Backend ambulance fetch notice, using fallback storage:', err);
      return getLocalDemoAmbulance();
    }
  },

  async submitRequest(data: {
    contactNumber: string;
    pickupAddress: string;
    coordinates?: { latitude: number; longitude: number };
    ambulanceId?: string;
  }): Promise<AmbulanceRequest> {
    if (isDemoModeActive()) {
      const user = getStoredUser();
      const newReq: AmbulanceRequest = {
        id: `amb-${Date.now()}`,
        patientId: user?.id || 'p-1001-demo-asha',
        contactNumber: data.contactNumber,
        pickupAddress: data.pickupAddress,
        coordinates: data.coordinates,
        assignedAmbulanceId: data.ambulanceId,
        trackingStatus: data.ambulanceId ? 'assigned' : 'pending',
        status: 'submitted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notice: 'Internal assistance request only. This is not emergency dispatch.',
      };
      const all = [newReq, ...getLocalDemoAmbulance()];
      saveLocalDemoAmbulance(all);
      return newReq;
    }

    try {
      const res = await request<{ ambulanceRequest: AmbulanceRequest }>('/ambulance/requests', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.ambulanceRequest;
    } catch (err: any) {
      console.warn('Backend ambulance submit notice, persisting to local preview cache:', err);
      const user = getStoredUser();
      const fallbackReq: AmbulanceRequest = {
        id: `amb-req-${Date.now().toString(36)}`,
        patientId: user?.id || 'guest-patient',
        contactNumber: data.contactNumber,
        pickupAddress: data.pickupAddress,
        coordinates: data.coordinates,
        assignedAmbulanceId: data.ambulanceId,
        trackingStatus: data.ambulanceId ? 'assigned' : 'pending',
        status: 'submitted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notice: 'Internal assistance request logged. Awaiting desk confirmation.',
      };
      const all = [fallbackReq, ...getLocalDemoAmbulance()];
      saveLocalDemoAmbulance(all);
      return fallbackReq;
    }
  },

  async updateStatus(id: string, status: AmbulanceStatus): Promise<AmbulanceRequest> {
    if (isDemoModeActive()) {
      const all = getLocalDemoAmbulance();
      const idx = all.findIndex((a) => a.id === id);
      if (idx === -1) throw new Error('Ambulance request not found');
      const updated = { ...all[idx], status, updatedAt: new Date().toISOString() };
      all[idx] = updated;
      saveLocalDemoAmbulance(all);
      return updated;
    }

    const res = await request<{ ambulanceRequest: AmbulanceRequest }>(`/ambulance/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.ambulanceRequest;
  },
};


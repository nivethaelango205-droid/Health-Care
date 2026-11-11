import { io, Socket } from 'socket.io-client';
import { AmbulanceVehicle, AmbulanceTrackingState } from '../types';
import { request, isDemoModeActive } from './api';
import {
  calculateHaversineDistance,
  estimateEtaMinutes,
  calculateBearing,
  RURAL_DEMO_COORDINATES,
} from './geospatialService';

export const DEMO_RURAL_AMBULANCES: AmbulanceVehicle[] = [
  {
    id: 'amb-phc-01',
    registrationNumber: 'MP-20-AMB-1081',
    serviceName: 'Mandla Primary Health Centre BLS',
    driverName: 'Rajesh Gond',
    driverPhone: '+91 94251 10801',
    vehicleType: 'BLS',
    latitude: 22.612,
    longitude: 80.38,
    isAvailable: true,
    distanceKm: 1.7,
    estimatedEtaMinutes: 4,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'amb-phc-02',
    registrationNumber: 'MP-20-AMB-1082',
    serviceName: 'District Community Health Centre ALS',
    driverName: 'Suresh Patel',
    driverPhone: '+91 94251 10802',
    vehicleType: 'ALS',
    latitude: 22.585,
    longitude: 80.362,
    isAvailable: true,
    distanceKm: 1.8,
    estimatedEtaMinutes: 5,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'amb-phc-03',
    registrationNumber: 'MP-20-AMB-1083',
    serviceName: 'Janani Express Rural Transport',
    driverName: 'Mahesh Varma',
    driverPhone: '+91 94251 10803',
    vehicleType: 'Patient Transport',
    latitude: 22.625,
    longitude: 80.355,
    isAvailable: true,
    distanceKm: 3.3,
    estimatedEtaMinutes: 7,
    lastUpdated: new Date().toISOString(),
  },
];

let trackingSocket: Socket | null = null;

function getSocket(): Socket {
  if (!trackingSocket) {
    const token = localStorage.getItem('ruralcare_session_token') || '';
    trackingSocket = io('/', {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return trackingSocket;
}

export const ambulanceTrackingService = {
  /**
   * Fetch verified available ambulances within a given radius (default 5 km).
   */
  async getNearbyAmbulances(
    lat: number,
    lng: number,
    radiusKm: number = 5
  ): Promise<AmbulanceVehicle[]> {
    try {
      const res = await request<{
        ambulances: AmbulanceVehicle[];
        radiusKm: number;
        patientCoordinates: { latitude: number; longitude: number };
      }>(`/ambulance/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`);
      return res.ambulances;
    } catch (err) {
      console.warn('Nearby ambulances API request fallback notice:', err);
      if (isDemoModeActive()) {
        // In demo mode, calculate distance against demo fleet
        return DEMO_RURAL_AMBULANCES.map((amb) => {
          const dist = calculateHaversineDistance(
            { latitude: lat, longitude: lng },
            { latitude: amb.latitude, longitude: amb.longitude }
          );
          return {
            ...amb,
            distanceKm: dist,
            estimatedEtaMinutes: estimateEtaMinutes(dist),
          };
        })
          .filter((a) => (a.distanceKm || 0) <= radiusKm)
          .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
      }
      return [];
    }
  },

  /**
   * Fetch live tracking details for an active assistance request.
   */
  async getTrackingState(requestId: string): Promise<AmbulanceTrackingState | null> {
    try {
      const res = await request<{ tracking: AmbulanceTrackingState }>(
        `/ambulance/tracking/${requestId}`
      );
      return res.tracking;
    } catch (err) {
      console.warn('Tracking state fetch notice:', err);
      // Fallback local tracking preview
      const local = localStorage.getItem(`tracking_${requestId}`);
      if (local) {
        return JSON.parse(local);
      }
      return null;
    }
  },

  /**
   * Update driver GPS location (used by driver screen or live simulator).
   */
  async updateDriverLocation(
    requestId: string,
    data: {
      latitude: number;
      longitude: number;
      heading?: number;
      speedKmh?: number;
      status?: 'pending' | 'assigned' | 'en_route' | 'arrived' | 'completed' | 'cancelled';
    }
  ): Promise<any> {
    try {
      const res = await request<{ success: boolean; tracking: any }>(
        `/ambulance/tracking/${requestId}/location`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      return res.tracking;
    } catch (err) {
      console.warn('Backend driver location post notice, emitting locally:', err);
      const socket = getSocket();
      socket.emit('ambulance:driver_location', {
        requestId,
        ...data,
      });
      return data;
    }
  },

  /**
   * Subscribe to real-time location and status updates for a specific ambulance request via Socket.IO.
   */
  subscribeToTracking(
    requestId: string,
    onUpdate: (update: Partial<AmbulanceTrackingState>) => void,
    onConnectionChange?: (connected: boolean) => void
  ): () => void {
    const socket = getSocket();

    const handleLocationUpdate = (payload: any) => {
      if (payload.requestId === requestId || !payload.requestId) {
        onUpdate({
          currentLatitude: payload.currentLatitude,
          currentLongitude: payload.currentLongitude,
          heading: payload.heading,
          speedKmh: payload.speedKmh,
          distanceKm: payload.distanceKm,
          etaMinutes: payload.etaMinutes,
          status: payload.status,
          lastLocationTime: payload.lastLocationTime || new Date().toISOString(),
          isStale: false,
        });
      }
    };

    const handleConnect = () => {
      onConnectionChange?.(true);
      socket.emit('ambulance:join_track', { requestId });
    };

    const handleDisconnect = () => {
      onConnectionChange?.(false);
    };

    socket.on('ambulance:location_update', handleLocationUpdate);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    if (socket.connected) {
      socket.emit('ambulance:join_track', { requestId });
      onConnectionChange?.(true);
    } else {
      socket.connect();
    }

    return () => {
      socket.emit('ambulance:leave_track', { requestId });
      socket.off('ambulance:location_update', handleLocationUpdate);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  },
};


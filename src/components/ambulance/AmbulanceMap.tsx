import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AmbulanceVehicle, AmbulanceTrackingState } from '../../types';
import { LatLng } from '../../services/geospatialService';
import { MapPin, Navigation, Compass, AlertCircle } from 'lucide-react';

interface AmbulanceMapProps {
  patientCoords: LatLng | null;
  nearbyAmbulances?: AmbulanceVehicle[];
  selectedAmbulanceId?: string | null;
  onSelectAmbulance?: (ambulance: AmbulanceVehicle) => void;
  trackingState?: AmbulanceTrackingState | null;
  isStale?: boolean;
  className?: string;
}

export const AmbulanceMap: React.FC<AmbulanceMapProps> = ({
  patientCoords,
  nearbyAmbulances = [],
  selectedAmbulanceId,
  onSelectAmbulance,
  trackingState,
  isStale = false,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const patientMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const ambulanceMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const trackingMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default center (Bilaspur / Mandla PHC cluster or patient coords)
    const initialLat = patientCoords?.latitude ?? 22.5992;
    const initialLng = patientCoords?.longitude ?? 80.3712;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        zoomControl: false,
      });

      // Add high-contrast, clean OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Add Zoom control in top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Patient Marker and 5 km radius circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (patientCoords) {
      const { latitude, longitude } = patientCoords;

      // Update or create Patient Marker
      const patientIcon = L.divIcon({
        className: 'custom-patient-marker',
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(13, 148, 136, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 28px; height: 28px; border-radius: 50%; background: #0f172a; border: 3px solid #14b8a6; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div style="position: absolute; bottom: -20px; white-space: nowrap; background: #0f172a; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; border: 1px solid #14b8a6; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
              Pickup Point
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      if (!patientMarkerRef.current) {
        patientMarkerRef.current = L.marker([latitude, longitude], { icon: patientIcon })
          .addTo(map)
          .bindPopup('<strong>Your Location</strong><br/>Pickup coordinates');
      } else {
        patientMarkerRef.current.setLatLng([latitude, longitude]);
      }

      // Update or create 5 km Search Circle
      if (!radiusCircleRef.current) {
        radiusCircleRef.current = L.circle([latitude, longitude], {
          radius: 5000, // 5 km
          color: '#0d9488',
          weight: 2,
          opacity: 0.8,
          fillColor: '#14b8a6',
          fillOpacity: 0.08,
          dashArray: '6, 8',
        }).addTo(map);
      } else {
        radiusCircleRef.current.setLatLng([latitude, longitude]);
      }

      // Smooth pan if map is not being tracked
      if (!trackingState?.currentLatitude) {
        map.setView([latitude, longitude], 13, { animate: true });
      }
    } else {
      if (patientMarkerRef.current) {
        patientMarkerRef.current.remove();
        patientMarkerRef.current = null;
      }
      if (radiusCircleRef.current) {
        radiusCircleRef.current.remove();
        radiusCircleRef.current = null;
      }
    }
  }, [patientCoords, trackingState?.currentLatitude]);

  // Update Nearby Ambulances Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentMarkers = ambulanceMarkersRef.current;
    const activeIds = new Set(nearbyAmbulances.map((a) => a.id));

    // Remove markers that are no longer in list
    for (const [id, marker] of currentMarkers.entries()) {
      if (!activeIds.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    }

    // Add or update markers
    nearbyAmbulances.forEach((amb) => {
      const isSelected = selectedAmbulanceId === amb.id;
      const markerColor = isSelected ? '#2563eb' : '#059669';
      const badgeBg = isSelected ? '#1d4ed8' : '#065f46';

      const ambIcon = L.divIcon({
        className: `custom-amb-marker-${amb.id}`,
        html: `
          <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: ${markerColor}; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3); transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'}; transition: transform 0.2s;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path>
                <path d="M15 18H9"></path>
                <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path>
                <circle cx="17" cy="18" r="2"></circle>
                <circle cx="7" cy="18" r="2"></circle>
              </svg>
            </div>
            <div style="position: absolute; top: -14px; background: ${badgeBg}; color: #ffffff; font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 4px; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
              ${amb.distanceKm ? `${amb.distanceKm.toFixed(1)} km` : amb.vehicleType}
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      if (currentMarkers.has(amb.id)) {
        const marker = currentMarkers.get(amb.id)!;
        marker.setLatLng([amb.latitude, amb.longitude]);
        marker.setIcon(ambIcon);
      } else {
        const marker = L.marker([amb.latitude, amb.longitude], { icon: ambIcon }).addTo(map);
        marker.on('click', () => {
          onSelectAmbulance?.(amb);
        });
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px;">
            <strong style="color: #0f172a;">${amb.serviceName}</strong><br/>
            <span style="color: #64748b;">Reg: ${amb.registrationNumber}</span><br/>
            <span style="color: #059669; font-weight: 600;">Driver: ${amb.driverName} (${amb.driverPhone})</span><br/>
            <span style="color: #2563eb; font-weight: 600;">Distance: ${amb.distanceKm?.toFixed(1) ?? '--'} km • ETA: ${amb.estimatedEtaMinutes ?? '--'} mins</span>
          </div>
        `);
        currentMarkers.set(amb.id, marker);
      }
    });
  }, [nearbyAmbulances, selectedAmbulanceId, onSelectAmbulance]);

  // Update Live Tracking Ambulance Marker & Route Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (
      trackingState &&
      typeof trackingState.currentLatitude === 'number' &&
      typeof trackingState.currentLongitude === 'number'
    ) {
      const ambLat = trackingState.currentLatitude;
      const ambLng = trackingState.currentLongitude;
      const heading = trackingState.heading ?? 0;
      const statusText =
        trackingState.status === 'en_route'
          ? 'En Route'
          : trackingState.status === 'arrived'
          ? 'Arrived'
          : 'Assigned';

      const trackingIcon = L.divIcon({
        className: 'custom-tracking-marker',
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(225, 29, 72, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 34px; height: 34px; border-radius: 50%; background: #e11d48; border: 3px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(225,29,72,0.4); transform: rotate(${heading}deg);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div style="position: absolute; bottom: -20px; white-space: nowrap; background: #e11d48; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.25); text-transform: uppercase;">
              ${statusText} ${trackingState.etaMinutes ? `(${trackingState.etaMinutes}m)` : ''}
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      if (!trackingMarkerRef.current) {
        trackingMarkerRef.current = L.marker([ambLat, ambLng], { icon: trackingIcon })
          .addTo(map)
          .bindPopup(`
            <strong>Live Ambulance Tracking</strong><br/>
            Vehicle: ${trackingState.vehicleNumber || 'Emergency Dispatch'}<br/>
            Driver: ${trackingState.driverName || 'Verified Medical Driver'}<br/>
            Speed: ${trackingState.speedKmh || 35} km/h • ETA: ${trackingState.etaMinutes || '--'} mins
          `);
      } else {
        trackingMarkerRef.current.setLatLng([ambLat, ambLng]);
        trackingMarkerRef.current.setIcon(trackingIcon);
      }

      // Connect polyline route if patient coordinates are available
      const patLat = patientCoords?.latitude ?? trackingState.patientLatitude;
      const patLng = patientCoords?.longitude ?? trackingState.patientLongitude;

      if (typeof patLat === 'number' && typeof patLng === 'number') {
        const routePoints: [number, number][] = [
          [ambLat, ambLng],
          [patLat, patLng],
        ];

        if (!routePolylineRef.current) {
          routePolylineRef.current = L.polyline(routePoints, {
            color: '#e11d48',
            weight: 4,
            opacity: 0.85,
            dashArray: '8, 8',
          }).addTo(map);
        } else {
          routePolylineRef.current.setLatLngs(routePoints);
        }

        // Fit bounds to show both ambulance and patient
        const bounds = L.latLngBounds([
          [ambLat, ambLng],
          [patLat, patLng],
        ]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } else {
        map.panTo([ambLat, ambLng]);
      }
    } else {
      if (trackingMarkerRef.current) {
        trackingMarkerRef.current.remove();
        trackingMarkerRef.current = null;
      }
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
        routePolylineRef.current = null;
      }
    }
  }, [trackingState, patientCoords]);

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    if (patientCoords) {
      mapInstanceRef.current.setView([patientCoords.latitude, patientCoords.longitude], 13, {
        animate: true,
      });
    } else if (trackingState?.currentLatitude && trackingState?.currentLongitude) {
      mapInstanceRef.current.setView(
        [trackingState.currentLatitude, trackingState.currentLongitude],
        14,
        { animate: true }
      );
    }
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 ${className}`}>
      {/* Leaflet Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[360px] z-0" />

      {/* Map Header Overlay with 5 km indicator */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2">
        <div className="bg-navy-950/90 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl border border-navy-800 shadow-md flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
          <span>5 km Verified Radius Boundary</span>
        </div>

        {patientCoords && (
          <div className="bg-white/95 backdrop-blur-md text-slate-800 text-[11px] font-medium px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-teal-600" />
            <span>
              {patientCoords.latitude.toFixed(4)}, {patientCoords.longitude.toFixed(4)}
            </span>
          </div>
        )}
      </div>

      {/* Stale GPS Signal Notice Overlay */}
      {isStale && (
        <div className="absolute top-14 left-3 right-3 sm:right-auto z-[1000] bg-amber-500/95 backdrop-blur-md text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-lg border border-amber-600 flex items-center gap-2 animate-bounce">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>GPS update delayed (&gt;60s). Showing last verified position.</span>
        </div>
      )}

      {/* Bottom Right Floating Controls */}
      <div className="absolute bottom-3 right-3 z-[1000] flex flex-col gap-2">
        <button
          type="button"
          onClick={handleRecenter}
          title="Recenter on My Location"
          className="h-10 w-10 bg-white hover:bg-slate-50 text-navy-900 rounded-xl shadow-md border border-slate-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        >
          <Navigation className="h-4 w-4 text-teal-600" />
        </button>
      </div>

      {/* Map Legend Overlay in bottom left */}
      <div className="absolute bottom-3 left-3 z-[1000] hidden sm:flex items-center gap-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-200 text-[10px] text-slate-700 shadow-sm">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-navy-900 border border-teal-400" />
          <span>Pickup</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded bg-emerald-600" />
          <span>Available Ambulance</span>
        </div>
        {trackingState && (
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-rose-600 animate-pulse" />
            <span>Live Dispatch</span>
          </div>
        )}
      </div>
    </div>
  );
};

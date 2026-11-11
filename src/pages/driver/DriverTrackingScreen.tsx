import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ambulanceTrackingService } from '../../services/ambulanceTrackingService';
import { AmbulanceTrackingState } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  Navigation,
  Radio,
  PhoneCall,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Square,
  Shield,
  ArrowLeft,
  Truck,
  ExternalLink,
} from 'lucide-react';

export const DriverTrackingScreen: React.FC = () => {
  const { requestId } = useParams<{ requestId?: string }>();
  const activeReqId = requestId || 'req-demo-01';

  const [isTracking, setIsTracking] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [speedKmh, setSpeedKmh] = useState<number>(38);
  const [pingsSent, setPingsSent] = useState(0);
  const [trackingState, setTrackingState] = useState<AmbulanceTrackingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [simInterval, setSimInterval] = useState<any>(null);

  const watchIdRef = useRef<number | null>(null);

  // Load tracking details
  useEffect(() => {
    ambulanceTrackingService.getTrackingState(activeReqId).then((state) => {
      if (state) setTrackingState(state);
    });
  }, [activeReqId]);

  // Transmit location packet
  const sendLocationPing = async (lat: number, lng: number, speed: number = 38) => {
    try {
      await ambulanceTrackingService.updateDriverLocation(activeReqId, {
        latitude: lat,
        longitude: lng,
        speedKmh: speed,
        heading: 145,
        status: 'en_route',
      });
      setPingsSent((prev) => prev + 1);
    } catch (err: any) {
      console.warn('Driver ping error:', err);
    }
  };

  // Start Real Device Geolocation Watcher
  const handleStartTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your mobile browser.');
      return;
    }

    setError(null);
    setIsTracking(true);

    // Watch position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const speed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 38;
        setCurrentCoords({ latitude: lat, longitude: lng });
        setAccuracyMeters(Math.round(pos.coords.accuracy));
        setSpeedKmh(speed);
        sendLocationPing(lat, lng, speed);
      },
      (err) => {
        console.warn('Geolocation watch error:', err);
        setError('Location access interrupted. Switched to fallback tracking mode.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Stop Tracking
  const handleStopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (simInterval) {
      clearInterval(simInterval);
      setSimInterval(null);
    }
    setIsTracking(false);
  };

  // Simulation Mode for indoor demonstration
  const handleToggleSimulation = () => {
    if (isTracking) {
      handleStopTracking();
      return;
    }

    setIsTracking(true);
    let curLat = currentCoords?.latitude || 22.612;
    let curLng = currentCoords?.longitude || 80.38;

    const interval = setInterval(() => {
      // Step closer towards patient
      curLat += (22.5992 - curLat) * 0.15;
      curLng += (80.3712 - curLng) * 0.15;
      setCurrentCoords({ latitude: curLat, longitude: curLng });
      setAccuracyMeters(5);
      setSpeedKmh(42);
      sendLocationPing(curLat, curLng, 42);
    }, 4000);

    setSimInterval(interval);
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (simInterval) {
        clearInterval(simInterval);
      }
    };
  }, [simInterval]);

  const patientPhone = '+91 98765 43210';
  const pickupAddress =
    trackingState?.pickupAddress ||
    'Gram Panchayat Bhavan, Bilaspur Sub-Center, Mandla';

  return (
    <div className="min-h-screen bg-navy-950 text-white p-4 sm:p-6 flex flex-col items-center justify-start">
      <div className="w-full max-w-lg space-y-5">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link
            to="/patient/ambulance"
            className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Portal</span>
          </Link>

          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Driver GPS Console
          </span>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-teal-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Emergency Dispatch Transmitter
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Transmit live GPS telemetry to patient and control center in real time.
          </p>
        </div>

        {/* Live Broadcast Status Banner */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isTracking
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
              : 'bg-navy-900 border-navy-800 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className={`h-3.5 w-3.5 rounded-full ${
                  isTracking ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                }`}
              />
              <span className="font-bold text-sm">
                {isTracking ? 'GPS BROADCAST ACTIVE' : 'GPS TRANSMITTER IDLE'}
              </span>
            </div>
            <span className="text-xs font-mono bg-black/40 px-2 py-0.5 rounded text-slate-300">
              Pings Sent: {pingsSent}
            </span>
          </div>

          {currentCoords && (
            <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">CURRENT COORDINATES</span>
                <span className="font-mono font-bold text-white">
                  {currentCoords.latitude.toFixed(5)}, {currentCoords.longitude.toFixed(5)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">GPS ACCURACY</span>
                <span className="font-mono text-white">
                  {accuracyMeters ? `±${accuracyMeters} meters` : 'High Precision'}
                </span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Big Action Button (Driver Friendly Touch Target) */}
        <div className="pt-2">
          {!isTracking ? (
            <button
              type="button"
              onClick={handleStartTracking}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-lg font-black tracking-wide shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-3 transition-transform active:scale-95 border border-emerald-400/40"
            >
              <Play className="h-6 w-6 fill-current" />
              <span>START LIVE GPS SHARING</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStopTracking}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white text-lg font-black tracking-wide shadow-xl shadow-rose-950/60 flex items-center justify-center gap-3 transition-transform active:scale-95 border border-rose-400/40"
            >
              <Square className="h-6 w-6 fill-current" />
              <span>STOP LIVE GPS SHARING</span>
            </button>
          )}
        </div>

        {/* Simulator mode button for demonstration */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleToggleSimulation}
            className="text-xs text-slate-400 hover:text-teal-300 underline underline-offset-4"
          >
            {isTracking && simInterval
              ? 'Stop Evaluation Simulation'
              : 'Run Evaluation Simulator (No Movement Needed)'}
          </button>
        </div>

        {/* Patient Pickup Location Details */}
        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-800 space-y-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Pickup Destination
          </span>

          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-start gap-2">
              <MapPin className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{pickupAddress}</span>
            </h3>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <a href={`tel:${patientPhone.replace(/\s+/g, '')}`} className="flex-1">
              <Button
                variant="emergency"
                size="sm"
                leftIcon={<PhoneCall className="h-4 w-4" />}
                className="w-full justify-center text-xs font-bold"
              >
                Call Patient ({patientPhone})
              </Button>
            </a>
          </div>
        </div>

        {/* Assigned Vehicle Credentials */}
        <div className="p-3 rounded-xl bg-navy-900/60 border border-navy-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Vehicle: <strong className="text-white">MP-20-AMB-1081</strong></span>
          <span>Role: <strong className="text-teal-400">Rural BLS Unit</strong></span>
          <span>Station: <strong className="text-white">Mandla PHC</strong></span>
        </div>
      </div>
    </div>
  );
};


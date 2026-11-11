import React from 'react';
import { Button } from '../common/Button';
import {
  PhoneCall,
  Navigation,
  FileText,
  AlertTriangle,
  ShieldAlert,
  MapPin,
} from 'lucide-react';

interface EmergencyQuickActionsProps {
  onTriggerLocation: () => void;
  onFocusForm: () => void;
  isLocating?: boolean;
  coordinates?: { latitude: number; longitude: number } | null;
}

export const EmergencyQuickActions: React.FC<EmergencyQuickActionsProps> = ({
  onTriggerLocation,
  onFocusForm,
  isLocating = false,
  coordinates,
}) => {
  return (
    <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-[#102A43] text-white rounded-2xl p-5 sm:p-6 border border-navy-800 shadow-xl relative overflow-hidden">
      {/* Background soft red/teal accents */}
      <div className="absolute right-0 top-0 w-72 h-72 rounded-full bg-emergency-600/10 blur-3xl pointer-events-none" />
      <div className="absolute left-1/3 bottom-0 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emergency-500/20 text-emergency-300 border border-emergency-500/30 text-[11px] font-semibold">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Direct Emergency Actions</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              Immediate Emergency Services
            </h3>
            <p className="text-xs text-slate-300 max-w-xl">
              For critical or life-threatening situations, dial the official toll-free numbers directly. For non-critical transport coordination, submit a request below.
            </p>
          </div>
        </div>

        {/* 4 Primary Action Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Action 1: Call 112 */}
          <a href="tel:112" className="block w-full">
            <Button
              variant="emergency"
              size="md"
              leftIcon={<PhoneCall className="h-4 w-4 animate-bounce" />}
              className="w-full justify-center shadow-lg shadow-rose-950/60 font-bold text-xs py-3"
            >
              Call 112 (National Emergency)
            </Button>
          </a>

          {/* Action 2: Call 108 */}
          <a href="tel:108" id="action-call-108" className="block w-full">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<PhoneCall className="h-4 w-4" />}
              className="w-full justify-center bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-3 shadow-md"
            >
              Call 108 (State Ambulance)
            </Button>
          </a>

          {/* Action 3: Share Location */}
          <button
            id="action-share-gps"
            type="button"
            onClick={onTriggerLocation}
            disabled={isLocating}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-teal-900/60 hover:bg-teal-800/80 text-teal-200 border border-teal-500/40 hover:border-teal-400 font-semibold text-xs py-3 px-4 transition-all duration-150 disabled:opacity-50 shadow-sm"
          >
            <Navigation className={`h-4 w-4 text-teal-400 ${isLocating ? 'animate-spin' : ''}`} />
            <span>
              {isLocating
                ? 'Detecting GPS...'
                : coordinates
                ? 'GPS Location Captured'
                : 'Share My Location'}
            </span>
          </button>

          {/* Action 4: Request Form */}
          <button
            type="button"
            onClick={onFocusForm}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-navy-800 hover:bg-navy-700 text-white border border-navy-600 hover:border-teal-400 font-semibold text-xs py-3 px-4 transition-all duration-150 shadow-sm"
          >
            <FileText className="h-4 w-4 text-teal-300" />
            <span>Request Assistance Form</span>
          </button>
        </div>

        {/* Captured Coordinates Pill if present */}
        {coordinates &&
          typeof coordinates.latitude === 'number' &&
          typeof coordinates.longitude === 'number' && (
          <div className="inline-flex items-center gap-2 bg-teal-950/60 border border-teal-500/40 px-3 py-1 rounded-full text-xs text-teal-300">
            <MapPin className="h-3.5 w-3.5 text-teal-400" />
            <span>
              Captured Coordinates: {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { PhoneCall, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '../common/Button';

export const EmergencyDispatchBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-emergency-900 to-navy-950 text-white rounded-2xl p-6 border border-emergency-800 shadow-xl relative overflow-hidden">
      {/* Decorative pulse ring */}
      <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 rounded-full bg-emergency-600/10 pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emergency-500/20 text-emergency-200 border border-emergency-500/30 text-xs font-semibold">
            <ShieldAlert className="h-4 w-4" />
            <span>National Emergency Medical Helpline (India)</span>
          </div>
          <h3 className="text-xl font-extrabold text-white tracking-tight">
            Need Immediate Emergency Medical Transport?
          </h3>
          <p className="text-xs text-rose-100/90 leading-relaxed">
            In life-threatening situations, dial the official emergency numbers immediately. Do not rely solely on asynchronous web requests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a href="tel:108">
            <Button
              variant="emergency"
              size="lg"
              leftIcon={<PhoneCall className="h-5 w-5 animate-bounce" />}
              className="text-sm font-bold shadow-lg shadow-rose-900/60"
            >
              Call 108 (Ambulance)
            </Button>
          </a>
          <a href="tel:112">
            <Button
              variant="outline"
              size="lg"
              className="bg-navy-900/80 text-white border-navy-700 hover:bg-navy-800 text-sm font-semibold"
            >
              Call 112 (National Emergency)
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};


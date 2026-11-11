import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Stethoscope, Building, ShieldCheck, Clock, Award, CheckCircle } from 'lucide-react';

export const DoctorProfile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl space-y-6">
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="h-16 w-16 rounded-2xl bg-teal-600 text-white font-bold flex items-center justify-center text-2xl shadow-md">
            🩺
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-navy-900">{user?.name || 'Dr. Meera Nambiar'}</h2>
              <Badge variant="verified" dot size="sm">
                Verified Medical Practitioner
              </Badge>
            </div>
            <p className="text-xs text-brandMuted font-medium mt-0.5">
              General Medicine & Rural Tele-Health • 12 Years Clinical Experience
            </p>
            <p className="text-[11px] text-teal-700 font-mono mt-1">
              State Medical Registration: MCI-IND-2014-98412
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Hospital Node
            </span>
            <p className="font-semibold text-slate-800">District Civil Hospital & Rural Tele-Care Center</p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Consultation Mode
            </span>
            <p className="font-semibold text-slate-800">Telemedicine Video & Sub-Center Tele-Consults</p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Languages
            </span>
            <p className="font-semibold text-slate-800">Hindi, English, Malayalam</p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Configured Availability
            </span>
            <p className="font-semibold text-teal-700">Daily 10:00 AM – 4:00 PM (IST)</p>
          </div>
        </div>

        <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100 flex items-start gap-3 text-xs text-slate-700 leading-relaxed">
          <CheckCircle className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
          <p>
            Doctor credentials and medical licenses are verified through the platform administrator console. Clinical notes and prescription entries issued by this account are digitally signed and cryptographically stored.
          </p>
        </div>
      </Card>
    </div>
  );
};


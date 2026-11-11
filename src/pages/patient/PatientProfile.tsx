import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { User, Mail, Calendar, ShieldCheck, Heart, MapPin, Phone } from 'lucide-react';

export const PatientProfile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl space-y-6">
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="h-16 w-16 rounded-2xl bg-teal-600 text-white font-bold flex items-center justify-center text-2xl shadow-md">
            {user?.name ? user.name[0].toUpperCase() : 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-navy-900">{user?.name || 'Asha Sharma'}</h2>
              <Badge variant="verified" size="sm">
                Verified Patient
              </Badge>
            </div>
            <p className="text-xs text-brandMuted">{user?.email || 'patient@demo.ruralcare.test'}</p>
            <p className="text-[11px] text-teal-700 mt-1 font-mono">
              Rural Tele-Health ID: RC-IN-882194
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Registered Sector
            </span>
            <p className="font-semibold text-slate-800">Gram Panchayat Bilaspur Subcenter</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Primary Language
            </span>
            <p className="font-semibold text-slate-800">Hindi / Regional Dialect</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Emergency Contact
            </span>
            <p className="font-semibold text-slate-800">+91 98765 43210 (Kin Contact)</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Account Created
            </span>
            <p className="font-semibold text-slate-800">
              {user ? new Date(user.createdAt).toLocaleDateString() : 'Active Member'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};


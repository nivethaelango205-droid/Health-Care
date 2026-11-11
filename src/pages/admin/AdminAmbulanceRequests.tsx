import React, { useState, useEffect } from 'react';
import { ambulanceService } from '../../services/ambulanceService';
import { AmbulanceRequest } from '../../types';
import { AmbulanceRequestCard } from '../../components/ambulance/AmbulanceRequestCard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { PhoneCall, ShieldAlert, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export const AdminAmbulanceRequests: React.FC = () => {
  const [requests, setRequests] = useState<AmbulanceRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'acknowledged' | 'closed'>('all');

  const loadRequests = async () => {
    try {
      const list = await ambulanceService.getRequests();
      setRequests(list);
    } catch (err) {
      console.error('Failed to load ambulance requests:', err);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'acknowledged' | 'closed') => {
    try {
      await ambulanceService.updateStatus(id, status);
      await loadRequests();
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const filtered = requests.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-navy-900 tracking-tight">
              Internal Ambulance Assistance Requests
            </h2>
            <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              Administrator Review
            </span>
          </div>
          <p className="text-xs text-brandMuted mt-0.5">
            Review stored transport assistance requests, acknowledge receipt, and close resolved entries. These actions do not dispatch an ambulance.
          </p>
        </div>

        {/* National Emergency Hotline badge */}
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3 py-1.5 rounded-xl font-bold">
          <PhoneCall className="h-4 w-4 text-rose-600 animate-pulse" />
          <span>Emergency contacts: 108 / 112</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
        {(['all', 'submitted', 'acknowledged', 'closed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold capitalize whitespace-nowrap min-h-[40px] transition-colors ${
              filter === tab
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab}
            {tab !== 'all' && (
              <span className="ml-1.5 opacity-80">
                ({requests.filter((r) => r.status === tab).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((req) => (
          <AmbulanceRequestCard
            key={req.id}
            request={req}
            userRole="admin"
            onUpdateStatus={handleUpdateStatus}
          />
        ))}
      </div>
    </div>
  );
};

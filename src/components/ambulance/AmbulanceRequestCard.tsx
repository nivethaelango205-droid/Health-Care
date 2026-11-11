import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { AmbulanceRequest, UserRole } from '../../types';
import { MapPin, Phone, Clock, AlertTriangle, CheckCircle, Navigation } from 'lucide-react';

interface AmbulanceRequestCardProps {
  request: AmbulanceRequest;
  userRole?: UserRole | null;
  onUpdateStatus?: (id: string, status: 'acknowledged' | 'closed') => void;
  onTrackLive?: (request: AmbulanceRequest) => void;
}

export const AmbulanceRequestCard: React.FC<AmbulanceRequestCardProps> = ({
  request,
  userRole,
  onUpdateStatus,
  onTrackLive,
}) => {
  let formattedTime = 'Recently';
  try {
    const date = new Date(request?.createdAt || Date.now());
    if (!isNaN(date.getTime())) {
      formattedTime = date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    }
  } catch {
    formattedTime = String(request?.createdAt || 'Recently');
  }

  const statusDescriptions: Record<string, string> = {
    submitted: 'Internal assistance request stored. Awaiting administrator review.',
    acknowledged: 'An administrator acknowledged this internal assistance request. Vehicle dispatch is not confirmed.',
    closed: 'Assistance coordination completed or resolved.',
  };

  return (
    <Card hover className="space-y-4">
      <div className="flex items-start justify-between border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-navy-900 bg-slate-100 px-2.5 py-0.5 rounded">
              {request.id}
            </span>
            <Badge variant={request.status} dot size="sm" />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>{formattedTime}</span>
          </div>
        </div>

        {request.status === 'submitted' && (
          <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-semibold border border-rose-200 animate-pulse">
            Awaiting Desk Review
          </span>
        )}
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Pickup Location
            </span>
            <p className="font-medium text-slate-800">{request.pickupAddress}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Phone className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Patient Contact Number
            </span>
            <p className="font-medium text-slate-800 font-mono">{request.contactNumber}</p>
          </div>
        </div>

        {request.coordinates &&
          typeof request.coordinates.latitude === 'number' &&
          typeof request.coordinates.longitude === 'number' && (
          <div className="flex items-center gap-1.5 text-[11px] text-teal-700 bg-teal-50/70 p-2 rounded border border-teal-100">
            <Navigation className="h-3.5 w-3.5" />
            <span>
              GPS Coordinates: {request.coordinates.latitude.toFixed(4)},{' '}
              {request.coordinates.longitude.toFixed(4)}
            </span>
          </div>
        )}
      </div>

      {/* Truthful status note */}
      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p>{statusDescriptions[request.status] || 'Internal assistance request status logged.'}</p>
          <p className="text-[10px] text-slate-500 font-medium">
            Internal telemedicine transport assistance log only. In life-threatening emergencies, always dial 108 or 112 directly.
          </p>
        </div>
      </div>

      {/* Patient Live Track Action */}
      {onTrackLive && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <span className="text-[11px] text-teal-700 font-medium">
            Real-time ambulance telemetry available
          </span>
          <Button
            type="button"
            variant="emergency"
            size="sm"
            onClick={() => onTrackLive(request)}
            leftIcon={<Navigation className="h-3.5 w-3.5" />}
            className="text-xs font-bold shadow-sm"
          >
            Track Live GPS
          </Button>
        </div>
      )}

      {/* Admin Actions */}
      {userRole === 'admin' && onUpdateStatus && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
          {request.status === 'submitted' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateStatus(request.id, 'acknowledged')}
              className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
            >
              Acknowledge Request
            </Button>
          )}
          {request.status !== 'closed' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onUpdateStatus(request.id, 'closed')}
              className="text-xs"
            >
              Mark Closed / Resolved
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

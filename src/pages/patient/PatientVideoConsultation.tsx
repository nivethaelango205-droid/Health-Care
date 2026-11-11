import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { VideoRoom } from '../../components/consultations/VideoRoom';
import { appointmentService } from '../../services/appointmentService';
import { consultationService } from '../../services/consultationService';
import { Appointment } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { ShieldCheck, Video, Info, User, Calendar, Clock } from 'lucide-react';

export const PatientVideoConsultation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [realConsultationId, setRealConsultationId] = useState<string>('');
  const [sessionError, setSessionError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setRealConsultationId('');
    setSessionError(null);
    const fetchAppt = async () => {
      try {
        const appts = await appointmentService.getAppointments();
        if (cancelled) return;
        let target: Appointment | null = null;
        if (appointmentId) {
          target = appts.find((a) => a.id === appointmentId) || null;
        } else {
          target = appts.find((a) => a.status === 'confirmed' && a.mode === 'video') || null;
        }
        setAppointment(target);

        if (!target || target.status !== 'confirmed' || target.mode !== 'video') {
          throw new Error('Select a confirmed video appointment to join this consultation.');
        }
        const c = await consultationService.createOrGetConsultation(target.id);
        if (cancelled) return;
        setRealConsultationId(c.id);
      } catch (err: any) {
        if (cancelled) return;
        console.error('Failed to resolve appointment:', err);
        setSessionError(err.message || 'Could not resolve the video consultation.');
      }
    };
    fetchAppt();
    return () => { cancelled = true; };
  }, [appointmentId]);

  return (
    <div className="space-y-6">
      {sessionError && (
        <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {sessionError}
        </div>
      )}
      {/* Telemedicine Video Room */}
      <VideoRoom
        consultationId={realConsultationId || 'consultation-active'}
        appointmentNumber={appointment?.number || 'RC360-DEL-8941'}
        participantName={appointment?.doctorName || 'Dr. Meera Nambiar'}
        userRole="patient"
        onLeave={() => navigate('/patient/dashboard')}
      />

      {/* Consultation Info and Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider">
            <User className="h-4 w-4" />
            <span>Consulting Doctor</span>
          </div>
          <p className="text-sm font-bold text-navy-900">
            {appointment?.doctorName || 'Dr. Meera Nambiar'}
          </p>
          <p className="text-xs text-brandMuted">
            General Medicine & Rural Tele-Health specialist
          </p>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider">
            <Calendar className="h-4 w-4" />
            <span>Appointment Reference</span>
          </div>
          <p className="font-mono text-sm font-bold text-navy-900">
            {appointment?.number || 'RC360-DEL-8941'}
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="confirmed" dot size="sm" />
            <span className="text-[11px] text-slate-500">Video Consultation Mode</span>
          </div>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" />
            <span>Security & Privacy</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            This tele-session uses peer WebRTC video encryption. Doctor notes entered during call are saved to your permanent record.
          </p>
        </Card>
      </div>
    </div>
  );
};

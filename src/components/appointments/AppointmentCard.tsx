import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Appointment, UserRole } from '../../types';
import { Calendar, Clock, Video, FileText, CheckCircle2, XCircle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AppointmentCardProps {
  appointment: Appointment;
  userRole: UserRole | null;
  onOpenLetter: (appointment: Appointment) => void;
  onUpdateStatus?: (id: string, status: 'confirmed' | 'cancelled') => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  userRole,
  onOpenLetter,
  onUpdateStatus,
}) => {
  const start = new Date(appointment.startsAt);
  const formattedDate = start.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = start.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    timeStyle: 'short',
  });

  const isConfirmed = appointment.status === 'confirmed';
  const isPending = appointment.status === 'pending';
  const isVideo = appointment.mode === 'video';

  return (
    <Card hover className="flex flex-col justify-between">
      <div>
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-semibold">
            {appointment.number}
          </span>
          <div className="flex items-center gap-1.5">
            <Badge variant={appointment.mode} size="sm" />
            <Badge variant={appointment.status} dot size="sm" />
          </div>
        </div>

        {/* Primary Contact Name */}
        <div className="mb-3">
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            {userRole === 'doctor' ? 'Patient' : 'Doctor'}
          </p>
          <h4 className="text-base font-bold text-navy-900">
            {userRole === 'doctor' ? appointment.patientName : appointment.doctorName}
          </h4>
        </div>

        {/* Schedule */}
        <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-teal-600 shrink-0" />
            <span className="font-medium text-slate-700">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-teal-600 shrink-0" />
            <span className="text-slate-600">{formattedTime} (IST)</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 justify-between">
        {/* Confirmed actions */}
        {isConfirmed ? (
          <>
            <Button
              id="action-download-letter"
              variant="outline"
              size="sm"
              leftIcon={<FileText className="h-3.5 w-3.5" />}
              onClick={() => onOpenLetter(appointment)}
              className="text-xs"
            >
              Letter
            </Button>

            {isVideo && (
              <Link
                id="action-join-consultation"
                to={
                  userRole === 'doctor'
                    ? `/doctor/consultations?appointmentId=${appointment.id}`
                    : `/patient/consultations?appointmentId=${appointment.id}`
                }
              >
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Video className="h-3.5 w-3.5" />}
                  className="text-xs"
                >
                  Join Video
                </Button>
              </Link>
            )}
          </>
        ) : null}

        {/* Doctor pending approval controls */}
        {userRole === 'doctor' && isPending && onUpdateStatus ? (
          <div className="flex items-center gap-2 w-full justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-rose-600 hover:bg-rose-50 text-xs"
              onClick={() => onUpdateStatus(appointment.id, 'cancelled')}
            >
              Decline
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="text-xs"
              leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
              onClick={() => onUpdateStatus(appointment.id, 'confirmed')}
            >
              Confirm Appointment
            </Button>
          </div>
        ) : null}

        {/* Patient pending view */}
        {userRole === 'patient' && isPending ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-amber-700 font-medium">Awaiting Doctor Review</span>
            {onUpdateStatus && (
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-600 hover:bg-rose-50 text-xs"
                onClick={() => onUpdateStatus(appointment.id, 'cancelled')}
              >
                Cancel
              </Button>
            )}
          </div>
        ) : null}

        {/* Completed state */}
        {appointment.status === 'completed' && (
          <div className="flex items-center justify-between w-full text-xs text-slate-500">
            <span>Consultation Completed</span>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<FileText className="h-3.5 w-3.5" />}
              onClick={() => onOpenLetter(appointment)}
              className="text-xs"
            >
              View Record
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};


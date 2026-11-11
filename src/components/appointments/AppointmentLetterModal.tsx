import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Appointment } from '../../types';
import { appointmentService } from '../../services/appointmentService';
import { Download, Printer, ShieldCheck, HeartPulse, Calendar, Clock, Video, FileText } from 'lucide-react';

interface AppointmentLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

export const AppointmentLetterModal: React.FC<AppointmentLetterModalProps> = ({
  isOpen,
  onClose,
  appointment,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!appointment) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await appointmentService.downloadAppointmentLetter(appointment.id, appointment.number);
    } catch (err) {
      console.error('Error downloading letter:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const isConfirmed = appointment.status === 'confirmed';
  const start = new Date(appointment.startsAt);
  const formattedDate = start.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
  });
  const formattedTime = start.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    timeStyle: 'short',
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Appointment Confirmation Letter"
      subtitle={`Official Documentation • Reference ${appointment.number}`}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Letter Preview Canvas */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 relative overflow-hidden shadow-inner">
          {/* Subtle watermark */}
          <div className="absolute right-4 top-10 opacity-5 pointer-events-none">
            <HeartPulse className="h-44 w-44 text-navy-900" />
          </div>

          {/* Letterhead */}
          <div className="flex items-center justify-between border-b-2 border-teal-600 pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy-900 tracking-tight">RuralCare 360</h3>
                <p className="text-[10px] text-teal-700 font-semibold uppercase tracking-wider">
                  Telemedicine Access Platform
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={appointment.status} dot size="md" />
              <p className="text-[11px] text-slate-500 mt-1 font-mono">{appointment.number}</p>
            </div>
          </div>

          {/* Formal Letter Content */}
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 font-medium">
              This official document confirms the telemedicine appointment schedule for rural health access under the RuralCare 360 platform.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-slate-200">
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">
                  Patient Name
                </span>
                <span className="text-sm font-bold text-navy-900">{appointment.patientName}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">
                  Assigned Doctor
                </span>
                <span className="text-sm font-bold text-teal-800">{appointment.doctorName}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">
                  Scheduled Date
                </span>
                <span className="text-xs font-semibold text-slate-800">{formattedDate}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">
                  Scheduled Time
                </span>
                <span className="text-xs font-semibold text-slate-800">{formattedTime} (IST)</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">
                  Consultation Mode
                </span>
                <span className="text-xs font-semibold text-teal-700 capitalize">
                  {appointment.mode === 'video' ? 'Secure Video Tele-Consultation' : 'In-Person Consultation'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">
                  Confirmation Status
                </span>
                <span className="text-xs font-bold text-emerald-700 uppercase">
                  {appointment.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Advisory Instructions */}
            <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-100 text-[11px] text-slate-700 space-y-1">
              <p className="font-semibold text-teal-900 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                Telemedicine Consultation Guidelines:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                <li>Join 5 minutes before scheduled time through the RuralCare 360 portal.</li>
                <li>Ensure device camera and microphone permissions are enabled.</li>
                <li>Digital health record will be updated by doctor upon session completion.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-500">
            {isConfirmed
              ? 'Official confirmation letter ready for download.'
              : 'Download is only available once the appointment is Confirmed.'}
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="ghost" size="sm" onClick={onClose} className="flex-1 sm:flex-none">
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Download className="h-4 w-4" />}
              disabled={!isConfirmed}
              isLoading={isDownloading}
              onClick={handleDownload}
              className="flex-1 sm:flex-none"
            >
              Download Appointment Letter
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};


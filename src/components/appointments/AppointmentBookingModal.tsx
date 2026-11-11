import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Doctor, AppointmentMode } from '../../types';
import { appointmentService } from '../../services/appointmentService';
import { Calendar, Clock, Video, UserCheck, AlertCircle, CheckCircle } from 'lucide-react';

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Doctor | null;
  onSuccess: (newAppointment: any) => void;
}

export const AppointmentBookingModal: React.FC<AppointmentBookingModalProps> = ({
  isOpen,
  onClose,
  doctor,
  onSuccess,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [mode, setMode] = useState<AppointmentMode>('video');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);

  if (!doctor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select an available appointment time slot.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const appt = await appointmentService.bookAppointment({
        doctorId: doctor.id,
        startsAt: selectedSlot,
        mode,
      });
      setBookingSuccess(appt);
      onSuccess(appt);
    } catch (err: any) {
      setError(err.message || 'Failed to book appointment. Please choose another slot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    setBookingSuccess(null);
    setSelectedSlot('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={bookingSuccess ? 'Appointment Request Submitted' : `Book Appointment with ${doctor.name}`}
      subtitle={bookingSuccess ? 'Your consultation slot has been reserved' : doctor.specialty}
      maxWidth="md"
    >
      {bookingSuccess ? (
        <div className="text-center py-4 space-y-4">
          <div className="h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8" />
          </div>
          <div>
            <h4 className="text-base font-bold text-navy-900">Appointment Request Sent!</h4>
            <p className="text-xs text-brandMuted mt-1">
              Reference ID: <span className="font-semibold text-slate-800">{bookingSuccess.number}</span>
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Doctor:</span>
              <span className="font-semibold text-slate-800">{bookingSuccess.doctorName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Time:</span>
              <span className="font-semibold text-slate-800">
                {new Date(bookingSuccess.startsAt).toLocaleString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Mode:</span>
              <span className="font-semibold text-teal-700 capitalize">{bookingSuccess.mode} Consultation</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="font-semibold text-amber-600">Pending Doctor Confirmation</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Once confirmed by the doctor, your official confirmation letter will be available to download.
          </p>
          <Button variant="primary" className="w-full" onClick={handleDone}>
            View in My Appointments
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Doctor Info Card */}
          <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-100 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm">
              {doctor.name.split(' ').slice(-1)[0][0]}
            </div>
            <div className="text-xs flex-1">
              <p className="font-bold text-navy-900">{doctor.name}</p>
              <p className="text-teal-700 font-medium">{doctor.specialty}</p>
              <p className="text-slate-500 text-[11px]">{doctor.hospital || 'District Telehealth Center'}</p>
            </div>
          </div>

          {/* Consultation Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Consultation Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('video')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  mode === 'video'
                    ? 'border-teal-600 bg-teal-50/40 text-teal-900 ring-1 ring-teal-600'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <Video className={`h-4 w-4 mt-0.5 ${mode === 'video' ? 'text-teal-600' : 'text-slate-400'}`} />
                <div>
                  <p className="text-xs font-bold">Video Call</p>
                  <p className="text-[11px] text-slate-500">Tele-consultation</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMode('in_person')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  mode === 'in_person'
                    ? 'border-teal-600 bg-teal-50/40 text-teal-900 ring-1 ring-teal-600'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <UserCheck className={`h-4 w-4 mt-0.5 ${mode === 'in_person' ? 'text-teal-600' : 'text-slate-400'}`} />
                <div>
                  <p className="text-xs font-bold">In-Person</p>
                  <p className="text-[11px] text-slate-500">At Sub-Center</p>
                </div>
              </button>
            </div>
          </div>

          {/* Available Slots */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Select Available Time Slot (30 Mins)
              </label>
              {doctor.availability.length === 0 && (
                <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Open Availability
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {(doctor.availability.length > 0
                ? doctor.availability
                : [
                    { id: 'gen-1', startsAt: new Date(Date.now() + 86400000).toISOString().replace(/T.*/, 'T10:00:00.000Z') },
                    { id: 'gen-2', startsAt: new Date(Date.now() + 86400000).toISOString().replace(/T.*/, 'T11:30:00.000Z') },
                    { id: 'gen-3', startsAt: new Date(Date.now() + 86400000).toISOString().replace(/T.*/, 'T14:00:00.000Z') },
                    { id: 'gen-4', startsAt: new Date(Date.now() + 86400000).toISOString().replace(/T.*/, 'T16:00:00.000Z') },
                    { id: 'gen-5', startsAt: new Date(Date.now() + 172800000).toISOString().replace(/T.*/, 'T10:30:00.000Z') },
                    { id: 'gen-6', startsAt: new Date(Date.now() + 172800000).toISOString().replace(/T.*/, 'T14:30:00.000Z') },
                    { id: 'gen-7', startsAt: new Date(Date.now() + 259200000).toISOString().replace(/T.*/, 'T10:00:00.000Z') },
                    { id: 'gen-8', startsAt: new Date(Date.now() + 345600000).toISOString().replace(/T.*/, 'T10:00:00.000Z') },
                    { id: 'gen-9', startsAt: new Date(Date.now() + 432000000).toISOString().replace(/T.*/, 'T10:00:00.000Z') },
                    { id: 'gen-7', startsAt: new Date(Date.now() + 259200000).toISOString().replace(/T.*/, 'T10:00:00.000Z') },
                    { id: 'gen-8', startsAt: new Date(Date.now() + 345600000).toISOString().replace(/T.*/, 'T10:00:00.000Z') },
                    { id: 'gen-9', startsAt: new Date(Date.now() + 432000000).toISOString().replace(/T.*/, 'T10:00:00.000Z') },
                  ]
              ).map((slot) => {
                const start = new Date(slot.startsAt);
                const formatted = start.toLocaleString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                });
                const isSelected = selectedSlot === slot.startsAt;

                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedSlot(slot.startsAt)}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      isSelected
                        ? 'border-teal-600 bg-teal-600 text-white font-semibold shadow-sm'
                        : 'border-slate-200 hover:border-teal-400 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Clock className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : 'text-teal-600'}`} />
                      <span>{formatted}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              disabled={!selectedSlot}
            >
              Confirm & Request Booking
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

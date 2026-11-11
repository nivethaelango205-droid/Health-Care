import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentService } from '../../services/appointmentService';
import { Appointment, AppointmentStatus } from '../../types';
import { AppointmentCard } from '../../components/appointments/AppointmentCard';
import { AppointmentLetterModal } from '../../components/appointments/AppointmentLetterModal';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Calendar, Plus, Clock, CheckCircle } from 'lucide-react';

export const PatientAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending' | 'completed'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLetterAppt, setSelectedLetterAppt] = useState<Appointment | null>(null);

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const list = await appointmentService.getAppointments();
      setAppointments(list);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    try {
      await appointmentService.updateStatus(id, status);
      await loadAppointments();
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const filtered = appointments.filter((a) => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-900 tracking-tight">Consultation Appointments</h2>
          <p className="text-xs text-brandMuted">
            Review status of requested consultations and access confirmed appointment letters.
          </p>
        </div>

        <Link to="/patient/doctors">
          <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
            New Appointment Request
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
        {(['all', 'confirmed', 'pending', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold capitalize whitespace-nowrap min-h-[40px] transition-colors ${
              filter === tab
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-navy-900'
            }`}
          >
            {tab}
            {tab !== 'all' && (
              <span className="ml-1.5 opacity-80">
                ({appointments.filter((a) => a.status === tab).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Appointment Cards Grid */}
      {isLoading ? (
        <LoadingSkeleton type="card" rows={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-7 w-7 text-teal-600" />}
          title={`No ${filter === 'all' ? '' : filter} appointments found`}
          description="You can browse verified doctors and book your next telemedicine slot anytime."
          actionText="Find a Doctor Now"
          onAction={() => (window.location.href = '/patient/doctors')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              userRole="patient"
              onOpenLetter={(a) => setSelectedLetterAppt(a)}
              onUpdateStatus={handleUpdateStatus}
            />
          ))}
        </div>
      )}

      {/* Letter Modal */}
      <AppointmentLetterModal
        isOpen={!!selectedLetterAppt}
        onClose={() => setSelectedLetterAppt(null)}
        appointment={selectedLetterAppt}
      />
    </div>
  );
};


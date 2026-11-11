import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { recordService } from '../../services/recordService';
import { Appointment, HealthRecord } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { AppointmentLetterModal } from '../../components/appointments/AppointmentLetterModal';
import {
  Calendar,
  Video,
  FileText,
  Search,
  Clock,
  PhoneCall,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  HeartPulse,
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLetterAppt, setSelectedLetterAppt] = useState<Appointment | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appts, recs] = await Promise.all([
          appointmentService.getAppointments(),
          recordService.getRecords(),
        ]);
        setAppointments(appts);
        setRecords(recs);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Find next upcoming appointment
  const nextAppt = appointments.find((a) => a.status === 'confirmed' || a.status === 'pending');

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-800 text-white rounded-2xl p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6 border border-navy-700/80">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs text-teal-400 font-semibold uppercase tracking-wider">
            <HeartPulse className="h-4 w-4" />
            <span>Patient Telehealth Hub</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Namaste, {user?.name || 'Asha'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Welcome to your RuralCare 360 healthcare dashboard. Access remote doctor consultations, review encrypted medical records, or coordinate emergency transport.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/patient/doctors" id="action-find-doctors">
            <Button variant="primary" size="md" leftIcon={<Search className="h-4 w-4" />}>
              Find a Doctor
            </Button>
          </Link>
          <Link to="/patient/ambulance" id="action-emergency-108">
            <Button
              variant="emergency"
              size="md"
              leftIcon={<PhoneCall className="h-4 w-4" />}
            >
              Emergency 108
            </Button>
          </Link>
        </div>
      </div>

      {/* Next Appointment Card (Highlight) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-navy-900">Next Scheduled Consultation</h3>
          <Link to="/patient/appointments" className="text-xs font-semibold text-teal-700 hover:underline">
            View All ({appointments.length})
          </Link>
        </div>

        {nextAppt ? (
          <Card hover borderVariant="teal" className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 shadow-md">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {nextAppt.number}
                    </span>
                    <Badge variant={nextAppt.status} dot size="sm" />
                    <Badge variant={nextAppt.mode} size="sm" />
                  </div>
                  <h4 className="text-lg font-bold text-navy-900">{nextAppt.doctorName}</h4>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar className="h-4 w-4 text-teal-600" />
                      <span>
                        {new Date(nextAppt.startsAt).toLocaleDateString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          dateStyle: 'full',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="h-4 w-4 text-teal-600" />
                      <span>
                        {new Date(nextAppt.startsAt).toLocaleTimeString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          timeStyle: 'short',
                        })}{' '}
                        (IST)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Next Appointment */}
              <div className="flex flex-wrap items-center gap-3">
                {nextAppt.status === 'confirmed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<FileText className="h-4 w-4" />}
                    onClick={() => setSelectedLetterAppt(nextAppt)}
                  >
                    Appointment Letter
                  </Button>
                )}

                {nextAppt.status === 'confirmed' && nextAppt.mode === 'video' && (
                  <Link to={`/patient/consultations?appointmentId=${nextAppt.id}`}>
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Video className="h-4 w-4" />}
                      className="shadow-sm shadow-teal-700/20"
                    >
                      Join Video Call
                    </Button>
                  </Link>
                )}

                {nextAppt.status === 'pending' && (
                  <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 font-medium">
                    Awaiting Doctor Confirmation
                  </span>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <Card className="text-center py-8 space-y-3">
            <div className="h-12 w-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-navy-900">No Upcoming Appointments</p>
              <p className="text-xs text-brandMuted mt-0.5">
                Consult with verified medical doctors without travelling miles to the city.
              </p>
            </div>
            <Link to="/patient/doctors">
              <Button variant="primary" size="sm" className="mt-2">
                Find a Doctor & Book Slot
              </Button>
            </Link>
          </Card>
        )}
      </section>

      {/* Quick Actions Grid */}
      <section>
        <h3 className="text-base font-bold text-navy-900 mb-3">Quick Healthcare Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/patient/doctors" className="group">
            <Card hover className="h-full p-4 flex flex-col justify-between">
              <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-navy-900">Find Doctor</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Specialists & availability</p>
              </div>
            </Card>
          </Link>

          <Link to="/patient/doctors" className="group">
            <Card hover className="h-full p-4 flex flex-col justify-between">
              <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-navy-900">Book Appointment</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Reserve 30-min slot</p>
              </div>
            </Card>
          </Link>

          <Link to="/patient/consultations" className="group">
            <Card hover className="h-full p-4 flex flex-col justify-between">
              <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Video className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-navy-900">Join Consultation</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Encrypted video room</p>
              </div>
            </Card>
          </Link>

          <Link to="/patient/records" className="group">
            <Card hover className="h-full p-4 flex flex-col justify-between">
              <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-navy-900">View Health Records</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Clinical notes & Rx</p>
              </div>
            </Card>
          </Link>
        </div>
      </section>

      {/* Two-Column Overview: Upcoming Appointments & Recent Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Consultations */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-navy-900">Consultation Schedules</h3>
            <Link to="/patient/appointments" className="text-xs text-teal-700 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {appointments.slice(0, 3).map((appt) => (
              <Card key={appt.id} padded={false} className="p-4 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-navy-900 truncate">
                        {appt.doctorName}
                      </span>
                      <Badge variant={appt.status} dot size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>
                        {new Date(appt.startsAt).toLocaleDateString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        at{' '}
                        {new Date(appt.startsAt).toLocaleTimeString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          timeStyle: 'short',
                        })}
                      </span>
                    </p>
                  </div>

                  {appt.status === 'confirmed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLetterAppt(appt)}
                      className="text-xs shrink-0"
                    >
                      Letter
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Health Records */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-navy-900">Recent Medical Records</h3>
            <Link to="/patient/records" className="text-xs text-teal-700 hover:underline">
              View All ({records.length})
            </Link>
          </div>

          <div className="space-y-3">
            {records.slice(0, 2).map((rec) => (
              <Card key={rec.id} padded={false} className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-navy-900">
                    {new Date(rec.consultationDate).toLocaleDateString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      dateStyle: 'medium',
                    })}
                  </span>
                  <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Encrypted
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  <span className="font-semibold text-slate-700">Notes:</span> {rec.clinicalNotes}
                </p>
                <div className="pt-1 flex items-center justify-between text-[11px] text-teal-700">
                  <span className="font-medium">Prescription on File</span>
                  <Link to="/patient/records" className="hover:underline flex items-center gap-0.5">
                    <span>Full Details</span>
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {/* Appointment Letter Modal Trigger */}
      <AppointmentLetterModal
        isOpen={!!selectedLetterAppt}
        onClose={() => setSelectedLetterAppt(null)}
        appointment={selectedLetterAppt}
      />
    </div>
  );
};


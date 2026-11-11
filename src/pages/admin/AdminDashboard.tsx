import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doctorService } from '../../services/doctorService';
import { appointmentService } from '../../services/appointmentService';
import { ambulanceService } from '../../services/ambulanceService';
import { Doctor, Appointment, AmbulanceRequest } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  Users,
  UserCheck,
  Calendar,
  PhoneCall,
  Activity,
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
  Clock,
  Server,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [ambulanceRequests, setAmbulanceRequests] = useState<AmbulanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [docs, appts, ambs] = await Promise.all([
          doctorService.getDoctors(),
          appointmentService.getAppointments(),
          ambulanceService.getRequests(),
        ]);
        setDoctors(docs);
        setAppointments(appts);
        setAmbulanceRequests(ambs);
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const pendingAmbulance = ambulanceRequests.filter((a) => a.status === 'submitted');
  const verifiedDoctors = doctors.filter((d) => d.verified);

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-navy-950 text-white rounded-2xl p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6 border border-navy-800">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-semibold uppercase tracking-wider">
            <Activity className="h-4 w-4" />
            <span>Platform Operations Hub</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Administrative Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Monitor real-time telemedicine appointments, verify practicing doctors, and coordinate incoming rural emergency assistance requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/ambulance">
            <Button
              variant="emergency"
              size="md"
              leftIcon={<PhoneCall className="h-4 w-4" />}
            >
              Emergency Desk ({pendingAmbulance.length})
            </Button>
          </Link>
          <Link to="/admin/doctors">
            <Button variant="outline" size="md" className="bg-navy-900 text-white border-navy-700">
              Verify Doctors
            </Button>
          </Link>
        </div>
      </div>

      {/* Operational Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900">{verifiedDoctors.length}</p>
            <p className="text-xs text-brandMuted font-medium">Verified Doctors</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900">{appointments.length}</p>
            <p className="text-xs text-brandMuted font-medium">Total Consultations</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <PhoneCall className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-rose-600">{pendingAmbulance.length}</p>
            <p className="text-xs text-brandMuted font-medium">Awaiting Dispatch Review</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Server className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900">Active</p>
            <p className="text-xs text-brandMuted font-medium">System Tele-Nodes</p>
          </div>
        </Card>
      </div>

      {/* Two-Column Tables: Ambulance Queue & Recent Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ambulance Requests Queue */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              Incoming Ambulance Assistance Requests
            </h3>
            <Link to="/admin/ambulance" className="text-xs text-teal-700 hover:underline">
              Manage Queue
            </Link>
          </div>

          <div className="space-y-3">
            {ambulanceRequests.slice(0, 3).map((req) => (
              <Card key={req.id} padded={false} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-navy-900">{req.id}</span>
                  <Badge variant={req.status} dot size="sm" />
                </div>
                <p className="text-xs text-slate-700 font-medium truncate">
                  📍 {req.pickupAddress}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>Contact: {req.contactNumber}</span>
                  <span>{new Date(req.createdAt).toLocaleTimeString()}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Platform Appointments */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-navy-900">
              Recent Consultations
            </h3>
            <Link to="/admin/appointments" className="text-xs text-teal-700 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {appointments.slice(0, 3).map((appt) => (
              <Card key={appt.id} padded={false} className="p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {appt.number}
                  </span>
                  <Badge variant={appt.status} dot size="sm" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-navy-900">
                    {appt.patientName} ↔ {appt.doctorName}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {new Date(appt.startsAt).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};


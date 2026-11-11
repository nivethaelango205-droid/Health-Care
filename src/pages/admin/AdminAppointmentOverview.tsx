import React, { useState, useEffect } from 'react';
import { appointmentService } from '../../services/appointmentService';
import { Appointment } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { AppointmentLetterModal } from '../../components/appointments/AppointmentLetterModal';
import { Calendar, Search, FileText } from 'lucide-react';
import { Input } from '../../components/common/Input';

export const AdminAppointmentOverview: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [search, setSearch] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<Appointment | null>(null);

  useEffect(() => {
    const load = async () => {
      const list = await appointmentService.getAppointments();
      setAppointments(list);
    };
    load();
  }, []);

  const filtered = appointments.filter(
    (a) =>
      a.patientName.toLowerCase().includes(search.toLowerCase()) ||
      a.doctorName.toLowerCase().includes(search.toLowerCase()) ||
      a.number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-900 tracking-tight">Platform Consultations Overview</h2>
          <p className="text-xs text-brandMuted">
            Monitor real-time telemedicine session status across all rural nodes and assigned doctors.
          </p>
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Search reference or participant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      <Card padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Reference</th>
                <th className="p-4">Patient</th>
                <th className="p-4">Doctor</th>
                <th className="p-4">Scheduled Slot (IST)</th>
                <th className="p-4">Mode</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Confirmation Letter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((appt) => (
                <tr key={appt.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-navy-900">{appt.number}</td>
                  <td className="p-4 font-medium text-slate-800">{appt.patientName}</td>
                  <td className="p-4 font-medium text-teal-800">{appt.doctorName}</td>
                  <td className="p-4 text-slate-600">
                    {new Date(appt.startsAt).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="p-4">
                    <Badge variant={appt.mode} size="sm" />
                  </td>
                  <td className="p-4">
                    <Badge variant={appt.status} dot size="sm" />
                  </td>
                  <td className="p-4 text-right">
                    {appt.status === 'confirmed' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<FileText className="h-3.5 w-3.5" />}
                        onClick={() => setSelectedLetter(appt)}
                        className="text-xs"
                      >
                        Inspect Letter
                      </Button>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AppointmentLetterModal
        isOpen={!!selectedLetter}
        onClose={() => setSelectedLetter(null)}
        appointment={selectedLetter}
      />
    </div>
  );
};


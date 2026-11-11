import React, { useState, useEffect } from 'react';
import { recordService } from '../../services/recordService';
import { appointmentService } from '../../services/appointmentService';
import { consultationService } from '../../services/consultationService';
import { useAuth } from '../../contexts/AuthContext';
import { Appointment, Consultation, HealthRecord } from '../../types';
import { RecordCard } from '../../components/records/RecordCard';
import { RecordEditorModal } from '../../components/records/RecordEditorModal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { FileText, Plus, Search, ShieldCheck } from 'lucide-react';

export const DoctorPatientRecords: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [recordContext, setRecordContext] = useState<{ appointment: Appointment; consultation: Consultation } | null>(null);
  const [isOpeningEditor, setIsOpeningEditor] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const [list, appointmentList] = await Promise.all([
        recordService.getRecords(),
        appointmentService.getAppointments(),
      ]);
      setRecords(list);
      const eligible = appointmentList.filter((appointment) => appointment.status === 'confirmed' && appointment.mode === 'video');
      setAppointments(appointmentList);
      setSelectedAppointmentId((previous) => eligible.some((appointment) => appointment.id === previous) ? previous : eligible[0]?.id || '');
    } catch (err) {
      console.error('Failed to load doctor patient records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const eligibleAppointments = appointments.filter((appointment) => appointment.status === 'confirmed' && appointment.mode === 'video');

  const handleOpenEditor = async () => {
    const appointment = eligibleAppointments.find((item) => item.id === selectedAppointmentId);
    if (!appointment) {
      setEditorError('Confirm a video appointment before adding a clinical record.');
      return;
    }

    setIsOpeningEditor(true);
    setEditorError(null);
    try {
      let consultation = await consultationService.createOrGetConsultation(appointment.id, appointment.doctorId, appointment.patientId);
      if (records.some((record) => record.consultationId === consultation.id)) {
        setEditorError('This consultation already has a clinical record. Select another appointment to create a new record.');
        return;
      }
      if (consultation.status === 'scheduled') {
        consultation = await consultationService.updateStatus(consultation.id, 'in_progress');
      }
      setRecordContext({ appointment, consultation });
      setIsEditorOpen(true);
    } catch (err: any) {
      setEditorError(err.message || 'Could not open the selected consultation for record entry.');
    } finally {
      setIsOpeningEditor(false);
    }
  };

  const filtered = records.filter(
    (r) =>
      r.symptoms.toLowerCase().includes(search.toLowerCase()) ||
      r.clinicalNotes.toLowerCase().includes(search.toLowerCase()) ||
      r.recommendations.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-navy-900 tracking-tight">Patient Clinical Records</h2>
            <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Authorized Review & Entry
            </span>
          </div>
          <p className="text-xs text-brandMuted mt-0.5">
            Review encrypted patient clinical histories and write telemedicine consultation records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Input
            placeholder="Search symptoms or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            className="w-full sm:w-64"
          />
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={handleOpenEditor}
            isLoading={isOpeningEditor}
            className="shrink-0"
          >
            Add Clinical Record
          </Button>
        </div>
      </div>

      <div className="max-w-xl">
        <Select
          label="Consultation for new clinical record"
          value={selectedAppointmentId}
          onChange={(event) => setSelectedAppointmentId(event.target.value)}
          options={eligibleAppointments.length > 0
            ? eligibleAppointments.map((appointment) => ({ value: appointment.id, label: `${appointment.patientName} — ${appointment.number}` }))
            : [{ value: '', label: 'No confirmed video appointments' }]}
          disabled={eligibleAppointments.length === 0 || isOpeningEditor}
          error={editorError || undefined}
        />
      </div>

      {isLoading ? (
        <LoadingSkeleton type="card" rows={2} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-7 w-7 text-teal-600" />}
          title="No Patient Records Found"
          description="Clinical entries created during consultations will appear here."
          actionText="Add Record Now"
          onAction={handleOpenEditor}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((rec) => (
            <RecordCard
              key={rec.id}
              record={rec}
              patientName={appointments.find((appointment) => appointment.patientId === rec.patientId)?.patientName}
              doctorName={user?.name}
            />
          ))}
        </div>
      )}

      {/* Record Editor Modal */}
      {recordContext && (
        <RecordEditorModal
          key={recordContext.consultation.id}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          patientId={recordContext.consultation.patientId}
          patientName={recordContext.appointment.patientName}
          doctorId={recordContext.consultation.doctorId}
          consultationId={recordContext.consultation.id}
          onSuccess={() => {
            loadRecords();
          }}
        />
      )}
    </div>
  );
};

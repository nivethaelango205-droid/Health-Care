import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { VideoRoom } from '../../components/consultations/VideoRoom';
import { appointmentService } from '../../services/appointmentService';
import { recordService } from '../../services/recordService';
import { consultationService } from '../../services/consultationService';
import { Appointment, Consultation, HealthRecord } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  FileText,
  Save,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  ShieldCheck,
  Stethoscope,
  Pill,
} from 'lucide-react';

async function ensureConsultationStarted(consultation: Consultation): Promise<Consultation> {
  if (consultation.status !== 'scheduled') return consultation;
  try {
    return await consultationService.updateStatus(consultation.id, 'in_progress');
  } catch (error: any) {
    if (error.status === 409) {
      const current = await consultationService.getConsultation(consultation.id);
      if (current.status === 'in_progress') return current;
    }
    throw error;
  }
}

export const DoctorVideoWorkspace: React.FC = () => {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patientHistory, setPatientHistory] = useState<HealthRecord[]>([]);
  const [realConsultationId, setRealConsultationId] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  // Clinical notes state
  const [symptoms, setSymptoms] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRealConsultationId(null);
    setWorkspaceError(null);
    const initWorkspace = async () => {
      try {
        const appts = await appointmentService.getAppointments();
        if (cancelled) return;
        let currentAppt = null;
        if (appointmentId) {
          currentAppt = appts.find((a) => a.id === appointmentId);
        } else {
          currentAppt = appts.find((a) => a.status === 'confirmed' && a.mode === 'video');
        }
        setAppointment(currentAppt || null);
        if (!currentAppt || currentAppt.status !== 'confirmed' || currentAppt.mode !== 'video') {
          throw new Error('Select a confirmed video appointment to open this consultation.');
        }

        const c = await consultationService.createOrGetConsultation(currentAppt.id);
        if (cancelled) return;
        setRealConsultationId(c.id);
        await ensureConsultationStarted(c);
        if (cancelled) return;

        // Fetch patient records
        const recs = await recordService.getRecords();
        if (cancelled) return;
        setPatientHistory(recs);
      } catch (err: any) {
        if (cancelled) return;
        console.error('Workspace load error:', err);
        setWorkspaceError(err.message || 'Could not resolve the video consultation.');
      }
    };
    initWorkspace();
    return () => { cancelled = true; };
  }, [appointmentId]);

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim() || !clinicalNotes.trim() || !recommendations.trim()) {
      setSaveError('Please fill in symptoms, clinical notes, and recommendations.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      if (!appointment) throw new Error('A confirmed appointment is required to save clinical notes.');
      let activeConsultationId = realConsultationId;
      if (!activeConsultationId) {
        const c = await consultationService.createOrGetConsultation(appointment.id);
        activeConsultationId = c.id;
        setRealConsultationId(c.id);
        await ensureConsultationStarted(c);
      }

      await recordService.createRecord({
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        consultationId: activeConsultationId,
        consultationDate: new Date().toISOString(),
        symptoms,
        clinicalNotes,
        recommendations,
      });
      setSaveSuccess(true);
      // reload history
      const updated = await recordService.getRecords();
      setPatientHistory(updated);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save clinical record.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {workspaceError && (
        <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {workspaceError}
        </div>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Video Consultation Canvas */}
        <div className="xl:col-span-7 space-y-4">
          <VideoRoom
            consultationId={realConsultationId || 'consultation-active'}
            appointmentNumber={appointment?.number || 'RC360-DEL-8941'}
            participantName={appointment?.patientName || 'Asha Sharma'}
            userRole="doctor"
            onLeave={() => navigate('/doctor/dashboard')}
          />
        </div>

        {/* Right Column: Patient Information & Clinical Notes */}
        <div className="xl:col-span-5 space-y-5">
          {/* Patient Quick Glance */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                  {appointment?.patientName ? appointment.patientName[0] : 'P'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-navy-900 leading-tight">
                    {appointment?.patientName || 'Asha Sharma'}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Ref: {appointment?.number || 'RC360-DEL-8941'}
                  </span>
                </div>
              </div>
              <Badge variant={appointment?.status || 'confirmed'} dot size="sm" />
            </div>

            <div className="text-[11px] text-slate-600 space-y-1">
              <p>
                <span className="font-semibold text-slate-700">Subcenter Location:</span> Gram Panchayat Bilaspur
              </p>
              <p>
                <span className="font-semibold text-slate-700">Scheduled:</span>{' '}
                {appointment
                  ? new Date(appointment.startsAt).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })
                  : 'Current Slot'}
              </p>
            </div>
          </Card>

          {/* Clinical Notes Form */}
          <Card className="p-5 space-y-4 border-t-4 border-t-teal-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-600" />
                <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                  Live Clinical Assessment & Prescription
                </h3>
              </div>
              <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-medium border border-teal-200">
                Encrypted Write
              </span>
            </div>

            {saveSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Clinical record successfully saved and synced to patient portal!</span>
              </div>
            )}

            {saveError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{saveError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNotes} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Observed Symptoms & Complaints
                </label>
                <textarea
                  rows={2}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. Chest tightness on exertion, intermittent productive cough..."
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Doctor Clinical Assessment & Findings
                </label>
                <textarea
                  rows={3}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="e.g. Vitals normal. BP 128/82. SpO2 97%. Respiratory wheeze audible on forced expiration..."
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Prescription & Treatment Recommendations
                </label>
                <textarea
                  rows={3}
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="1. Tab Montelukast 10mg OD HS for 10 days.\n2. Inhaler Budesonide 200mcg 2 puffs BD.\n3. Return for follow up in 2 weeks."
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="w-full"
                isLoading={isSaving}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Save & Issue Clinical Record
              </Button>
            </form>
          </Card>

          {/* Previous Patient Records History */}
          <Card className="p-4 space-y-3">
            <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
              Previous Medical Records ({patientHistory.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
              {patientHistory.map((rec) => (
                <div key={rec.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span>{new Date(rec.consultationDate).toLocaleDateString()}</span>
                    <span className="text-teal-700 font-semibold">Consultation Record</span>
                  </div>
                  <p className="text-[11px] text-slate-700 line-clamp-2">{rec.clinicalNotes}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

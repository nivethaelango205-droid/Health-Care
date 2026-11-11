import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { recordService } from '../../services/recordService';
import { HealthRecord } from '../../types';
import { FileText, Pill, Stethoscope, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RecordEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  doctorId: string;
  consultationId: string;
  onSuccess: (record: HealthRecord) => void;
}

export const RecordEditorModal: React.FC<RecordEditorModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  doctorId,
  consultationId,
  onSuccess,
}) => {
  const [symptoms, setSymptoms] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim() || !clinicalNotes.trim() || !recommendations.trim()) {
      setError('Please fill in all clinical fields (symptoms, assessment, and recommendations).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newRec = await recordService.createRecord({
        patientId,
        doctorId,
        consultationId,
        consultationDate: new Date().toISOString(),
        symptoms,
        clinicalNotes,
        recommendations,
      });
      onSuccess(newRec);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save clinical record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Medical Consultation Record"
      subtitle={`Entering Clinical Notes for ${patientName}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Symptoms */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Presenting Symptoms & Patient History
          </label>
          <textarea
            rows={2}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="e.g. Fever for 3 days, body aches, persistent dry cough..."
            className="w-full text-xs rounded-lg border border-slate-300 p-3 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white"
            required
          />
        </div>

        {/* Clinical Assessment */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Clinical Examination & Assessment
          </label>
          <textarea
            rows={3}
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            placeholder="e.g. Vitals stable, chest clear on auscultation, no focal deficits. Suspected viral upper respiratory infection..."
            className="w-full text-xs rounded-lg border border-slate-300 p-3 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white"
            required
          />
        </div>

        {/* Recommendations & Prescription */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Treatment Plan, Prescription & Dietary Advice
          </label>
          <textarea
            rows={3}
            value={recommendations}
            onChange={(e) => setRecommendations(e.target.value)}
            placeholder="1. Tab Paracetamol 650mg SOS after meals.\n2. Hydration: drink warm boiled water.\n3. Follow up in 5 days if fever persists."
            className="w-full text-xs rounded-lg border border-slate-300 p-3 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white"
            required
          />
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            Save Encrypted Health Record
          </Button>
        </div>
      </form>
    </Modal>
  );
};


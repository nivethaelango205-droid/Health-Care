import React, { useState, useEffect } from 'react';
import { recordService } from '../../services/recordService';
import { HealthRecord } from '../../types';
import { RecordCard } from '../../components/records/RecordCard';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { FileText, ShieldCheck, Download, Search } from 'lucide-react';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const PatientHealthRecords: React.FC = () => {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const list = await recordService.getRecords();
        setRecords(list);
      } catch (err) {
        console.error('Failed to load health records:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const filtered = records.filter(
    (r) =>
      r.symptoms.toLowerCase().includes(search.toLowerCase()) ||
      r.clinicalNotes.toLowerCase().includes(search.toLowerCase()) ||
      r.recommendations.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-navy-900 tracking-tight">Digital Health Records</h2>
            <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              E2E Encrypted
            </span>
          </div>
          <p className="text-xs text-brandMuted mt-0.5">
            Verified telemedicine clinical prescriptions and notes entered by your attending doctors.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search symptoms or medicines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Record list */}
      {isLoading ? (
        <LoadingSkeleton type="card" rows={2} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-7 w-7 text-teal-600" />}
          title="No Health Records Found"
          description="Your medical records and prescriptions will automatically appear here once you complete a consultation."
          actionText="Book Consultation"
          onAction={() => (window.location.href = '/patient/doctors')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((rec) => (
            <RecordCard
              key={rec.id}
              record={rec}
              doctorName="Dr. Meera Nambiar"
            />
          ))}
        </div>
      )}
    </div>
  );
};


import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { HealthRecord } from '../../types';
import { Calendar, User, FileText, Pill, Stethoscope, Clock, ShieldCheck } from 'lucide-react';

interface RecordCardProps {
  record: HealthRecord;
  doctorName?: string;
  patientName?: string;
}

export const RecordCard: React.FC<RecordCardProps> = ({ record, doctorName, patientName }) => {
  const date = new Date(record.consultationDate);
  const formattedDate = date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'long',
  });

  return (
    <Card hover className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-navy-900">
              {doctorName ? `Consultation with ${doctorName}` : 'Clinical Consultation Record'}
            </h4>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
              <Calendar className="h-3 w-3 text-teal-600" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
          <ShieldCheck className="h-3 w-3" />
          <span>Encrypted Record</span>
        </div>
      </div>

      {/* Patient Name if shown */}
      {patientName && (
        <div className="text-xs">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            Patient Name:
          </span>
          <p className="font-semibold text-navy-900">{patientName}</p>
        </div>
      )}

      {/* Symptoms */}
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
          Reported Symptoms
        </span>
        <p className="text-xs text-slate-700 leading-relaxed">{record.symptoms}</p>
      </div>

      {/* Clinical Notes */}
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
          <FileText className="h-3 w-3 text-teal-600" /> Clinical Assessment
        </span>
        <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line bg-white p-2.5 rounded-lg border border-slate-200/80">
          {record.clinicalNotes}
        </p>
      </div>

      {/* Recommendations & Prescription */}
      <div className="bg-teal-50/40 p-3 rounded-lg border border-teal-100 space-y-1">
        <span className="text-[10px] font-bold text-teal-900 uppercase tracking-wider block flex items-center gap-1">
          <Pill className="h-3 w-3 text-teal-700" /> Treatment & Recommendations
        </span>
        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium">
          {record.recommendations}
        </p>
      </div>
    </Card>
  );
};


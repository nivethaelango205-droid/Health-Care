import React, { useState, useEffect } from 'react';
import { doctorService } from '../../services/doctorService';
import { Doctor } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ShieldCheck, CheckCircle2, XCircle, Stethoscope, Building, Search } from 'lucide-react';
import { Input } from '../../components/common/Input';

export const AdminDoctorManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      const list = await doctorService.getDoctors();
      setDoctors(list);
    };
    load();
  }, []);

  const toggleVerification = (doctorId: string) => {
    setDoctors((prev) =>
      prev.map((doc) => (doc.id === doctorId ? { ...doc, verified: !doc.verified } : doc))
    );
  };

  const filtered = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-900 tracking-tight">Doctor Verification & Licensure</h2>
          <p className="text-xs text-brandMuted">
            Review state medical council licenses and credential verification for rural telemedicine doctors.
          </p>
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Search doctors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((doc) => (
          <Card key={doc.id} hover className="flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="h-10 w-10 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center">
                  🩺
                </div>
                {doc.verified ? (
                  <Badge variant="verified" dot size="sm" />
                ) : (
                  <Badge variant="unverified" size="sm" />
                )}
              </div>

              <h4 className="text-base font-bold text-navy-900">{doc.name}</h4>
              <p className="text-xs text-teal-700 font-semibold">{doc.specialty}</p>
              <p className="text-[11px] text-slate-500 mt-1">{doc.hospital || 'District Hospital Telehealth Node'}</p>

              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] space-y-1">
                <p className="text-slate-500">
                  <span className="font-semibold text-slate-700">Experience:</span> {doc.experienceYears || 10} Years
                </p>
                <p className="text-slate-500">
                  <span className="font-semibold text-slate-700">Open Slots:</span> {doc.availability.length} active slots
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <Button
                variant={doc.verified ? 'outline' : 'primary'}
                size="sm"
                onClick={() => toggleVerification(doc.id)}
                className="text-xs"
              >
                {doc.verified ? 'Revoke Verification' : 'Approve & Verify Doctor'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};


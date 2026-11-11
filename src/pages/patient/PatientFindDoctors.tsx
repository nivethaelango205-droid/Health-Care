import React, { useState, useEffect } from 'react';
import { doctorService } from '../../services/doctorService';
import { Doctor } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { AppointmentBookingModal } from '../../components/appointments/AppointmentBookingModal';
import {
  Search,
  UserCheck,
  Calendar,
  Clock,
  ShieldCheck,
  Stethoscope,
  Building,
  Languages,
} from 'lucide-react';

export const PatientFindDoctors: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const list = await doctorService.getDoctors();
        setDoctors(list);
      } catch (err) {
        console.error('Failed to load doctors:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDoctors();
  }, []);

  const dynamicSpecialties = Array.from(new Set(doctors.map((d) => d.specialty).filter(Boolean)));
  const specialties = ['all', ...(dynamicSpecialties.length > 0 ? dynamicSpecialties : ['General Medicine'])];

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'all' || doc.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="space-y-6">
      {/* Header and Search Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search doctors by name or medical specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>

        {/* Specialty Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          {specialties.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                selectedSpecialty === spec
                  ? 'bg-teal-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {spec === 'all' ? 'All Specialties' : spec.split('&')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doc) => (
          <Card key={doc.id} hover className="flex flex-col justify-between">
            <div>
              {/* Doctor Header */}
              <div className="flex items-start gap-3.5 mb-4">
                <div className="h-12 w-12 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-base shrink-0 shadow-sm">
                  {doc.name.split(' ').slice(-1)[0][0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-base font-bold text-navy-900 truncate">{doc.name}</h4>
                  </div>
                  <p className="text-xs text-teal-700 font-semibold">{doc.specialty}</p>
                  <div className="mt-1">
                    {doc.verified ? (
                      <Badge variant="verified" dot size="sm" />
                    ) : (
                      <Badge variant="unverified" size="sm" />
                    )}
                  </div>
                </div>
              </div>

              {/* Hospital Affiliation & Languages */}
              <div className="space-y-2 text-xs text-slate-600 border-t border-b border-slate-100 py-3 mb-4">
                {doc.hospital && (
                  <div className="flex items-center gap-2">
                    <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{doc.hospital}</span>
                  </div>
                )}
                {doc.languages && (
                  <div className="flex items-center gap-2">
                    <Languages className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{doc.languages.join(', ')}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                  <span className="text-slate-700 font-medium">
                    {doc.availability.length} active consultation slot(s) open
                  </span>
                </div>
              </div>
            </div>

            {/* Book Appointment Action */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                className="w-full justify-center"
                leftIcon={<Calendar className="h-4 w-4" />}
                onClick={() => setBookingDoctor(doc)}
              >
                Book Appointment
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Booking Modal */}
      <AppointmentBookingModal
        isOpen={!!bookingDoctor}
        onClose={() => setBookingDoctor(null)}
        doctor={bookingDoctor}
        onSuccess={() => {
          // Booking succeeded
        }}
      />
    </div>
  );
};


import React from 'react';
import { HeartPulse, Shield, Video, Calendar, PhoneCall, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md">
                <HeartPulse className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">RuralCare 360</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bridging the healthcare divide for rural communities through secure telemedicine consultations, digital health records, and emergency assistance coordination.
            </p>
            <div className="pt-2 text-xs text-slate-400">
              <p className="font-semibold text-slate-200">Hackathon Entry:</p>
              <p>CODIENYCH 1.0</p>
              <p>Team: <span className="text-teal-400 font-medium">Hack Rat</span></p>
              <p className="text-[11px] text-slate-400">Team ID: CODIENYCH-2026-0003</p>
            </div>
          </div>

          {/* Solution Portals */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
              Platform Portals
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/patient/dashboard" className="text-slate-400 hover:text-teal-400 transition-colors">
                  Patient Portal
                </Link>
              </li>
              <li>
                <Link to="/doctor/dashboard" className="text-slate-400 hover:text-teal-400 transition-colors">
                  Doctor Portal
                </Link>
              </li>
              <li>
                <Link to="/admin/dashboard" className="text-slate-400 hover:text-teal-400 transition-colors">
                  Admin Portal
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-slate-400 hover:text-teal-400 transition-colors">
                  Secure Sign-in
                </Link>
              </li>
            </ul>
          </div>

          {/* Core Capabilities */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
              Core Capabilities
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Video className="h-3.5 w-3.5 text-teal-400" /> Secure Video Consultations
              </li>
              <li className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-teal-400" /> Digital Health Records
              </li>
              <li className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-teal-400" /> Doctor Appointment Booking
              </li>
              <li className="flex items-center gap-2">
                <PhoneCall className="h-3.5 w-3.5 text-rose-400" /> Ambulance Assistance Request
              </li>
            </ul>
          </div>

          {/* Hackathon Statement & Integrity */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
              Hackathon Context
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Built specifically for CODIENYCH 1.0 addressing the Telemedicine Access for Rural Healthcare problem statement.
            </p>
            <div className="p-3 rounded-lg bg-navy-900 border border-navy-800 text-[11px] text-slate-400 leading-snug">
              Prototype developed with React, TypeScript, Tailwind CSS, WebRTC signaling architecture, and verified clinical workflows.
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-navy-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 RuralCare 360 • Team Hack Rat • CODIENYCH 1.0</p>
          <p className="text-[11px]">Designed for Rural Healthcare Accessibility</p>
        </div>
      </div>
    </footer>
  );
};


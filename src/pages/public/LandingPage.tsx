import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import {
  Video,
  FileText,
  Calendar,
  PhoneCall,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  HeartPulse,
  Users,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  Wifi,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-24 pb-20">
      {/* HERO SECTION */}
      <section id="home" className="relative pt-12 lg:pt-20 overflow-hidden">
        {/* Soft decorative background accents */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-10 w-80 h-80 bg-navy-100/50 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Heading & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold shadow-sm">
                <HeartPulse className="h-4 w-4 text-teal-600" />
                <span>CODIENYCH 1.0 Hackathon • Telemedicine for Rural Access</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-navy-900 tracking-tight leading-[1.15]">
                Healthcare Access <br className="hidden sm:inline" />
                <span className="text-teal-600 underline decoration-teal-300 decoration-wavy decoration-2 underline-offset-8">
                  Beyond Distance.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                Connect with doctors through secure video consultations and access your digital health records from one convenient platform.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-3">
                <Link to="/patient/doctors">
                  <Button
                    variant="primary"
                    size="lg"
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                    className="shadow-md shadow-teal-700/20"
                  >
                    Connect With a Doctor
                  </Button>
                </Link>
                <a href="#features">
                  <Button variant="outline" size="lg">
                    Explore Our Platform
                  </Button>
                </a>
              </div>

              {/* Trust & Compliance Pills */}
              <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center gap-6 text-xs text-slate-600">
                <div className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="h-4 w-4 text-teal-600" />
                  <span>Verified Medical Specialists</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Wifi className="h-4 w-4 text-teal-600" />
                  <span>Optimized for Rural Bandwidth</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <FileText className="h-4 w-4 text-teal-600" />
                  <span>Downloadable Appointment Letters</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Illustration (Remote Communication) */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Visual Tele-Consultation Composition */}
                <div className="bg-gradient-to-br from-navy-900 to-navy-950 rounded-3xl p-6 sm:p-7 text-white shadow-2xl border border-navy-800 relative overflow-hidden">
                  {/* Decorative glowing background */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-navy-800 pb-4 mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
                        <Video className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">Live Remote Consultation</p>
                        <p className="text-[10px] text-teal-400 font-mono">Encrypted Tele-Session</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold flex items-center gap-1 border border-emerald-500/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Connected
                    </span>
                  </div>

                  {/* Split Remote Screen Representation */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {/* Remote Doctor Box */}
                    <div className="bg-navy-800/90 rounded-2xl p-4 border border-navy-700/80 flex flex-col items-center text-center">
                      <div className="h-16 w-16 rounded-full bg-teal-600/30 border-2 border-teal-400 text-teal-300 flex items-center justify-center font-bold text-lg mb-2 shadow-inner">
                        🩺
                      </div>
                      <p className="text-xs font-bold text-white">Dr. Meera Nambiar</p>
                      <p className="text-[10px] text-teal-300">Specialist Physician</p>
                      <span className="mt-2 text-[9px] bg-navy-900 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                        District Civil Hospital
                      </span>
                    </div>

                    {/* Rural Patient Box */}
                    <div className="bg-navy-800/90 rounded-2xl p-4 border border-navy-700/80 flex flex-col items-center text-center">
                      <div className="h-16 w-16 rounded-full bg-slate-700 border-2 border-slate-500 text-slate-200 flex items-center justify-center font-bold text-lg mb-2 shadow-inner">
                        👤
                      </div>
                      <p className="text-xs font-bold text-white">Asha Sharma</p>
                      <p className="text-[10px] text-slate-400">Rural Patient</p>
                      <span className="mt-2 text-[9px] bg-navy-900 text-teal-400 px-2 py-0.5 rounded-full font-mono">
                        Gram Sub-Center
                      </span>
                    </div>
                  </div>

                  {/* Real-time consultation status card */}
                  <div className="bg-navy-900/90 rounded-xl p-3.5 border border-navy-800 text-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Consultation Topic:</span>
                      <span className="text-white font-semibold">Hypertension & Respiratory Follow-up</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Digital Prescription:</span>
                      <span className="text-emerald-400 font-semibold">Synchronized to Portal</span>
                    </div>
                  </div>

                  {/* Floating Action Badge */}
                  <div className="mt-4 pt-3 border-t border-navy-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Low-latency audio & video</span>
                    <Link to="/patient/consultations" className="text-teal-400 font-semibold hover:underline flex items-center gap-1">
                      <span>Enter Room</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                {/* Floating decorative badge */}
                <div className="absolute -bottom-6 -left-6 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xl hidden sm:flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-navy-900">Zero Travel Burden</p>
                    <p className="text-[10px] text-brandMuted">Remote Doctor Access</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES SECTION (Exactly Four Capabilities) */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Badge variant="teal" size="sm" className="mb-2">
            Targeted Problem Statement Capabilities
          </Badge>
          <h2 className="text-3xl font-extrabold text-navy-900 tracking-tight">
            Engineered Specifically for Rural Telemedicine
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Four focused, high-impact capabilities addressing distance barriers, specialist shortages, and rural emergency response.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Capability 1 */}
          <Card hover className="flex flex-col justify-between border-t-4 border-t-teal-600">
            <div className="space-y-3">
              <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Video className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-navy-900">1. Secure Video Consultation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                WebRTC-architected video rooms with local camera preview, mute controls, and low-bandwidth resilience allowing patients to meet doctors face-to-face.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100">
              <Link to="/patient/consultations" className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1">
                <span>Experience Room</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </Card>

          {/* Capability 2 */}
          <Card hover className="flex flex-col justify-between border-t-4 border-t-navy-900">
            <div className="space-y-3">
              <div className="h-12 w-12 rounded-xl bg-navy-50 text-navy-900 flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-navy-900">2. Digital Health Records</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Structured clinical histories, recorded symptoms, and doctor recommendations with authorized patient-only access and backend encryption.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100">
              <Link to="/patient/records" className="text-xs font-bold text-navy-900 hover:text-teal-700 flex items-center gap-1">
                <span>View Records UI</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </Card>

          {/* Capability 3 */}
          <Card hover className="flex flex-col justify-between border-t-4 border-t-teal-600">
            <div className="space-y-3">
              <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-navy-900">3. Doctor Appointments</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Filter verified specialists by availability, reserve 30-minute consultation slots, and download official PDF confirmation letters upon doctor approval.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100">
              <Link to="/patient/doctors" className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1">
                <span>Book Appointment</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </Card>

          {/* Capability 4 */}
          <Card hover className="flex flex-col justify-between border-t-4 border-t-emergency-600">
            <div className="space-y-3">
              <div className="h-12 w-12 rounded-xl bg-emergency-50 text-emergency-600 flex items-center justify-center">
                <PhoneCall className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-navy-900">4. Emergency Ambulance</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dedicated patient emergency assistance request with browser GPS location capture, 108 helpline access, and administrative status coordination.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100">
              <Link to="/patient/ambulance" className="text-xs font-bold text-emergency-700 hover:text-emergency-800 flex items-center gap-1">
                <span>Request Ambulance</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="bg-navy-900 text-white py-16 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase font-semibold text-teal-400 tracking-wider">
              Visual Patient Journey
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mt-1">
              How RuralCare 360 Works
            </h2>
            <p className="text-xs text-slate-400 mt-2">
              Four streamlined steps from finding a verified doctor to accessing permanent clinical notes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-navy-950/60 p-6 rounded-2xl border border-navy-800 space-y-3 relative">
              <div className="h-10 w-10 rounded-xl bg-teal-600 text-white font-bold text-sm flex items-center justify-center">
                1
              </div>
              <h3 className="text-base font-bold text-white">Find Doctor</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Browse verified rural medicine specialists, view credentials, and inspect open availability windows.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-navy-950/60 p-6 rounded-2xl border border-navy-800 space-y-3 relative">
              <div className="h-10 w-10 rounded-xl bg-teal-600 text-white font-bold text-sm flex items-center justify-center">
                2
              </div>
              <h3 className="text-base font-bold text-white">Book Appointment</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Select your preferred date and 30-min slot. Once confirmed by the doctor, download the official letter.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-navy-950/60 p-6 rounded-2xl border border-navy-800 space-y-3 relative">
              <div className="h-10 w-10 rounded-xl bg-teal-600 text-white font-bold text-sm flex items-center justify-center">
                3
              </div>
              <h3 className="text-base font-bold text-white">Join Video Call</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter the encrypted telemedicine consultation room with real-time video, audio, and device controls.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-navy-950/60 p-6 rounded-2xl border border-navy-800 space-y-3 relative">
              <div className="h-10 w-10 rounded-xl bg-teal-600 text-white font-bold text-sm flex items-center justify-center">
                4
              </div>
              <h3 className="text-base font-bold text-white">Access Records</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                View doctor-certified clinical notes, dietary recommendations, and prescriptions anytime from your portal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PORTAL ACCESS CALLOUT FOR JUDGES */}
      <section id="solution" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-teal-50 to-slate-100 rounded-3xl p-8 sm:p-12 border border-teal-200/80 shadow-card">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <Badge variant="teal" size="sm">
                Three Distinct Role Portals
              </Badge>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
                Review the Patient, Doctor, and Admin Interfaces
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                RuralCare 360 implements strict role-based separation with tailored workflows for rural patients, consulting medical doctors, and health administration officers.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link to="/patient/dashboard">
                  <Button variant="primary" size="md">
                    Explore Patient Portal
                  </Button>
                </Link>
                <Link to="/doctor/dashboard">
                  <Button variant="secondary" size="md">
                    Explore Doctor Workspace
                  </Button>
                </Link>
                <Link to="/admin/dashboard">
                  <Button variant="outline" size="md">
                    Explore Admin Console
                  </Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
              <p className="font-bold text-navy-900 uppercase tracking-wider text-[11px]">
                Judge Review Shortcuts
              </p>
              <div className="space-y-2">
                <Link
                  to="/patient/appointments"
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium"
                >
                  <span>1. Appointment Letters</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>
                <Link
                  to="/patient/consultations"
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium"
                >
                  <span>2. Video Consultation Room</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>
                <Link
                  to="/patient/ambulance"
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium"
                >
                  <span>3. Ambulance Assistance (108)</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>
                <Link
                  to="/doctor/workspace"
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium"
                >
                  <span>4. Doctor Clinical Notes Input</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};


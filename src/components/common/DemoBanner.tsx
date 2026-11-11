import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDemo } from '../../contexts/DemoContext';
import { useNavigate } from 'react-router-dom';
import { ChevronUp, ChevronDown, Activity, Sparkles, UserCheck, ShieldAlert } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const { user, role, switchDemoRole } = useAuth();
  const { isDemoMode, toggleDemoMode, backendConnected } = useDemo();
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSwitch = (targetRole: 'patient' | 'doctor' | 'admin') => {
    switchDemoRole(targetRole);
    if (targetRole === 'patient') navigate('/patient/dashboard');
    else if (targetRole === 'doctor') navigate('/doctor/dashboard');
    else if (targetRole === 'admin') navigate('/admin/dashboard');
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 bg-navy-900 text-white text-xs px-3.5 py-2 rounded-full shadow-lg border border-teal-500/30 hover:bg-navy-800 transition-all"
        >
          <Sparkles className="h-3.5 w-3.5 text-teal-400" />
          <span className="font-medium">Judge Review Bar</span>
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <aside aria-label="Judge Demo Banner" className="bg-navy-950 border-b border-navy-800 text-white text-xs px-4 py-2 relative z-40 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Hackathon info */}
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-semibold uppercase tracking-wider text-[10px] border border-teal-500/30">
            <Sparkles className="h-3 w-3" />
            CODIENYCH 1.0 • Hack Rat
          </span>
          <span className="text-slate-300 hidden sm:inline">
            RuralCare 360 Telemedicine Platform
          </span>
          {/* Backend Status indicator */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-navy-800">
            <span
              className={`h-2 w-2 rounded-full ${
                backendConnected ? 'bg-emerald-400 ring-2 ring-emerald-500/20' : 'bg-amber-400'
              }`}
            />
            <span className="text-[11px] text-slate-300">
              {backendConnected ? 'Backend Live (Port 4000)' : 'Demo Sandbox Active'}
            </span>
          </div>
        </div>

        {/* Quick Portal Switcher for Judges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 text-[11px] hidden md:inline">Quick Portal Switch:</span>

          <button
            onClick={() => handleSwitch('patient')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              role === 'patient'
                ? 'bg-teal-600 text-white'
                : 'bg-navy-800/80 text-slate-300 hover:bg-navy-700 hover:text-white'
            }`}
          >
            👤 Patient (Asha)
          </button>

          <button
            onClick={() => handleSwitch('doctor')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              role === 'doctor'
                ? 'bg-teal-600 text-white'
                : 'bg-navy-800/80 text-slate-300 hover:bg-navy-700 hover:text-white'
            }`}
          >
            🩺 Doctor (Dr. Meera)
          </button>

          <button
            onClick={() => handleSwitch('admin')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              role === 'admin'
                ? 'bg-teal-600 text-white'
                : 'bg-navy-800/80 text-slate-300 hover:bg-navy-700 hover:text-white'
            }`}
          >
            🛡️ Admin (Suresh)
          </button>

          {/* Toggle Demo Mode button */}
          <button
            onClick={toggleDemoMode}
            className={`ml-2 px-2.5 py-1 rounded border text-[11px] transition-colors ${
              isDemoMode
                ? 'border-teal-500/40 text-teal-300 bg-teal-950/40'
                : 'border-slate-600 text-slate-300 hover:text-white'
            }`}
            title="Toggle between mock demonstration data and live backend API calls"
          >
            {isDemoMode ? 'Mode: Demo' : 'Mode: Live API'}
          </button>

          {/* Minimize */}
          <button
            onClick={() => setIsMinimized(true)}
            className="text-slate-400 hover:text-white p-1 ml-1 rounded hover:bg-navy-800"
            title="Minimize review bar"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};


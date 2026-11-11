import React from 'react';
import { Menu, PhoneCall, Bell, ExternalLink, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from './Button';

interface HeaderProps {
  onToggleSidebar: () => void;
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, title, subtitle }) => {
  const { user, role } = useAuth();

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between transition-all">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-navy-900 hover:bg-slate-100"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Page title and subtitle */}
        <div>
          <h1 className="text-base sm:text-lg font-bold text-navy-900 tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && <p className="text-xs text-brandMuted hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Patient emergency ambulance shortcut */}
        {role === 'patient' && (
          <>
            <Link to="/patient/ambulance" className="hidden sm:inline-block">
              <Button
                variant="emergency"
                size="sm"
                leftIcon={<PhoneCall className="h-3.5 w-3.5" />}
                className="text-xs font-semibold py-1.5"
              >
                Emergency Ambulance (108)
              </Button>
            </Link>
            <Link
              to="/patient/ambulance"
              className="sm:hidden flex items-center justify-center h-10 w-10 rounded-xl bg-emergency-600 text-white shadow-sm active:scale-95 transition-transform"
              title="Emergency Ambulance 108"
              aria-label="Emergency Ambulance 108"
            >
              <PhoneCall className="h-4 w-4 animate-pulse" />
            </Link>
          </>
        )}

        {/* Public home link */}
        <Link
          to="/"
          className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-teal-700 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <span>Landing Page</span>
          <ExternalLink className="h-3 w-3" />
        </Link>

        {/* Role badge */}
        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="h-8 w-8 rounded-full bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-xs">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-navy-900 leading-tight">{user?.name || 'User'}</p>
            <p className="text-[10px] text-brandMuted capitalize leading-tight">{user?.role || 'Guest'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};


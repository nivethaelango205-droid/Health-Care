import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Search,
  Calendar,
  Video,
  FileText,
  PhoneCall,
  User,
  LogOut,
  HeartPulse,
  Users,
  UserCheck,
  ClipboardList,
  Sliders,
  ChevronRight,
  Shield,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: any;
  isEmergency?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const patientNav: NavItem[] = [
    { name: 'Dashboard', path: '/patient/dashboard', icon: LayoutDashboard },
    { name: 'Find Doctors', path: '/patient/doctors', icon: Search },
    { name: 'My Appointments', path: '/patient/appointments', icon: Calendar },
    { name: 'Video Consultation', path: '/patient/consultations', icon: Video },
    { name: 'Health Records', path: '/patient/records', icon: FileText },
    { name: 'Ambulance Assistance', path: '/patient/ambulance', icon: PhoneCall, isEmergency: true },
    { name: 'Profile', path: '/patient/profile', icon: User },
  ];

  const doctorNav: NavItem[] = [
    { name: 'Dashboard', path: '/doctor/dashboard', icon: LayoutDashboard },
    { name: 'Appointments', path: '/doctor/appointments', icon: Calendar },
    { name: 'Video Consultations', path: '/doctor/consultations', icon: Video },
    { name: 'Patient Records', path: '/doctor/records', icon: FileText },
    { name: 'Profile', path: '/doctor/profile', icon: User },
  ];

  const adminNav: NavItem[] = [
    { name: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Doctors', path: '/admin/doctors', icon: UserCheck },
    { name: 'Appointments', path: '/admin/appointments', icon: Calendar },
    { name: 'Ambulance Requests', path: '/admin/ambulance', icon: PhoneCall },
    { name: 'Settings', path: '/admin/settings', icon: Sliders },
  ];

  const navItems = role === 'patient' ? patientNav : role === 'doctor' ? doctorNav : adminNav;

  const roleLabels: Record<string, { title: string; color: string; icon: any }> = {
    patient: { title: 'Patient Portal', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20', icon: HeartPulse },
    doctor: { title: 'Doctor Workspace', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20', icon: UserCheck },
    admin: { title: 'Admin Console', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Shield },
  };

  const currentRoleInfo = role ? roleLabels[role] : roleLabels.patient;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-navy-900 border-r border-navy-800 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-navy-800">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md">
                <HeartPulse className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-lg text-white tracking-tight">RuralCare</span>
                  <span className="font-bold text-lg text-teal-400">360</span>
                </div>
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                  Telemedicine Hub
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-navy-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Current portal badge */}
          <div className="mt-4">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${currentRoleInfo.color}`}
            >
              <currentRoleInfo.icon className="h-3 w-3" />
              <span>{currentRoleInfo.title}</span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all min-h-[44px] group ${
                    isActive
                      ? item.isEmergency
                        ? 'bg-emergency-600 text-white font-semibold shadow-sm'
                        : 'bg-teal-600 text-white font-semibold shadow-sm shadow-teal-700/20'
                      : item.isEmergency
                      ? 'text-rose-300 hover:bg-emergency-950/40 hover:text-rose-200'
                      : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive
                            ? 'text-white'
                            : item.isEmergency
                            ? 'text-rose-400'
                            : 'text-slate-400 group-hover:text-teal-400'
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRight className="h-3 w-3 text-white/80" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User profile & Logout */}
        <div className="p-3.5 border-t border-navy-800 bg-navy-950/60">
          <div className="flex items-center justify-between gap-3 px-2 py-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full bg-navy-700 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold text-xs shrink-0">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || ''}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-400 p-2 rounded-lg hover:bg-navy-800 transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

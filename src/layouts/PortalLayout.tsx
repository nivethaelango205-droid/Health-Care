import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { Header } from '../components/common/Header';
import { DemoBanner } from '../components/common/DemoBanner';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

export const PortalLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Determine title from current pathname
  const getPageInfo = () => {
    const path = location.pathname;
    if (path.includes('/patient/dashboard')) return { title: 'Patient Healthcare Dashboard', subtitle: 'Manage appointments, access digital records, and connect with doctors' };
    if (path.includes('/patient/doctors')) return { title: 'Find Doctors & Availability', subtitle: 'Connect with verified medical specialists offering rural tele-consultations' };
    if (path.includes('/patient/appointments')) return { title: 'My Appointments & Letters', subtitle: 'View consultation bookings and download confirmed appointment letters' };
    if (path.includes('/patient/consultations')) return { title: 'Secure Video Consultation', subtitle: 'End-to-end encrypted remote consultation with verified doctor' };
    if (path.includes('/patient/records')) return { title: 'Personal Digital Health Records', subtitle: 'Verified medical prescriptions, consultation summaries, and doctor notes' };
    if (path.includes('/patient/ambulance')) return { title: 'Emergency Ambulance Assistance', subtitle: 'Internal assistance requests and emergency contact information' };
    if (path.includes('/patient/profile')) return { title: 'Patient Health Profile', subtitle: 'Personal credentials and verified healthcare identification' };

    if (path.includes('/doctor/dashboard')) return { title: 'Doctor Clinical Workspace', subtitle: 'Manage consultations, review patient queues, and update medical notes' };
    if (path.includes('/doctor/appointments')) return { title: 'Assigned Appointments', subtitle: 'Confirm, review, or reschedule incoming consultation requests' };
    if (path.includes('/doctor/consultations')) return { title: 'Video Consultation Session', subtitle: 'Real-time telemedicine room with patient health history & clinical notes' };
    if (path.includes('/doctor/records')) return { title: 'Patient Clinical Records', subtitle: 'Review encrypted patient histories and enter verified prescriptions' };
    if (path.includes('/doctor/profile')) return { title: 'Doctor Medical Profile', subtitle: 'Verification status, medical council credentials, and availability slots' };

    if (path.includes('/admin/dashboard')) return { title: 'Administrative Operations Dashboard', subtitle: 'System overview, user verification statuses, and emergency queue metrics' };
    if (path.includes('/admin/users')) return { title: 'User Management', subtitle: 'Review registered patients, doctors, and permission controls' };
    if (path.includes('/admin/doctors')) return { title: 'Doctor Verification & Credentialing', subtitle: 'Verify medical registrations and rural healthcare credentials' };
    if (path.includes('/admin/appointments')) return { title: 'Platform Consultations Overview', subtitle: 'Monitor booking statuses, completed sessions, and tele-health activity' };
    if (path.includes('/admin/ambulance')) return { title: 'Ambulance Assistance Coordination', subtitle: 'Review and acknowledge incoming rural emergency assistance requests' };
    if (path.includes('/admin/settings')) return { title: 'Platform Security & System Settings', subtitle: 'Encryption status, signaling server configuration, and operational parameters' };

    return { title: 'RuralCare 360', subtitle: 'Telemedicine Access for Rural Healthcare' };
  };

  const { title, subtitle } = getPageInfo();

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <DemoBanner />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Header
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            title={title}
            subtitle={subtitle}
          />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <ErrorBoundary fallbackTitle={title}>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  );
};

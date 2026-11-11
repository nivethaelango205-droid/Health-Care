import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { PortalLayout } from './layouts/PortalLayout';

// Public pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';

// Patient pages
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { PatientFindDoctors } from './pages/patient/PatientFindDoctors';
import { PatientAppointments } from './pages/patient/PatientAppointments';
import { PatientVideoConsultation } from './pages/patient/PatientVideoConsultation';
import { PatientHealthRecords } from './pages/patient/PatientHealthRecords';
import { PatientAmbulance } from './pages/patient/PatientAmbulance';
import { PatientProfile } from './pages/patient/PatientProfile';

// Doctor pages
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { DoctorAppointments } from './pages/doctor/DoctorAppointments';
import { DoctorVideoWorkspace } from './pages/doctor/DoctorVideoWorkspace';
import { DoctorPatientRecords } from './pages/doctor/DoctorPatientRecords';
import { DoctorProfile } from './pages/doctor/DoctorProfile';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUserManagement } from './pages/admin/AdminUserManagement';
import { AdminDoctorManagement } from './pages/admin/AdminDoctorManagement';
import { AdminAppointmentOverview } from './pages/admin/AdminAppointmentOverview';
import { AdminAmbulanceRequests } from './pages/admin/AdminAmbulanceRequests';
import { AdminSettings } from './pages/admin/AdminSettings';
import { DriverTrackingScreen } from './pages/driver/DriverTrackingScreen';
import { GlobalRuralCareAssistant } from './components/assistant/GlobalRuralCareAssistant';

export const App: React.FC = () => {
  return (
    <>
      <Routes>
        {/* Public Pages */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Driver Live GPS Tracking Screens */}
        <Route path="/driver/track" element={<DriverTrackingScreen />} />
        <Route path="/driver/track/:requestId" element={<DriverTrackingScreen />} />

      {/* Patient Portal */}
      <Route path="/patient" element={<PortalLayout />}>
        <Route index element={<Navigate to="/patient/dashboard" replace />} />
        <Route path="dashboard" element={<PatientDashboard />} />
        <Route path="doctors" element={<PatientFindDoctors />} />
        <Route path="appointments" element={<PatientAppointments />} />
        <Route path="consultations" element={<PatientVideoConsultation />} />
        <Route path="ai-consultation" element={<Navigate to="/patient/dashboard" replace />} />
        <Route path="records" element={<PatientHealthRecords />} />
        <Route path="ambulance" element={<PatientAmbulance />} />
        <Route path="profile" element={<PatientProfile />} />
      </Route>

      {/* Doctor Portal */}
      <Route path="/doctor" element={<PortalLayout />}>
        <Route index element={<Navigate to="/doctor/dashboard" replace />} />
        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route path="consultations" element={<DoctorVideoWorkspace />} />
        <Route path="records" element={<DoctorPatientRecords />} />
        <Route path="profile" element={<DoctorProfile />} />
      </Route>

      {/* Admin Portal */}
      <Route path="/admin" element={<PortalLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUserManagement />} />
        <Route path="doctors" element={<AdminDoctorManagement />} />
        <Route path="appointments" element={<AdminAppointmentOverview />} />
        <Route path="ambulance" element={<AdminAmbulanceRequests />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Catch-all redirect to Landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <GlobalRuralCareAssistant />
  </>
);
};

export default App;


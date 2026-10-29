import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { RouterProvider, useRouter } from './router/Router';
import Navbar from './components/Navbar';
import SubmitComplaintModal from './components/SubmitComplaintModal';
import LandingPage from './pages/LandingPage';
import TrackPage from './pages/TrackPage';
import CitizenRegisterPage from './pages/CitizenRegisterPage';
import CitizenLoginPage from './pages/CitizenLoginPage';
import CitizenDashboard from './pages/CitizenDashboard';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminRegisterPage from './pages/AdminRegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import OfficerLoginPage from './pages/OfficerLoginPage';
import OfficerRegisterPage from './pages/OfficerRegisterPage';

function AppContent() {
  const { currentPath } = useRouter();
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Route selector
  const renderRoute = () => {
    switch (currentPath) {
      case '/track':
        return <TrackPage />;
      case '/citizen/register':
        return <CitizenRegisterPage />;
      case '/citizen/login':
        return <CitizenLoginPage />;
      case '/citizen/dashboard':
        return (
          <CitizenDashboard
            onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
          />
        );
      case '/officer/login':
        return <OfficerLoginPage />;
      case '/admin/login':
        return <AdminLoginPage />;
      case '/officer/register':
        return <OfficerRegisterPage />;
      case '/admin/register':
        return <AdminRegisterPage />;
      case '/officer/dashboard':
      case '/admin/dashboard':
        return <AdminDashboard />;
      case '/':
      default:
        return (
          <LandingPage
            onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="app-layout">
      <Navbar onOpenSubmitModal={() => setIsSubmitModalOpen(true)} />

      <main className="main-content">
        {renderRoute()}
      </main>

      <SubmitComplaintModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onComplaintSubmitted={() => {
          // Trigger any refresh if needed
        }}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </AuthProvider>
  );
}

export default App;

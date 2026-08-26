import React, { useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { Menu } from 'lucide-react';

// Core Layout and Pages
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import DonorDashboard from './pages/DonorDashboard';
import NgoDashboard from './pages/NgoDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import About from './pages/About';
import Contact from './pages/Contact';

// Route Guard for authenticated users
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="spinner-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <p>Verifying session security...</p>
      </div>
    );
  }

  if (!user) {
    // Save the original location they tried to reach
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user's role is not authorized, redirect to home page
    return <Navigate to="/" replace />;
  }

  return children;
};

// Dashboard Layout Wrapper to share Sidebar and Navbar state
const DashboardWrapper = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useContext(AuthContext);

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', position: 'relative' }}>
        
        {/* Floating mobile toggle button to open the sidebar since Navbar is removed */}
        <button 
          className="mobile-sidebar-toggle" 
          onClick={() => setSidebarOpen(true)}
          aria-label="Open Sidebar"
        >
          <Menu size={20} />
        </button>

        <main className="main-panel">
          <Routes>
            {/* Donor Routes */}
            <Route path="donor" element={<ProtectedRoute allowedRoles={['Donor']}><DonorDashboard /></ProtectedRoute>} />
            <Route path="donor/donations" element={<ProtectedRoute allowedRoles={['Donor']}><DonorDashboard /></ProtectedRoute>} />
            <Route path="donor/pickups" element={<ProtectedRoute allowedRoles={['Donor']}><DonorDashboard /></ProtectedRoute>} />

            {/* NGO Routes */}
            <Route path="ngo" element={<ProtectedRoute allowedRoles={['NGO']}><NgoDashboard /></ProtectedRoute>} />
            <Route path="ngo/available" element={<ProtectedRoute allowedRoles={['NGO']}><NgoDashboard /></ProtectedRoute>} />
            <Route path="ngo/requests" element={<ProtectedRoute allowedRoles={['NGO']}><NgoDashboard /></ProtectedRoute>} />
            <Route path="ngo/pickups" element={<ProtectedRoute allowedRoles={['NGO']}><NgoDashboard /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="admin" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="admin/users" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="admin/donations" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="admin/requests" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="admin/pickups" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />

            {/* Profile Route */}
            <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Fallback inside dashboard */}
            <Route path="*" element={<Navigate to={`/dashboard/${user?.role.toLowerCase()}`} replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// Main App component
const AppContent = () => {
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith('/dashboard');

  return (
    <>
      {/* Show main landing page Header ONLY on non-dashboard paths */}
      {!isDashboardRoute && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/auth" element={<Auth />} />

        {/* Mount nested dashboard paths */}
        <Route path="/dashboard/*" element={<DashboardWrapper />} />

        {/* Global Fallback Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;

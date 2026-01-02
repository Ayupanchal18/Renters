import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MonitoringDashboard from '../components/admin/MonitoringDashboard';
import { isAuthenticated } from '../utils/auth';

const AdminDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto">
        <MonitoringDashboard />
      </main>
      
      <Footer />
    </div>
  );
};

export default AdminDashboard;
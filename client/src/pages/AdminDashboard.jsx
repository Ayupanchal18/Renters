import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MonitoringDashboard from '../components/admin/MonitoringDashboard';
import { isAuthenticated } from '../utils/auth';

/**
 * Admin Dashboard Page
 * 
 * **Feature: otp-delivery-reliability, Task 9: Add monitoring dashboard and administrative tools**
 * 
 * Main administrative interface for system monitoring and management.
 * Provides access to OTP delivery monitoring, service health status,
 * and administrative controls.
 * 
 * Requirements: 8.5, 3.5
 */
const AdminDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }

    // TODO: Add admin role check here
    // For now, we'll allow any authenticated user to access admin dashboard
    // In production, you should verify admin privileges
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
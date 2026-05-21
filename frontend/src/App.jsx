import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import CompanyManagement from './pages/CompanyManagement';
import AdminUserManagement from './pages/AdminUserManagement';
import MainLayout from './layouts/MainLayout';
import { useAuth } from './context/AuthContext';

import SubscriptionManagement from './pages/SubscriptionManagement';
import EmployeeManagement from './pages/EmployeeManagement';
import AssetManagement from './pages/AssetManagement';
import AttendanceManagement from './pages/AttendanceManagement';
import HolidayManagement from './pages/HolidayManagement';
import LeaveManagement from './pages/LeaveManagement';
import PayrollManagement from './pages/PayrollManagement';
import RewardsManagement from './pages/RewardsManagement';
import Settings from './pages/Settings';
import AIInsights from './pages/AIInsights';
import Meetings from './pages/Meetings';
import BehavioralGuide from './pages/BehavioralGuide';
import SalaryReport from './pages/SalaryReport';

function App() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
        
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/employees" element={<EmployeeManagement />} />
          <Route path="/attendance" element={<AttendanceManagement />} />
          <Route path="/assets" element={<AssetManagement />} />
          <Route path="/holidays" element={<HolidayManagement />} />
          <Route path="/leaves" element={<LeaveManagement />} />
          <Route path="/payroll" element={<PayrollManagement />} />
          <Route path="/appreciations" element={<RewardsManagement />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/ai-insights" element={<AIInsights />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/behavioral-iq" element={<BehavioralGuide />} />
          <Route path="/salary-report" element={<SalaryReport />} />
          
          <Route path="/super-admin">
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="companies" element={<CompanyManagement />} />
            <Route path="subscriptions" element={<SubscriptionManagement />} />
            <Route path="users" element={<AdminUserManagement />} />
            <Route index element={<Navigate to="dashboard" />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;



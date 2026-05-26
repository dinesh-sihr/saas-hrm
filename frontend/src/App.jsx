import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const MainLayout = lazy(() => import('./layouts/MainLayout'));

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const CompanyManagement = lazy(() => import('./pages/CompanyManagement'));
const AdminUserManagement = lazy(() => import('./pages/AdminUserManagement'));
const SubscriptionManagement = lazy(() => import('./pages/SubscriptionManagement'));
const EmployeeManagement = lazy(() => import('./pages/EmployeeManagement'));
const AssetManagement = lazy(() => import('./pages/AssetManagement'));
const AttendanceManagement = lazy(() => import('./pages/AttendanceManagement'));
const HolidayManagement = lazy(() => import('./pages/HolidayManagement'));
const LeaveManagement = lazy(() => import('./pages/LeaveManagement'));
const PayrollManagement = lazy(() => import('./pages/PayrollManagement'));
const RewardsManagement = lazy(() => import('./pages/RewardsManagement'));
const Settings = lazy(() => import('./pages/Settings'));
const AIInsights = lazy(() => import('./pages/AIInsights'));
const Meetings = lazy(() => import('./pages/Meetings'));
const BehavioralGuide = lazy(() => import('./pages/BehavioralGuide'));
const SalaryReport = lazy(() => import('./pages/SalaryReport'));

const PageLoader = () => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '0.75rem',
        opacity: 0.5
    }}>
        <div style={{
            width: '1.5rem',
            height: '1.5rem',
            border: '2px solid rgba(168, 85, 247, 0.2)',
            borderTopColor: '#a855f7',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite'
        }} />
    </div>
);

function App() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
    </Router>
  );
}

export default App;

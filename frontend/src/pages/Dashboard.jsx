import React from 'react';
import StatsGrid from '../components/dashboard/StatsGrid';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import AnnouncementList from '../components/dashboard/AnnouncementList';
import AttendanceCard from '../components/dashboard/AttendanceCard';
import { Zap } from 'lucide-react';
import '../styles/Dashboard.css';

import { useAuth } from '../context/AuthContext';

import SmartTracking from '../components/dashboard/SmartTracking';
import EmployeeTasks from '../components/dashboard/EmployeeTasks';
import BehavioralMap from '../components/dashboard/BehavioralMap';

const Dashboard = () => {
    const { user } = useAuth();
    
    return (
        <div className="dashboard-container">
            <div>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem'}}>
                    <div className="stat-icon-box" style={{backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', width: '1.75rem', height: '1.75rem'}}>
                        <Zap size={14} />
                    </div>
                    <h2 className="heading-sm" style={{margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem', opacity: 0.8}}>
                        {user.role === 'manager' ? 'Team Behavioral Dynamics (Live)' : 'Personal Behavioral Mapping (Live)'}
                    </h2>
                </div>
                <BehavioralMap />
            </div>

            <StatsGrid user={user} />

            <div className="dashboard-main-grid">
                <div className="dashboard-left-col" style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                    {user.role === 'manager' && <SmartTracking />}
                    {user.role === 'employee' && <EmployeeTasks />}
                    <ActivityFeed />
                </div>
                
                <aside className="dashboard-sidebar" style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                    <AttendanceCard />
                    <AnnouncementList />
                </aside>
            </div>
        </div>
    );
};

export default Dashboard;
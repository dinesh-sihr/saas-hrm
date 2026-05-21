import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Clock, Calendar, AlertCircle, Trophy, Sparkles } from 'lucide-react';
import '../../styles/Dashboard.css';
import '../../styles/UI.css';

const StatsGrid = ({ user }) => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    const iconMap = {
        employees: Users,
        attendance: Clock,
        leaves: Calendar,
        requests: AlertCircle,
        hours: Clock,
        rewards: Trophy,
        holidays: Sparkles,
        on_leave: Calendar,
        pending: AlertCircle,
        present: Users
    };

    const themeMap = {
        employees: {bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6'},
        attendance: {bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981'},
        leaves: {bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b'},
        requests: {bg: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e'},
        hours: {bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6'},
        rewards: {bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6'},
        holidays: {bg: 'rgba(236, 72, 153, 0.1)', color: '#ec4899'},
        on_leave: {bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b'},
        pending: {bg: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e'},
        present: {bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('/api/stats');
                setStats(response.data.metrics);
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return (
        <div className="stats-grid">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="stat-item glass-card loading-shimmer" style={{height: '100px'}}></div>
            ))}
        </div>
    );

    return (
        <div className="stats-grid">
            {stats.map((stat) => {
                const Icon = iconMap[stat.id] || AlertCircle;
                const theme = themeMap[stat.id] || themeMap.employees;
                
                return (
                    <div key={stat.id} className="stat-item glass-card">
                        <div className="stat-icon-box" style={{backgroundColor: theme.bg, color: theme.color}}>
                            <Icon size={22} />
                        </div>
                        <div className="stat-content">
                            <p className="text-label" style={{marginBottom: '0'}}>{stat.label}</p>
                            <h3>{stat.value}</h3>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default StatsGrid;

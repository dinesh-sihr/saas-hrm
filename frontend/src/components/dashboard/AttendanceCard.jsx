import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Play, Square, Calendar, TrendingUp } from 'lucide-react';
import '../../styles/UI.css';

const AttendanceCard = () => {
    const [status, setStatus] = useState(null);
    const [stats, setStats] = useState({ todayHours: 0, monthHours: 0, targetHours: 8, daysPresent: 0, onTimeDays: 0 });
    const [loading, setLoading] = useState(true);
    const [timer, setTimer] = useState('00:00:00');

    const fetchData = async () => {
        try {
            const [statusRes, statsRes] = await Promise.all([
                axios.get('/api/attendance/status'),
                axios.get('/api/attendance/stats')
            ]);
            setStatus(statusRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let interval;
        if (status && status.check_in && !status.check_out) {
            interval = setInterval(() => {
                const start = new Date(status.check_in);
                const now = new Date();
                const diff = now - start;
                
                const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
                const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
                const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
                
                setTimer(`${h}:${m}:${s}`);
            }, 1000);
        } else {
            setTimer('00:00:00');
        }
        return () => clearInterval(interval);
    }, [status]);

    const handleAction = async () => {
        setLoading(true);
        
        if (!navigator.geolocation) {
            alert("Your browser or device doesn't support GPS location tracking. Geofence verification is required to proceed.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                
                try {
                    const endpoint = status && !status.check_out ? '/api/attendance/check-out' : '/api/attendance/check-in';
                    await axios.post(endpoint, { latitude, longitude });
                    await fetchData();
                } catch (err) {
                    alert(err.response?.data?.message || 'Geofencing check or tap operation failed.');
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                console.error('Geolocation Error:', err);
                alert("We couldn't verify your location. Please check if location permissions are enabled on your device/browser and try again.");
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    const percentage = Math.min((parseFloat(stats.todayHours) / stats.targetHours) * 100, 100);
    const radius = 80;
    const circumference = Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="glass-card attendance-control-card">
            <div className="feed-header">
                <div>
                    <h3 className="heading-md">Attendance Control</h3>
                    <p className="text-label" style={{textTransform: 'none'}}>Track your productivity</p>
                </div>
                <div className="avatar-circle">
                    <Clock size={18} />
                </div>
            </div>

            <div className="gauge-container">
                <svg width="240" height="140" viewBox="0 0 200 120">
                    <path 
                        d="M 20 100 A 80 80 0 0 1 180 100" 
                        fill="none" 
                        stroke="var(--card-border)" 
                        strokeWidth="10" 
                        strokeLinecap="round"
                    />
                    <path 
                        d="M 20 100 A 80 80 0 0 1 180 100" 
                        fill="none" 
                        stroke="var(--accent)" 
                        strokeWidth="10" 
                        strokeDasharray={circumference} 
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                    />
                </svg>
                <div className="gauge-overlay">
                    <h1 className="timer-text">{timer}</h1>
                    <span className="status-badge" style={{
                        backgroundColor: status?.check_in && !status?.check_out ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                        color: status?.check_in && !status?.check_out ? '#10b981' : '#94a3b8'
                    }}>
                        {status?.check_in && !status?.check_out ? 'IN SESSION' : 'OFF DUTY'}
                    </span>
                </div>
            </div>

            <div className="stats-mini-grid">
                <div className="stat-mini-item">
                    <div className="stat-icon-small" style={{background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b'}}>
                        <TrendingUp size={14} />
                    </div>
                    <div>
                        <p className="stat-val">{stats.todayHours}h</p>
                        <p className="stat-lbl">Today</p>
                    </div>
                </div>
                <div className="stat-mini-item">
                    <div className="stat-icon-small" style={{background: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}}>
                        <Calendar size={14} />
                    </div>
                    <div>
                        <p className="stat-val">{stats.monthHours}h</p>
                        <p className="stat-lbl">This Month</p>
                    </div>
                </div>
            </div>

            <div className="on-time-stat" style={{ marginTop: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="stat-lbl" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>On-Time Arrival (≤ 10:00 AM)</span>
                    <span className="stat-val" style={{ fontSize: '0.85rem' }}>
                        {stats.daysPresent > 0 ? Math.round((stats.onTimeDays / stats.daysPresent) * 100) : 0}%
                    </span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--card-border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                        width: `${stats.daysPresent > 0 ? (stats.onTimeDays / stats.daysPresent) * 100 : 0}%`, 
                        height: '100%', 
                        background: '#10b981', 
                        transition: 'width 0.8s ease-in-out' 
                    }}></div>
                </div>
            </div>
            <button 
                onClick={handleAction} 
                disabled={loading}
                className="btn-primary tap-button" 
                style={{
                    backgroundColor: status?.check_in && !status?.check_out ? '#f43f5e' : 'var(--accent)'
                }}
            >
                {status?.check_in && !status?.check_out ? (
                    <><Square size={18} /> TAP OUT</>
                ) : (
                    <><Play size={18} /> TAP IN</>
                )}
            </button>
        </div>
    );
};

export default AttendanceCard;

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

    const onTimePercent = stats.daysPresent > 0 ? Math.round((stats.onTimeDays / stats.daysPresent) * 100) : 0;

    return (
        <div className="glass-card attendance-control-card" style={{ padding: '1.25rem', marginBottom: '0.5rem', transition: 'all 0.3s ease' }}>
            <style>{`
                .attendance-horizontal {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 1.5rem;
                    flex-wrap: wrap;
                }
                .attendance-left {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    flex: 1.2;
                    min-width: 240px;
                }
                .attendance-middle {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-width: 160px;
                    border-left: 1px solid var(--card-border);
                    border-right: 1px solid var(--card-border);
                    padding: 0 1.5rem;
                }
                .attendance-right {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    flex: 1.5;
                    min-width: 260px;
                }
                .horizontal-timer {
                    font-size: 2rem;
                    font-weight: 800;
                    letter-spacing: -1px;
                    line-height: 1;
                    margin-bottom: 0.25rem;
                    font-family: monospace;
                }
                .stats-mini-flex {
                    display: flex;
                    gap: 1.25rem;
                }
                .stat-mini-row {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                @media (max-width: 768px) {
                    .attendance-middle {
                        border-left: none;
                        border-right: none;
                        padding: 1rem 0;
                    }
                }
            `}</style>

            <div className="attendance-horizontal">
                {/* Left Side: Header & Action Button */}
                <div className="attendance-left">
                    <div>
                        <h3 className="heading-sm" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Clock size={16} className="text-indigo-500" />
                            Attendance Control
                        </h3>
                        <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.15rem' }}>Track productivity & check session logs</p>
                    </div>
                    <button 
                        onClick={handleAction} 
                        disabled={loading}
                        className="btn-primary tap-button" 
                        style={{
                            backgroundColor: status?.check_in && !status?.check_out ? '#f43f5e' : 'var(--accent)',
                            padding: '0.6rem 1.25rem',
                            fontSize: '0.85rem',
                            height: '38px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            borderRadius: '0.5rem',
                            width: '100%',
                            maxWidth: '220px'
                        }}
                    >
                        {status?.check_in && !status?.check_out ? (
                            <><Square size={16} /> TAP OUT</>
                        ) : (
                            <><Play size={16} /> TAP IN</>
                        )}
                    </button>
                </div>

                {/* Middle Side: Live Timer */}
                <div className="attendance-middle">
                    <h1 className="horizontal-timer">{timer}</h1>
                    <span className="status-badge" style={{
                        backgroundColor: status?.check_in && !status?.check_out ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                        color: status?.check_in && !status?.check_out ? '#10b981' : '#94a3b8',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '0.4rem',
                        fontSize: '0.7rem',
                        fontWeight: 700
                    }}>
                        {status?.check_in && !status?.check_out ? 'IN SESSION' : 'OFF DUTY'}
                    </span>
                </div>

                {/* Right Side: Key Productivity metrics */}
                <div className="attendance-right">
                    <div className="stats-mini-flex">
                        <div className="stat-mini-row">
                            <div className="stat-icon-small" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '0.3rem', borderRadius: '0.35rem' }}>
                                <TrendingUp size={12} />
                            </div>
                            <div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', lineHeight: 1.1 }}>{stats.todayHours}h</span>
                                <span className="text-muted" style={{ fontSize: '0.7rem' }}>Today</span>
                            </div>
                        </div>
                        <div className="stat-mini-row">
                            <div className="stat-icon-small" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.3rem', borderRadius: '0.35rem' }}>
                                <Calendar size={12} />
                            </div>
                            <div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', lineHeight: 1.1 }}>{stats.monthHours}h</span>
                                <span className="text-muted" style={{ fontSize: '0.7rem' }}>This Month</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span className="text-muted" style={{ fontSize: '0.7rem' }}>On-Time Arrival (≤ 10:00 AM)</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{onTimePercent}%</span>
                        </div>
                        <div style={{ width: '100%', height: '5px', background: 'var(--card-border)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ 
                                width: `${onTimePercent}%`, 
                                height: '100%', 
                                background: '#10b981', 
                                transition: 'width 0.8s ease-in-out' 
                            }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceCard;

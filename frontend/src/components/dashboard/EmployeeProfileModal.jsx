import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    X, Star, CheckCircle, Clock, Calendar, 
    Award, Mail, Shield, User, MapPin
} from 'lucide-react';
import '../../styles/UI.css';

const EmployeeProfileModal = ({ employeeId, onClose }) => {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get(`/api/employees/${employeeId}/profile`);
                setProfileData(response.data);
            } catch (error) {
                console.error("Failed to fetch profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [employeeId]);

    if (loading) {
        return (
            <div className="modal-overlay">
                <div className="glass-card modal-content" style={{ maxWidth: '600px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="loading" style={{ opacity: 0.5 }}>Fetching employee data...</div>
                </div>
            </div>
        );
    }

    if (!profileData) return null;

    const { profile, stats } = profileData;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="glass-card modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', padding: 0, overflow: 'hidden' }}>
                
                <div style={{ background: 'var(--accent-glow)', padding: '2rem 2.5rem', position: 'relative', display: 'flex', gap: '1.5rem', alignItems: 'center', borderBottom: '1px solid var(--card-border)' }}>
                    <button className="modal-close-btn" onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
                        <X size={20} />
                    </button>
                    
                    <div className="avatar-circle" style={{ width: '5rem', height: '5rem', fontSize: '2rem', boxShadow: '0 10px 25px -5px var(--accent-glow)' }}>
                        {profile.profile_photo ? (
                            <img src={profile.profile_photo} alt={profile.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            profile.name.charAt(0)
                        )}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <h2 className="heading-lg" style={{ marginBottom: 0 }}>{profile.name}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            <Mail size={14} /> {profile.email}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <span className="badge" style={{ backgroundColor: profile.role === 'manager' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(148, 163, 184, 0.1)', color: profile.role === 'manager' ? '#6366f1' : 'inherit' }}>
                                <Shield size={12} style={{ display: 'inline', marginRight: '0.25rem' }}/>
                                {profile.role.toUpperCase()}
                            </span>
                            <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                                Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="stat-mini-item" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                                <Clock size={16} /> <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Today's Activity</span>
                            </div>
                            {stats.attendance_today.tap_in ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                                        <span style={{ fontWeight: 600 }}>In: {new Date(stats.attendance_today.tap_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    {stats.attendance_today.tap_out && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.7 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f43f5e', boxShadow: '0 0 10px #f43f5e' }}></div>
                                            <span>Out: {new Date(stats.attendance_today.tap_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <span className="text-muted" style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>Not clocked in yet.</span>
                            )}
                            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--card-border)', width: '100%', fontSize: '0.85rem' }}>
                                <span style={{ color: stats.late_tap_ins > 0 ? '#ef4444' : 'var(--text-secondary)' }}>
                                    <strong>{stats.late_tap_ins}</strong> Late Tap-Ins
                                </span>
                            </div>
                        </div>

                        <div className="stat-mini-item" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                <Calendar size={16} /> <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Time Off</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                <span style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.leaves_taken}</span>
                                <span className="text-muted" style={{ fontSize: '0.8rem' }}>leaves taken</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                        <div className="stat-mini-item" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                <CheckCircle size={16} /> <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Task Completion</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.tasks.completed}</span>
                                <span className="text-muted" style={{ fontSize: '0.8rem' }}>/ {stats.tasks.total} done</span>
                            </div>
                            <div style={{ width: '100%', height: 6, background: 'var(--bg-main)', borderRadius: 10, overflow: 'hidden', marginBottom: '0.75rem' }}>
                                <div style={{ 
                                    height: '100%', 
                                    background: 'var(--accent)', 
                                    width: `${stats.tasks.total > 0 ? (stats.tasks.completed / stats.tasks.total) * 100 : 0}%`,
                                    transition: 'width 1s ease-out'
                                }}></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <span><span style={{ color: '#10b981', fontWeight: 600 }}>{stats.tasks.on_time}</span> On-Time</span>
                                <span><span style={{ color: '#ef4444', fontWeight: 600 }}>{stats.tasks.late}</span> Late</span>
                            </div>
                        </div>

                        <div className="stat-mini-item" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                <Award size={16} /> <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Recognition</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>{stats.points}</span>
                                <span className="text-muted" style={{ fontSize: '0.8rem' }}>points earned</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EmployeeProfileModal;

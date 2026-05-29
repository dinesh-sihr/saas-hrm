import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BarChart3, Users, ChevronRight, Sparkles, Building2 } from 'lucide-react';
import '../../styles/UI.css';

const AnalyticsPreview = () => {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPreview = async () => {
            try {
                const res = await axios.get('/api/attendance/drilldown');
                if (res.data && res.data.departments) {
                    setDepartments(res.data.departments);
                }
            } catch (err) {
                console.error("Error loading analytics preview:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPreview();
    }, []);

    const handleRedirect = () => {
        navigate('/analytics');
    };

    if (loading) {
        return (
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 className="heading-sm" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart3 size={18} className="text-indigo-500" />
                        Interactive Analytics Drilldown
                    </h3>
                </div>
                <div className="spinner" style={{ borderTopColor: '#6366f1', margin: '1rem auto' }}></div>
            </div>
        );
    }

    return (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', transition: 'all 0.3s ease' }}>
            <style>{`
                .preview-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 1rem;
                    margin-top: 1rem;
                }
                .preview-dept-card {
                    padding: 1.25rem;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid var(--card-border);
                    border-radius: 1rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .preview-dept-card:hover {
                    transform: translateY(-2px);
                    background: rgba(255, 255, 255, 0.04);
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
                }
                .preview-progress-bg {
                    width: 100%;
                    height: 6px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 3px;
                    overflow: hidden;
                    margin-top: 0.75rem;
                }
                .preview-progress-bar {
                    height: 100%;
                    border-radius: 3px;
                    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div>
                    <h3 className="heading-sm" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building2 size={18} className="text-indigo-500" />
                        Interactive Analytics Drilldown
                    </h3>
                    <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.15rem' }}>
                        Real-time department rosters and itemized daily attendance logs
                    </p>
                </div>
                <button 
                    onClick={handleRedirect} 
                    className="badge-premium" 
                    style={{ 
                        background: 'rgba(99, 102, 241, 0.1)', 
                        color: '#6366f1', 
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.75rem'
                    }}
                >
                    <Sparkles size={12} /> Explore Dashboard <ChevronRight size={12} />
                </button>
            </div>

            <div className="preview-grid">
                {departments.map((dept) => (
                    <div key={dept.id} className="preview-dept-card" onClick={handleRedirect} style={{ borderLeft: `3px solid ${dept.color}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{dept.name}</span>
                            <span style={{ color: dept.color, fontWeight: 700, fontSize: '0.85rem' }}>{dept.attendance}%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                            <Users size={12} className="text-muted" />
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>{dept.totalMembers} active members</span>
                        </div>
                        <div className="preview-progress-bg">
                            <div 
                                className="preview-progress-bar" 
                                style={{ width: `${dept.attendance}%`, backgroundColor: dept.color }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AnalyticsPreview;

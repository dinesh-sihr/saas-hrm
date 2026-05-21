import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Zap, TrendingUp, TrendingDown, ChevronRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/UI.css';

const BehavioralMap = () => {
    const { user } = useAuth();
    const isManager = user?.role === 'manager' || user?.role === 'admin';
    
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const endpoint = isManager ? '/api/ai/team-aggregate' : '/api/ai/insights';
                const res = await axios.get(endpoint);
                setData(res.data);
            } catch (err) {
                console.error('Failed to load behavioral map:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, [isManager]);

    if (loading) return (
        <div className="glass-card" style={{padding: '2rem', textAlign: 'center'}}>
            <p className="text-label animate-pulse">Mapping behavioral patterns...</p>
        </div>
    );
    
    if (!data) return null;

    const behavioralMap = data?.behavioral?.map || [];
    
    const getRadarPoints = (stats, size, scale) => {
        const center = size / 2;
        const angleStep = (Math.PI * 2) / stats.length;
        return stats.map((s, i) => {
            const r = (s.A / 100) * scale;
            const x = center + r * Math.cos(i * angleStep - Math.PI / 2);
            const y = center + r * Math.sin(i * angleStep - Math.PI / 2);
            return `${x},${y}`;
        }).join(' ');
    };

    return (
        <div className="glass-card" style={{
            padding: 'clamp(1rem, 5vw, 2rem)', 
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.1)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'clamp(1rem, 5vw, 2rem)',
            flexWrap: 'wrap'
        }}>
            <div style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: 'clamp(1.5rem, 5vw, 3rem)', 
                flex: 1, 
                minWidth: '280px',
                flexWrap: 'wrap',
                justifyContent: 'center'
            }}>
                <div style={{position: 'relative', width: '120px', height: '120px', flexShrink: 0}}>
                    <svg width="120" height="120" style={{filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.2))'}}>
                        <polygon points={getRadarPoints(behavioralMap.map(s => ({ ...s, A: 100 })), 120, 50)} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                        <polygon points={getRadarPoints(behavioralMap, 120, 50)} fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" strokeWidth="2" />
                    </svg>
                    {behavioralMap.map((s, i) => {
                        const angle = (i * (Math.PI * 2)) / behavioralMap.length - Math.PI / 2;
                        const x = 60 + 58 * Math.cos(angle);
                        const y = 60 + 58 * Math.sin(angle);
                        return <span key={i} style={{position: 'absolute', left: x, top: y, fontSize: '0.5rem', transform: 'translate(-50%, -50%)', opacity: 0.5, whiteSpace: 'nowrap', fontWeight: 700}}>{s.subject}</span>
                    })}
                </div>
                <div style={{textAlign: 'center', flex: 1, minWidth: '240px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', justifyContent: 'center'}}>
                        <Star size={14} className="text-accent" fill="currentColor" />
                        <span className="badge good" style={{fontSize: '0.65rem', padding: '0.2rem 0.6rem'}}>AI Profile</span>
                    </div>
                    <h2 className="heading-md" style={{margin: 0, color: 'var(--accent)', fontSize: 'clamp(1.2rem, 4vw, 1.5rem)'}}>{data?.behavioral?.type || 'Reliable Performer'}</h2>
                    <p style={{fontSize: '0.85rem', opacity: 0.7, margin: '0.5rem 0 0', lineHeight: 1.4, maxWidth: '450px'}}>
                        "{data.aiSummary?.substring(0, 100)}..."
                    </p>
                </div>
            </div>

            <div style={{display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '400px', margin: '0 auto'}}>
                <div style={{flex: 1, textAlign: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', minWidth: '80px'}}>
                    <h3 style={{margin: 0, fontSize: '1.1rem', color: '#10b981', fontWeight: 800}}>{data?.behavioral?.collaboration || 0}</h3>
                    <p className="text-label" style={{fontSize: '0.5rem', margin: 0, opacity: 0.5}}>COLLAB</p>
                </div>
                <div style={{flex: 1, textAlign: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', minWidth: '80px'}}>
                    <h3 style={{margin: 0, fontSize: '1.1rem', color: 'var(--accent)', fontWeight: 800}}>{data?.behavioral?.coordination || 0}</h3>
                    <p className="text-label" style={{fontSize: '0.5rem', margin: 0, opacity: 0.5}}>COORD</p>
                </div>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.5rem'}}>
                    <Link to="/behavioral-iq" className="btn-icon edit" style={{width: '2.5rem', height: '2.5rem'}} title="View Behavioral Guide">
                        <ChevronRight size={18} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default BehavioralMap;

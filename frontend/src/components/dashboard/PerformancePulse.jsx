import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Zap, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/UI.css';

const PerformancePulse = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('/api/ai/insights');
                setStats(res.data);
            } catch (err) {
                console.error('Failed to load pulse:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return null;
    if (!stats) return null;

    const { trend } = stats;
    const isImproved = trend.status === 'improved';

    return (
        <div className="glass-card" style={{
            padding: '1.25rem', 
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.1)'
        }}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                    <div className="stat-icon-box" style={{backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', width: '2rem', height: '2rem'}}>
                        <Zap size={16} />
                    </div>
                    <h4 className="heading-sm" style={{fontSize: '0.85rem', margin: 0}}>Performance Pulse</h4>
                </div>
                <Link to="/ai-insights" className="text-btn" style={{fontSize: '0.7rem', display: 'flex', alignItems: 'center'}}>
                    Details <ChevronRight size={12} />
                </Link>
            </div>

            <div style={{display: 'flex', alignItems: 'baseline', gap: '0.5rem'}}>
                <h2 style={{fontSize: '1.75rem', fontWeight: 800, margin: 0, color: isImproved ? '#10b981' : '#f43f5e'}}>
                    {isImproved ? '+' : '-'}{Math.abs(trend.value)}%
                </h2>
                <span style={{fontSize: '0.75rem', opacity: 0.6, fontWeight: 600}}>this week</span>
            </div>
            
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem', color: isImproved ? '#10b981' : '#f43f5e'}}>
                {isImproved ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>Performance {trend.status}</span>
            </div>

            <p style={{fontSize: '0.7rem', opacity: 0.5, marginTop: '1rem', lineHeight: 1.4}}>
                Based on your task speed and attendance consistency vs. last week.
            </p>
        </div>
    );
};

export default PerformancePulse;

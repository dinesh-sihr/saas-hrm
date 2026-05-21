import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Clock, User, LogIn, LogOut, Calendar, 
    CheckCircle2, Megaphone, Video 
} from 'lucide-react';
import '../../styles/Dashboard.css';
import '../../styles/UI.css';

const ActivityFeed = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchActivities = async () => {
        try {
            const res = await axios.get('/api/stats/activities');
            setActivities(res.data);
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
        const interval = setInterval(fetchActivities, 30000);
        return () => clearInterval(interval);
    }, []);

    const getIcon = (status) => {
        switch(status) {
            case 'Arrival': return <LogIn size={16} />;
            case 'Departure': return <LogOut size={16} />;
            case 'Leave Request':
            case 'Leave Update': return <Calendar size={16} />;
            case 'Task Assigned':
            case 'Task Done': return <CheckCircle2 size={16} />;
            case 'Company Update': return <Megaphone size={16} />;
            case 'Meeting Sync':
            case 'Call Started': return <Video size={16} />;
            default: return <Clock size={16} />;
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return <div className="activity-feed glass-card" style={{padding: '2rem'}}>Loading pulse...</div>;

    return (
        <div className="activity-feed glass-card" style={{padding: '2rem'}}>
            <div className="feed-header" style={{marginBottom: '1.5rem'}}>
                <div>
                    <h3 className="heading-md">Recent Activity</h3>
                    <p className="text-label" style={{textTransform: 'none', fontSize: '0.75rem'}}>Real-time company pulse</p>
                </div>
                <div className="status-badge" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 700, color: '#10b981'}}>
                    <div className="pulse-dot"></div>
                    LIVE
                </div>
            </div>
            
            <div className="activity-list" style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
                {activities.length > 0 ? (
                    activities.map((item) => (
                        <div key={item.id} className="activity-row" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                                <div className="stat-icon-box" style={{
                                    width: '2.5rem', 
                                    height: '2.5rem', 
                                    backgroundColor: `${item.color}15`, 
                                    color: item.color,
                                    borderRadius: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {getIcon(item.status)}
                                </div>
                                <div className="activity-text">
                                    <p style={{fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem'}}>
                                        {item.user_name || 'System'} <span style={{fontWeight: 400, opacity: 0.7}}>{item.action}</span>
                                    </p>
                                    <span style={{fontSize: '0.75rem', opacity: 0.5}}>Today at {formatTime(item.created_at)}</span>
                                </div>
                            </div>
                            <span className="badge" style={{
                                color: item.color, 
                                backgroundColor: `${item.color}10`,
                                fontSize: '0.65rem',
                                border: `1px solid ${item.color}20`
                            }}>
                                {item.status}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="empty-state" style={{textAlign: 'center', padding: '2rem', opacity: 0.5}}>
                        <Clock size={32} style={{marginBottom: '1rem', opacity: 0.3}} />
                        <p>Waiting for team activity...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityFeed;

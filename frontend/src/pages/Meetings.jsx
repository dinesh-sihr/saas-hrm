import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Video, Plus, Clock, Users, CheckCircle2, 
    Calendar, X, MoreVertical, ExternalLink 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/UI.css';

const Meetings = () => {
    const { user } = useAuth();
    const isManager = user?.role === 'manager' || user?.role === 'admin';
    
    const [meetings, setMeetings] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        scheduled_at: '',
        participantIds: []
    });

    const fetchData = async () => {
        try {
            const [meetingsRes, employeesRes] = await Promise.all([
                axios.get('/api/meetings'),
                isManager ? axios.get('/api/employees') : Promise.resolve({ data: [] })
            ]);
            setMeetings(meetingsRes.data);
            setEmployees(employeesRes.data);
        } catch (error) {
            console.error('Error fetching meetings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/meetings', formData);
            setShowModal(false);
            setFormData({ title: '', scheduled_at: '', participantIds: [] });
            fetchData();
        } catch (error) {
            alert('Failed to schedule meeting');
        }
    };

    const handleJoin = async (id) => {
        try {
            await axios.post(`/api/meetings/${id}/join`);
            fetchData();
            window.open('https://meet.google.com/new', '_blank');
        } catch (error) {
            console.error('Join failed');
        }
    };

    const toggleParticipant = (id) => {
        setFormData(prev => ({
            ...prev,
            participantIds: prev.participantIds.includes(id)
                ? prev.participantIds.filter(pid => pid !== id)
                : [...prev.participantIds, id]
        }));
    };

    if (loading) return <div className="empty-state">Syncing meeting calendar...</div>;

    return (
        <div className="dashboard-container">
            <div className="feed-header" style={{marginBottom: '2rem'}}>
                <div>
                    <h1 className="heading-lg">Collaboration Hub</h1>
                    <p className="text-label" style={{textTransform: 'none'}}>Sync up with your team for better productivity</p>
                </div>
                {isManager && (
                    <button onClick={() => setShowModal(true)} className="btn-primary" style={{width: 'auto', padding: '0 1.5rem'}}>
                        <Plus size={18} />
                        <span>Schedule Sync</span>
                    </button>
                )}
            </div>

            <div className="glass-table-container">
                <table className="glass-table">
                    <thead>
                        <tr>
                            <th>Meeting Title</th>
                            <th>Scheduled For</th>
                            <th>Participants</th>
                            <th>Status</th>
                            <th style={{textAlign: 'right'}}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {meetings.length > 0 ? (
                            meetings.map((m) => (
                                <tr key={m.id}>
                                    <td>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                            <div className="stat-icon-box" style={{backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)', width: '2rem', height: '2rem'}}>
                                                <Video size={14} />
                                            </div>
                                            <span style={{fontWeight: 700}}>{m.title}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{display: 'flex', flexDirection: 'column'}}>
                                            <span style={{fontSize: '0.9rem', fontWeight: 600}}>{new Date(m.scheduled_at).toLocaleDateString()}</span>
                                            <span style={{fontSize: '0.75rem', opacity: 0.6}}>{new Date(m.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                            <Users size={14} style={{opacity: 0.5}} />
                                            <span>{m.participant_count} people</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${m.user_status === 'attended' ? 'good' : ''}`} style={{
                                            backgroundColor: m.user_status === 'attended' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                                            color: m.user_status === 'attended' ? '#10b981' : 'inherit'
                                        }}>
                                            {m.user_status === 'attended' ? 'Attended' : 'Upcoming'}
                                        </span>
                                    </td>
                                    <td style={{textAlign: 'right'}}>
                                        <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                                            <button 
                                                onClick={() => handleJoin(m.id)} 
                                                className="btn-primary" 
                                                style={{width: 'auto', padding: '0.4rem 1rem', fontSize: '0.8rem'}}
                                                disabled={m.user_status === 'attended'}
                                            >
                                                <ExternalLink size={14} />
                                                <span>{m.user_status === 'attended' ? 'View Details' : 'Join Now'}</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{textAlign: 'center', padding: '4rem', opacity: 0.5}}>
                                    No meetings scheduled yet. Use the button above to create one.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '500px', width: '90%'}}>
                        <div className="feed-header">
                            <h3 className="heading-md">Schedule New Sync</h3>
                            <button onClick={() => setShowModal(false)} className="btn-icon"><X size={18} /></button>
                        </div>

                        <form onSubmit={handleCreate} className="auth-form" style={{marginTop: '1.5rem'}}>
                            <div className="field-wrapper">
                                <label className="input-label">Meeting Title</label>
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    placeholder="e.g. Weekly Product Sync" 
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    required 
                                />
                            </div>

                            <div className="field-wrapper">
                                <label className="input-label">Scheduled Time</label>
                                <input 
                                    type="datetime-local" 
                                    className="input-field" 
                                    value={formData.scheduled_at}
                                    onChange={(e) => setFormData({...formData, scheduled_at: e.target.value})}
                                    required 
                                />
                            </div>

                            <div className="field-wrapper">
                                <label className="input-label">Invite Participants</label>
                                <div style={{maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem'}}>
                                    {employees.map(emp => (
                                        <div 
                                            key={emp.id} 
                                            onClick={() => toggleParticipant(emp.id)}
                                            style={{
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '0.75rem', 
                                                padding: '0.5rem', 
                                                borderRadius: '0.5rem',
                                                cursor: 'pointer',
                                                backgroundColor: formData.participantIds.includes(emp.id) ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                                border: formData.participantIds.includes(emp.id) ? '1px solid var(--accent)' : '1px solid transparent'
                                            }}
                                        >
                                            <div className="avatar-circle-sm" style={{width: '1.5rem', height: '1.5rem'}}>{emp.name[0]}</div>
                                            <span style={{fontSize: '0.85rem'}}>{emp.name}</span>
                                            {formData.participantIds.includes(emp.id) && <CheckCircle2 size={14} style={{marginLeft: 'auto', color: 'var(--accent)'}} />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="btn-primary" style={{marginTop: '1rem'}}>
                                Send Invites
                                <Video size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Meetings;

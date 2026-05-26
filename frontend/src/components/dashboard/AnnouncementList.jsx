import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Megaphone, Plus, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Dashboard.css';
import '../../styles/UI.css';

const AnnouncementList = () => {
    const { user } = useAuth();
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newNotice, setNewNotice] = useState({ title: '', description: '', tag: 'Update' });

    const fetchNotices = async () => {
        try {
            const response = await axios.get('/api/announcements');
            setNotices(response.data);
        } catch (error) {
            console.error('Error fetching notices:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotices();
    }, []);

    const handleAddNotice = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/announcements', newNotice);
            setNewNotice({ title: '', description: '', tag: 'Update' });
            setShowAddModal(false);
            fetchNotices();
        } catch (error) {
            alert('Failed to add notice');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this notice?')) return;
        try {
            await axios.delete(`/api/announcements/${id}`);
            fetchNotices();
        } catch (error) {
            alert('Failed to delete');
        }
    };

    return (
        <>
            <div className="glass-card" style={{padding: '2rem', height: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
                    <h3 className="heading-md">Notices</h3>
                    {user.role === 'manager' && (
                        <button onClick={() => setShowAddModal(true)} className="add-btn-small">
                            <Plus size={16} />
                        </button>
                    )}
                </div>

                <div className="notice-list" style={{flex: 1, overflowY: 'auto'}}>
                    {loading ? (
                        <div style={{display: 'flex', justifyContent: 'center', padding: '2rem'}}>
                            <Loader2 className="animate-spin" />
                        </div>
                    ) : notices.length > 0 ? (
                        notices.map(notice => (
                            <div key={notice.id} style={{position: 'relative', marginBottom: '2rem'}}>
                                <NoticeItem 
                                    tag={notice.tag} 
                                    title={notice.title} 
                                    content={notice.description} 
                                    onInteraction={() => axios.post(`/api/announcements/${notice.id}/read`).catch(() => {})}
                                />
                                {user.role === 'manager' && (
                                    <button 
                                        onClick={() => handleDelete(notice.id)}
                                        className="delete-notice-icon"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">No announcements yet.</div>
                    )}
                </div>
            </div>

            {showAddModal && (
                <div className="modal-overlay">
                    <div className="glass-card modal-content" style={{maxWidth: '600px', width: '95%', padding: '3.5rem', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.4)'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem'}}>
                            <div>
                                <h2 className="heading-lg" style={{marginBottom: '0.5rem'}}>New Announcement</h2>
                                <p className="text-label" style={{textTransform: 'none', fontSize: '0.85rem', opacity: 0.7}}>Draft a message to share with the entire organization.</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="btn-icon" style={{backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '1rem'}}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddNotice} style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
                            <div className="field-wrapper">
                                <label className="input-label" style={{fontSize: '0.75rem', marginBottom: '0.75rem'}}>Headline</label>
                                <input 
                                    className="input-field" 
                                    style={{height: '3.5rem', fontSize: '1rem', padding: '0 1.5rem'}}
                                    required
                                    value={newNotice.title}
                                    onChange={e => setNewNotice({...newNotice, title: e.target.value})}
                                    placeholder="e.g. Monthly All-Hands Meeting"
                                />
                            </div>

                            <div className="field-wrapper">
                                <label className="input-label" style={{fontSize: '0.75rem', marginBottom: '0.75rem'}}>Notice Category</label>
                                <select 
                                    className="input-field"
                                    style={{height: '3.5rem', fontSize: '0.95rem', appearance: 'none', padding: '0 1.5rem'}}
                                    value={newNotice.tag}
                                    onChange={e => setNewNotice({...newNotice, tag: e.target.value})}
                                >
                                    <option value="Update"> General Update</option>
                                    <option value="Holiday"> Holiday Notice</option>
                                    <option value="Event"> Company Event</option>
                                    <option value="Reminder"> Urgent Reminder</option>
                                </select>
                            </div>

                            <div className="field-wrapper">
                                <label className="input-label" style={{fontSize: '0.75rem', marginBottom: '0.75rem'}}>Detailed Message</label>
                                <textarea 
                                    className="input-field" 
                                    style={{height: 'auto', minHeight: '140px', padding: '1.25rem', fontSize: '1rem', lineHeight: '1.6'}}
                                    rows="4"
                                    required
                                    value={newNotice.description}
                                    onChange={e => setNewNotice({...newNotice, description: e.target.value})}
                                    placeholder="Type your announcement details here..."
                                />
                            </div>
                            
                            <button type="submit" className="btn-primary" style={{marginTop: '1rem', height: '4rem', fontSize: '1.1rem', borderRadius: '1.25rem'}}>
                                <span>Publish Announcement</span>
                                <Megaphone size={20} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

const NoticeItem = ({ tag, title, content, onInteraction }) => {
    const getTagStyles = () => {
        switch(tag) {
            case 'Holiday': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' };
            case 'Reminder': return { bg: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' };
            case 'Event': return { bg: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' };
            default: return { bg: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' };
        }
    };
    const styles = getTagStyles();

    return (
        <div className="notice-card" onMouseEnter={onInteraction} style={{
            padding: '1.25rem', 
            borderRadius: '1.25rem',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            border: '1px solid rgba(255,255,255,0.05)',
            transition: 'all 0.3s ease'
        }}>
            <div style={{display: 'flex', gap: '1rem'}}>
                <div style={{
                    width: '3rem', 
                    height: '3rem', 
                    borderRadius: '1rem', 
                    backgroundColor: styles.bg, 
                    color: styles.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    <Megaphone size={20} />
                </div>
                <div style={{flex: 1}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem'}}>
                        <span style={{
                            fontSize: '0.6rem', 
                            fontWeight: 900, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.1em',
                            color: styles.color,
                            backgroundColor: styles.bg,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '0.5rem'
                        }}>{tag}</span>
                    </div>
                    <h4 style={{fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)'}}>{title}</h4>
                    <p style={{fontSize: '0.8rem', opacity: 0.5, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
                        {content}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementList;

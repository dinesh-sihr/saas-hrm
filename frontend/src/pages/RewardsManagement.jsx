import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Star, Plus, Search, Trash2, X, Check,
    Trophy, Heart, Award, Sparkles, MessageCircle, Calendar, User
} from 'lucide-react';
import Pagination from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import '../styles/UI.css';

const RewardsManagement = () => {
    const { user } = useAuth();
    const isManager = user?.role === 'manager' || user?.role === 'admin';
    
    const [rewards, setRewards] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        user_id: '',
        reward_type: 'Star Appreciation',
        points: '10',
        message: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const fetchData = async () => {
        try {
            const [rewardsRes, employeesRes] = await Promise.all([
                axios.get('/api/rewards'),
                isManager ? axios.get('/api/employees') : Promise.resolve({ data: [] })
            ]);
            setRewards(rewardsRes.data);
            setEmployees(employeesRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/rewards', formData);
            fetchData();
            setIsModalOpen(false);
            setFormData({
                user_id: '',
                reward_type: 'Star Appreciation',
                points: '10',
                message: ''
            });
        } catch (error) {
            alert('Failed to send appreciation');
        }
    };

    const getRewardIcon = (type) => {
        const t = type.toLowerCase();
        if (t.includes('star')) return <Star className="text-yellow-500" size={24} fill="#eab308" />;
        if (t.includes('trophy') || t.includes('month')) return <Trophy className="text-orange-500" size={24} />;
        if (t.includes('heart') || t.includes('kindness')) return <Heart className="text-red-500" size={24} fill="#ef4444" />;
        return <Award className="text-blue-500" size={24} />;
    };

    if (loading) return <div className="empty-state">Loading hall of fame...</div>;

    return (
        <div className="dashboard-container">
            <div className="feed-header" style={{marginBottom: '2rem'}}>
                <div>
                    <h1 className="heading-lg">{isManager ? 'Rewards & Appreciation' : 'My Hall of Fame'}</h1>
                    <p className="text-label" style={{textTransform: 'none'}}>Celebrating excellence and core values</p>
                </div>
                {isManager && (
                    <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{width: 'auto', padding: '0 1.5rem'}}>
                        <Plus size={18} />
                        <span>Send Appreciation</span>
                    </button>
                )}
            </div>

            <div className="glass-table-container">
                <table className="glass-table">
                    <thead>
                        <tr>
                            <th>Recipient</th>
                            <th>Recognition Type</th>
                            <th>Points</th>
                            <th>Message</th>
                            <th>Date</th>
                            <th>Sender</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rewards.length > 0 ? (
                            rewards.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((r) => (
                                <tr key={r.id}>
                                    <td>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                            <div className="avatar-circle" style={{width: '2rem', height: '2rem'}}>
                                                {r.employee_name[0]}
                                            </div>
                                            <span style={{fontWeight: 600}}>{r.employee_name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                            {getRewardIcon(r.reward_type)}
                                            <span>{r.reward_type}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge" style={{backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}}>
                                            +{r.points}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.7}} title={r.message}>
                                            {r.message || "Keep up the great work!"}
                                        </div>
                                    </td>
                                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.8}}>
                                            <User size={14} />
                                            {r.sender_name || 'System'}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={{textAlign: 'center', padding: '3rem', opacity: 0.5}}>
                                    No appreciations recorded yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {rewards.length > itemsPerPage && (
                <div style={{marginTop: '1.5rem'}}>
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={Math.ceil(rewards.length / itemsPerPage)}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '500px', width: '90%'}}>
                        <div className="feed-header">
                            <h3 className="heading-md">Send Appreciation</h3>
                            <button onClick={() => setIsModalOpen(false)} className="btn-icon"><X size={18} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="auth-form" style={{marginTop: '1.5rem'}}>
                            <div className="field-wrapper">
                                <label className="input-label">Select Employee</label>
                                <select className="input-field" style={{paddingLeft: '1rem'}} value={formData.user_id} onChange={(e) => setFormData({...formData, user_id: e.target.value})} required>
                                    <option value="">Choose someone to recognize...</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="field-wrapper">
                                <label className="input-label">Recognition Type</label>
                                <select className="input-field" style={{paddingLeft: '1rem'}} value={formData.reward_type} onChange={(e) => setFormData({...formData, reward_type: e.target.value})}>
                                    <option value="Star Appreciation">🌟 Star Appreciation</option>
                                    <option value="Employee of the Month">🏆 Employee of the Month</option>
                                    <option value="Outstanding Performance">🔥 Outstanding Performance</option>
                                    <option value="Team Player">🤝 Team Player</option>
                                    <option value="Exceptional Kindness">❤️ Exceptional Kindness</option>
                                </select>
                            </div>

                            <div className="field-wrapper">
                                <label className="input-label">Points to Award</label>
                                <input type="number" className="input-field" value={formData.points} onChange={(e) => setFormData({...formData, points: e.target.value})} />
                            </div>

                            <div className="field-wrapper">
                                <label className="input-label">Appreciation Message</label>
                                <textarea 
                                    className="input-field" 
                                    style={{minHeight: '100px', paddingTop: '10px'}}
                                    value={formData.message} 
                                    onChange={(e) => setFormData({...formData, message: e.target.value})} 
                                    placeholder="Tell them why they're awesome..."
                                    required 
                                />
                            </div>

                            <button type="submit" className="btn-primary" style={{marginTop: '1rem'}}>
                                Send Recognition
                                <Check size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RewardsManagement;

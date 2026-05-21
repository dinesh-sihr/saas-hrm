import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, CheckCircle2, AlertCircle, Clock, UserCheck, X } from 'lucide-react';
import '../../styles/Dashboard.css';
import '../../styles/UI.css';

const SmartTracking = () => {
    const [trackingData, setTrackingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);
    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        priority: 'medium',
        due_date: new Date().toISOString().split('T')[0]
    });

    const fetchData = async () => {
        try {
            const response = await axios.get('/api/tasks/tracking');
            setTrackingData(response.data);
        } catch (error) {
            console.error('Tracking Data Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleSelection = (id) => {
        setSelectedMemberIds(prev => 
            prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
        );
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        if (selectedMemberIds.length === 0) return alert('Select at least one member');
        
        try {
            await axios.post('/api/tasks/assign', {
                ...taskForm,
                assigned_to: selectedMemberIds.length === 1 ? selectedMemberIds[0] : selectedMemberIds
            });
            setShowTaskModal(false);
            setSelectedMemberIds([]);
            setTaskForm({ title: '', description: '', priority: 'medium', due_date: new Date().toISOString().split('T')[0] });
            fetchData(); 
        } catch (error) {
            alert('Failed to assign task');
        }
    };

    if (loading) return <div className="glass-card" style={{padding: '2rem'}}>Analyzing team synergy...</div>;

    return (
        <div className="activity-feed glass-card" style={{padding: '2rem', gridColumn: 'span 1'}}>
            <div className="feed-header" style={{paddingBottom: '1.5rem', borderBottom: '1px solid var(--card-border)'}}>
                <div>
                    <h3 className="heading-md">Team Synergy & Assignments</h3>
                    <p className="text-label" style={{fontSize: '0.75rem'}}>Select members to assign individual or group tasks</p>
                </div>
                {selectedMemberIds.length > 0 && (
                    <button 
                        className="btn-primary" 
                        style={{padding: '0.5rem 1rem', fontSize: '0.8rem'}}
                        onClick={() => setShowTaskModal(true)}
                    >
                        <Plus size={16} /> Assign to {selectedMemberIds.length} {selectedMemberIds.length > 1 ? 'Members' : 'Member'}
                    </button>
                )}
            </div>

            <div className="tracking-list-container" style={{marginTop: '2rem'}}>
                <div className="tracking-header-row-modern" style={{gridTemplateColumns: '40px 1fr 1fr 1fr 1fr 100px'}}>
                    <span></span>
                    <span>Member</span>
                    <span>Daily Attendance</span>
                    <span>Task Progress</span>
                    <span>Workload</span>
                    <span style={{textAlign: 'right'}}>Status</span>
                </div>
                
                {trackingData.map(emp => (
                    <div 
                        key={emp.id} 
                        className={`tracking-row-modern ${selectedMemberIds.includes(emp.id) ? 'selected' : ''}`}
                        style={{gridTemplateColumns: '40px 1fr 1fr 1fr 1fr 100px', cursor: 'pointer'}}
                        onClick={() => toggleSelection(emp.id)}
                    >
                        <div onClick={(e) => e.stopPropagation()}>
                            <input 
                                type="checkbox" 
                                checked={selectedMemberIds.includes(emp.id)} 
                                onChange={() => toggleSelection(emp.id)}
                                style={{accentColor: 'var(--accent)'}}
                            />
                        </div>
                        <div className="emp-profile">
                            <div className="avatar-circle-sm">{emp.name.charAt(0)}</div>
                            <div className="emp-name-stack">
                                <span className="name">{emp.name}</span>
                                <span className="role">{emp.role}</span>
                            </div>
                        </div>
                        
                        <div className="attendance-log">
                            {emp.leave_status === 'on_leave' ? (
                                <div className="badge-premium" style={{backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.25rem 0.75rem'}}>
                                    <Clock size={12} style={{marginRight: '4px'}} />
                                    On Leave
                                </div>
                            ) : emp.tap_in ? (
                                <div className="activity-timeline">
                                    <div className="time-point" title="Clock In">
                                        <div className="dot-in"></div>
                                        <span>{new Date(emp.tap_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    {emp.tap_out && (
                                        <div className="time-point" title="Clock Out">
                                            <div className="dot-out"></div>
                                            <span>{new Date(emp.tap_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <span className="text-label" style={{fontSize: '0.7rem'}}>Not active yet</span>
                            )}
                        </div>

                        <div className="task-progress-box">
                            <div className="progress-info">
                                <span className="ratio">{emp.completed_tasks}/{emp.total_tasks}</span>
                                <span className="label">Tasks</span>
                            </div>
                            <div className="progress-bar-bg">
                                <div 
                                    className="progress-bar-fill" 
                                    style={{width: `${emp.total_tasks > 0 ? (emp.completed_tasks / emp.total_tasks) * 100 : 0}%`}}
                                ></div>
                            </div>
                        </div>

                        <div className="status-cell">
                            <span className={`status-pill ${emp.workload.toLowerCase()}`}>
                                {emp.workload}
                            </span>
                        </div>

                        <div className="status-cell" style={{textAlign: 'right'}}>
                            <span className={`status-pill ${emp.workload.toLowerCase()}`}>
                                {emp.workload}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {showTaskModal && (
                <div className="modal-overlay">
                    <div className="glass-card modal-content" style={{maxWidth: '500px', padding: '0', overflow: 'hidden'}}>
                        <div className="modal-header-gradient" style={{padding: '2rem', background: 'var(--accent-glow)', borderBottom: '1px solid var(--card-border)'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <div>
                                    <h3 className="heading-md" style={{marginBottom: '0.25rem'}}>
                                        {selectedMemberIds.length > 1 ? 'Assign Group Task' : 'Assign Individual Task'}
                                    </h3>
                                    <p className="text-label" style={{fontSize: '0.75rem', opacity: 0.7, textTransform: 'none'}}>
                                        Delegating to {selectedMemberIds.length} team {selectedMemberIds.length > 1 ? 'members' : 'member'}
                                    </p>
                                </div>
                                <button className="modal-close-btn" onClick={() => setShowTaskModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleAssign} style={{padding: '2rem'}}>
                            <div className="form-group-custom" style={{marginBottom: '1.5rem'}}>
                                <label className="input-label-premium">Task Title</label>
                                <input 
                                    type="text" 
                                    className="glass-input-modern" 
                                    required 
                                    placeholder="e.g., Q4 Revenue Report Analysis"
                                    value={taskForm.title}
                                    onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                                />
                            </div>

                            <div className="form-group-custom" style={{marginBottom: '1.5rem'}}>
                                <label className="input-label-premium">Detailed Description</label>
                                <textarea 
                                    className="glass-input-modern" 
                                    rows="4"
                                    style={{resize: 'none'}}
                                    placeholder="Explain the scope and objectives..."
                                    value={taskForm.description}
                                    onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                                />
                            </div>

                            <div className="form-row-custom" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem'}}>
                                <div className="form-group-custom">
                                    <label className="input-label-premium">Priority</label>
                                    <select 
                                        className="glass-input-modern"
                                        value={taskForm.priority}
                                        onChange={e => setTaskForm({...taskForm, priority: e.target.value})}
                                    >
                                        <option value="low">Low Priority</option>
                                        <option value="medium">Medium Priority</option>
                                        <option value="high">High Priority</option>
                                    </select>
                                </div>
                                <div className="form-group-custom">
                                    <label className="input-label-premium">Deadline</label>
                                    <input 
                                        type="date" 
                                        className="glass-input-modern"
                                        required
                                        value={taskForm.due_date}
                                        onChange={e => setTaskForm({...taskForm, due_date: e.target.value})}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="primary-btn-modern" style={{width: '100%', padding: '1.25rem'}}>
                                <CheckCircle2 size={18} /> Confirm Group Assignment
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmartTracking;

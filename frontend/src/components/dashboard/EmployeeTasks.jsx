import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import '../../styles/Dashboard.css';
import '../../styles/UI.css';

const EmployeeTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        try {
            const response = await axios.get('/api/tasks/my-tasks');
            setTasks(response.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const markComplete = async (taskId) => {
        try {
            await axios.patch(`/api/tasks/${taskId}/complete`);
            setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
        } catch (error) {
            alert('Failed to update task');
        }
    };

    if (loading) return <div className="glass-card" style={{padding: '2rem'}}>Loading tasks...</div>;

    const pendingTasks = tasks.filter(t => t.status === 'pending');

    return (
        <div className="activity-feed glass-card" style={{padding: '2rem'}}>
            <div className="feed-header">
                <div>
                    <h3 className="heading-md">Assigned Tasks</h3>
                    <p className="text-label">{pendingTasks.length} pending items</p>
                </div>
            </div>

            <div className="activity-list" style={{marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem'}}>
                
                <div>
                    <h4 style={{fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem'}}>
                        Pending ({pendingTasks.length})
                    </h4>
                    {pendingTasks.length > 0 ? (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                            {pendingTasks.map((task) => (
                                <div key={task.id} className="activity-row">
                                    <div className="activity-info">
                                        <div className="activity-text">
                                            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                                <p style={{fontWeight: 700}}>{task.title}</p>
                                                <span className={`badge-tiny ${task.priority}`}>
                                                    {task.priority}
                                                </span>
                                            </div>
                                            <span style={{fontSize: '0.75rem'}}>{task.description}</span>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem', fontSize: '0.7rem', opacity: 0.6}}>
                                                <span style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}><Clock size={10}/> Due: {new Date(task.due_date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => markComplete(task.id)}
                                        className="complete-btn"
                                        title="Mark as Complete"
                                    >
                                        <CheckCircle size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state" style={{padding: '1.5rem'}}>
                            You have no pending tasks. Great job!
                        </div>
                    )}
                </div>

                {tasks.filter(t => t.status === 'completed').length > 0 && (
                    <div>
                        <h4 style={{fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', opacity: 0.7}}>
                            Completed History
                        </h4>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                            {tasks.filter(t => t.status === 'completed').map((task) => (
                                <div key={task.id} className="activity-row opacity-50" style={{background: 'transparent', border: '1px dashed var(--card-border)'}}>
                                    <div className="activity-info">
                                        <div className="activity-text">
                                            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                                <p style={{fontWeight: 700, textDecoration: 'line-through'}}>{task.title}</p>
                                            </div>
                                            <span style={{fontSize: '0.75rem'}}>{task.description}</span>
                                        </div>
                                    </div>
                                    <span className="status-completed">
                                        Completed
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default EmployeeTasks;

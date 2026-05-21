import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Zap, TrendingUp, TrendingDown, Target, Award, 
    BarChart3, X, Star, Briefcase, Clock, Video, UserCheck, CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/UI.css';

const AIInsights = () => {
    const { user } = useAuth();
    const isManager = user?.role === 'manager' || user?.role === 'admin';
    
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [teamData, setTeamData] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async (employeeId = null) => {
        try {
            if (isManager && !employeeId) {
                const res = await axios.get('/api/ai/team-insights');
                setTeamData(res.data);
            } else {
                const url = employeeId ? `/api/ai/insights?employeeId=${employeeId}` : '/api/ai/insights';
                const res = await axios.get(url);
                if (employeeId) {
                    const updatedTeam = teamData.map(emp => emp.id === employeeId ? { ...emp, ...res.data } : emp);
                    setTeamData(updatedTeam);
                    setSelectedEmployee({ ...selectedEmployee, ...res.data });
                } else {
                    setData(res.data);
                }
            }
        } catch (err) {
            console.error('Error fetching insights:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [isManager]);

    const handleRefresh = async (employeeId = null) => {
        setRefreshing(true);
        try {
            const url = employeeId ? `/api/ai/insights?force=true&employeeId=${employeeId}` : '/api/ai/insights?force=true';
            const res = await axios.get(url);
            if (employeeId) {
                const updatedTeam = teamData.map(emp => emp.id === employeeId ? { ...emp, ...res.data } : emp);
                setTeamData(updatedTeam);
                setSelectedEmployee({ ...selectedEmployee, ...res.data });
            } else {
                setData(res.data);
            }
        } catch (err) {
            console.error('Refresh failed:', err);
        } finally {
            setRefreshing(false);
        }
    };

    if (loading) return <div className="empty-state">Analyzing behavior patterns...</div>;

    if (isManager) {
        return (
            <div className="dashboard-container">
                <div className="feed-header" style={{marginBottom: '2rem'}}>
                    <div>
                        <h1 className="heading-lg">Team AI Analytics</h1>
                        <p className="text-label" style={{textTransform: 'none'}}>Comparative performance and behavioral mapping</p>
                    </div>
                </div>

                <div className="glass-table-container">
                    <table className="glass-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Task Completion</th>
                                <th>Efficiency</th>
                                <th>Punctuality</th>
                                <th>Trend</th>
                                <th>Status</th>
                                <th style={{textAlign: 'right'}}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teamData.map((emp) => (
                                <tr key={emp.id}>
                                    <td>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                            <div className="avatar-circle" style={{width: '2rem', height: '2rem'}}>
                                                {emp.name[0]}
                                            </div>
                                            <span style={{fontWeight: 600}}>{emp.name}</span>
                                        </div>
                                    </td>
                                    <td>{emp.tasks?.completed || 0} / {emp.tasks?.total || 0}</td>
                                    <td>{emp.tasks?.avgSpeed || 0}h avg</td>
                                    <td>{emp.attendance?.onTimeRate || 0}%</td>
                                    <td>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '0.25rem', color: emp.trend?.status === 'improved' ? '#10b981' : '#f43f5e'}}>
                                            {emp.trend?.status === 'improved' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                            <span style={{fontWeight: 700}}>{Math.abs(emp.trend?.value || 0)}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge" style={{
                                            backgroundColor: emp.trend?.status === 'improved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                                            color: emp.trend?.status === 'improved' ? '#10b981' : '#f43f5e'
                                        }}>
                                            {(emp.trend?.status || 'STABLE').toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{textAlign: 'right'}}>
                                        <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                                            <button onClick={() => setSelectedEmployee(emp)} className="btn-icon edit" title="View Detailed Insights">
                                                <BarChart3 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {selectedEmployee && (
                    <div className="sidebar-overlay" onClick={() => setSelectedEmployee(null)} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'}}>
                        <div onClick={e => e.stopPropagation()} style={{width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', animation: 'fadeIn 0.3s ease'}}>
                            <div className="glass-card" style={{padding: '2rem'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                                        <h2 className="heading-md">Insights for {selectedEmployee.name}</h2>
                                        <button 
                                            onClick={() => handleRefresh(selectedEmployee.id)} 
                                            className={`btn-icon edit ${refreshing ? 'animate-spin' : ''}`}
                                            disabled={refreshing}
                                            title="Force Refresh AI Analysis"
                                        >
                                            <Zap size={16} />
                                        </button>
                                    </div>
                                    <button onClick={() => setSelectedEmployee(null)} className="btn-icon delete"><X size={20} /></button>
                                </div>
                                <EmployeeDetailView data={selectedEmployee} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (!data) return <div className="empty-state">No performance data available yet.</div>;

    return (
        <div className="dashboard-container">
            <div className="feed-header" style={{marginBottom: '2rem'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    <div>
                        <h1 className="heading-lg">Your Performance Pulse</h1>
                        <p className="text-label" style={{textTransform: 'none'}}>AI-driven insights into your work patterns and growth</p>
                    </div>
                    <button 
                        onClick={() => handleRefresh()} 
                        className={`btn-icon edit ${refreshing ? 'animate-spin' : ''}`}
                        disabled={refreshing}
                        title="Refresh Analysis"
                    >
                        <Zap size={18} />
                    </button>
                </div>
                <div className="glass-card" style={{padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid rgba(168, 85, 247, 0.2)'}}>
                    <div style={{textAlign: 'right'}}>
                        <p className="text-label" style={{fontSize: '0.6rem', marginBottom: 0}}>Current Trend</p>
                        <h4 style={{margin: 0, color: data.trend?.status === 'improved' ? '#10b981' : '#f43f5e', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                            {data.trend?.status === 'improved' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            {Math.abs(data.trend?.value || 0)}% {data.trend?.status || 'stable'}
                        </h4>
                    </div>
                    <div className="stat-icon-box" style={{backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', width: '2.5rem', height: '2.5rem'}}>
                        <Zap size={18} />
                    </div>
                </div>
            </div>
            <EmployeeDetailView data={data} />
        </div>
    );
};

const EmployeeDetailView = ({ data }) => {
    const taskPercent = data?.tasks?.total > 0 ? Math.round((data.tasks.completed / data.tasks.total) * 100) : 0;
    
    const barStats = [
        { label: 'Completion Rate', value: taskPercent, percent: taskPercent, unit: '%' },
        { label: 'Meeting Punctuality', value: data?.meetings?.onTimeRate || 0, percent: data?.meetings?.onTimeRate || 0, unit: '%' },
        { label: 'Notice Reaction', value: data?.notices?.avgReactionTime || 0, percent: (data?.notices?.avgReactionTime || 0) * 10, unit: 'h' },
        { label: 'Overall Efficiency', value: data?.behavioral?.coordination || 0, percent: data?.behavioral?.coordination || 0, unit: '%' },
    ];

    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
            <div style={{display: 'flex', gap: '2rem'}}>
                <div className="glass-card" style={{padding: '2rem', flex: 1.2, borderRadius: '1.5rem'}}>
                    <h3 className="heading-sm" style={{marginBottom: '2rem'}}>Performance Metrics</h3>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                        {barStats.map((stat, i) => (
                            <div key={i}>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem'}}>
                                    <span style={{fontWeight: 600, opacity: 0.8}}>{stat.label}</span>
                                    <span style={{color: 'var(--accent)', fontWeight: 800}}>{stat.value}{stat.unit}</span>
                                </div>
                                <div style={{height: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden'}}>
                                    <div style={{
                                        height: '100%', 
                                        width: `${Math.min(stat.percent, 100)}%`, 
                                        background: 'linear-gradient(90deg, var(--accent) 0%, #a855f7 100%)',
                                        borderRadius: '5px',
                                        transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div style={{flex: 0.8, display: 'flex', flexDirection: 'column', gap: '2rem'}}>
                    <div className="glass-card" style={{padding: '2rem', flex: 1, borderRadius: '1.5rem', position: 'relative', overflow: 'hidden'}}>
                        <div style={{position: 'absolute', top: '-20px', right: '-20px', opacity: 0.05}}>
                            <Star size={120} />
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem'}}>
                            <div className="stat-icon-box" style={{backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', width: '3rem', height: '3rem'}}>
                                <Zap size={20} />
                            </div>
                            <h3 className="heading-md" style={{margin: 0}}>Performance Coach</h3>
                        </div>
                        <p style={{lineHeight: 1.8, opacity: 0.9, fontSize: '1.1rem', fontStyle: 'italic', fontWeight: 500}}>
                            "{data.aiSummary}"
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIInsights;

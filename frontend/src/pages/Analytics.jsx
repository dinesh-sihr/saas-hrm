import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    BarChart3, ChevronRight, ArrowLeft, Users, Calendar, 
    Clock, CheckCircle2, AlertCircle, Sparkles, Building2, User, Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/UI.css';

const Analytics = () => {
    const { user } = useAuth();
    
    const [level, setLevel] = useState(1);
    const [selectedDept, setSelectedDept] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [data, setData] = useState({ departments: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    const handleExportLogs = (emp) => {
        const logs = emp.logs || [];
        if (logs.length === 0) {
            alert("No attendance logs found to export.");
            return;
        }
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Date,Status,Type,Hours Logged,Session Check-In,Session Check-Out\n";
        
        logs.forEach(log => {
            const formattedDate = new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            csvContent += `"${formattedDate}","${log.status}","${log.type || 'N/A'}",${log.hours},"${log.inTime}","${log.outTime}"\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${emp.name.replace(/\s+/g, '_')}_Attendance_Ledger.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        const fetchDrilldown = async () => {
            try {
                setLoading(true);
                const res = await axios.get('/api/attendance/drilldown');
                setData(res.data);
                setError('');
            } catch (err) {
                console.error("Error fetching drilldown data", err);
                setError("Failed to load drilldown analytics. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetchDrilldown();
    }, []);

    const departmentData = data.departments || [];

    const getLogsForEmployee = (emp) => {
        return emp.logs || [];
    };

    const handleDeptClick = (dept) => {
        setSelectedDept(dept);
        setSearchTerm('');
        setFilterType('all');
        setLevel(2);
    };

    const handleEmployeeClick = (emp) => {
        setSelectedEmployee(emp);
        setLevel(3);
    };

    const handleBreadcrumbClick = (targetLevel) => {
        if (targetLevel === 1) {
            setLevel(1);
            setSelectedDept(null);
            setSelectedEmployee(null);
        } else if (targetLevel === 2) {
            setLevel(2);
            setSelectedEmployee(null);
            setSearchTerm('');
            setFilterType('all');
        }
    };

    const handleBack = () => {
        if (level === 3) {
            setLevel(2);
            setSelectedEmployee(null);
            setSearchTerm('');
            setFilterType('all');
        } else if (level === 2) {
            setLevel(1);
            setSelectedDept(null);
        }
    };

    const filteredMembers = selectedDept ? selectedDept.members.filter(emp => {
        const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              emp.role.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (filterType === 'all') return matchesSearch;
        if (filterType === 'ontime') return matchesSearch && emp.attendance >= 90;
        if (filterType === 'late') return matchesSearch && emp.attendance < 90 && emp.attendance >= 50;
        if (filterType === 'absent') return matchesSearch && emp.attendance < 50;
        return matchesSearch;
    }) : [];

    return (
        <div className="dashboard-container" style={{ paddingBottom: '4rem' }}>
            <style>{`
                .drilldown-breadcrumb {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid var(--card-border);
                    padding: 0.75rem 1.5rem;
                    border-radius: 1rem;
                    margin-bottom: 2rem;
                    font-size: 0.9rem;
                    backdrop-filter: blur(10px);
                }
                .breadcrumb-item {
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: color 0.2s ease;
                    font-weight: 500;
                }
                .breadcrumb-item:hover {
                    color: var(--accent);
                }
                .breadcrumb-item.active {
                    color: var(--text-primary);
                    cursor: default;
                    font-weight: 600;
                }
                .back-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid var(--card-border);
                    color: var(--text-primary);
                    padding: 0.5rem 1rem;
                    border-radius: 0.75rem;
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: 600;
                    transition: all 0.2s ease;
                }
                .back-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    transform: translateX(-2px);
                }
                .bar-chart-container {
                    display: flex;
                    justify-content: space-around;
                    align-items: flex-end;
                    height: 320px;
                    padding: 2rem 1rem 1rem 1rem;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid var(--card-border);
                    border-radius: 1.5rem;
                    position: relative;
                    margin-bottom: 2rem;
                }
                .bar-wrapper {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 14%;
                    height: 100%;
                    justify-content: flex-end;
                    cursor: pointer;
                    group: true;
                }
                .bar-column {
                    width: 100%;
                    border-radius: 0.75rem 0.75rem 0 0;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    box-shadow: 0 4px 20px -2px rgba(0,0,0,0.3);
                }
                .bar-column::after {
                    content: attr(data-tooltip);
                    position: absolute;
                    top: -4.5rem;
                    left: 50%;
                    transform: translateX(-50%) scale(0.85);
                    background: var(--bg-main);
                    border: 1px solid var(--card-border);
                    color: var(--text-primary);
                    padding: 0.35rem 0.75rem;
                    border-radius: 0.6rem;
                    font-size: 0.7rem;
                    font-weight: 800;
                    white-space: nowrap;
                    opacity: 0;
                    pointer-events: none;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                    z-index: 20;
                }
                .bar-wrapper:hover .bar-column {
                    transform: translateY(-8px);
                    filter: brightness(1.15);
                    box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.3);
                }
                .bar-wrapper:hover .bar-column::after {
                    opacity: 1;
                    transform: translateX(-50%) scale(1);
                }
                .bar-label {
                    margin-top: 1rem;
                    font-size: 0.85rem;
                    font-weight: 600;
                    text-align: center;
                }
                .bar-percentage {
                    position: absolute;
                    top: -2.25rem;
                    left: 50%;
                    transform: translateX(-50%);
                    font-weight: 800;
                    font-size: 0.9rem;
                    background: var(--input-bg);
                    border: 1px solid var(--card-border);
                    padding: 0.2rem 0.6rem;
                    border-radius: 0.5rem;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    z-index: 10;
                }
                .department-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 1.5rem;
                }
                .drilldown-card {
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .drilldown-card:hover {
                    transform: translateY(-4px);
                    border-color: var(--accent);
                    background: rgba(255, 255, 255, 0.04);
                }
                .logs-timeline {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .log-row {
                    display: grid;
                    grid-template-columns: 1fr 1.5fr 1fr 1.5fr 1.2fr;
                    align-items: center;
                    padding: 1.25rem;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid var(--card-border);
                    border-radius: 1rem;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                }
                .log-row:hover {
                    background: rgba(255, 255, 255, 0.04);
                }
            `}</style>

            <div className="feed-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="heading-lg">Interactive Analytics</h1>
                    <p className="text-label" style={{ textTransform: 'none' }}>Click on charts and cards to explore layers of department and employee metrics</p>
                </div>
                {level > 1 && (
                    <button onClick={handleBack} className="back-btn">
                        <ArrowLeft size={16} />
                        <span>{level === 3 ? 'Back to Employees' : 'Back to Summary'}</span>
                    </button>
                )}
            </div>

            <div className="drilldown-breadcrumb">
                <span className={`breadcrumb-item ${level === 1 ? 'active' : ''}`} onClick={() => handleBreadcrumbClick(1)}>
                    Company Summary
                </span>
                {level >= 2 && (
                    <>
                        <ChevronRight size={14} style={{ opacity: 0.4 }} />
                        <span className={`breadcrumb-item ${level === 2 ? 'active' : ''}`} onClick={() => handleBreadcrumbClick(2)}>
                            {selectedDept.name} Department
                        </span>
                    </>
                )}
                {level === 3 && (
                    <>
                        <ChevronRight size={14} style={{ opacity: 0.4 }} />
                        <span className="breadcrumb-item active">
                            {selectedEmployee.name} Logs
                        </span>
                    </>
                )}
            </div>

            {loading ? (
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <div className="spinner" style={{ borderTopColor: '#6366f1', margin: '0 auto 1rem auto' }}></div>
                    <p className="text-label" style={{ textTransform: 'none' }}>Fetching real-time department and roster attendance from database...</p>
                </div>
            ) : error ? (
                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', borderLeft: '4px solid #f43f5e' }}>
                    <AlertCircle size={32} style={{ color: '#f43f5e', marginBottom: '0.75rem' }} />
                    <h3 className="heading-sm" style={{ color: '#f43f5e' }}>{error}</h3>
                </div>
            ) : level === 1 && (
                <div>
                    <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div>
                                <h3 className="heading-md" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Building2 size={20} className="text-indigo-500" />
                                    Department Attendance Overview
                                </h3>
                                <p className="text-label" style={{ textTransform: 'none', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                    Click any bar to drill down into corresponding employees
                                </p>
                            </div>
                            <div className="badge-premium" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                <Sparkles size={14} style={{ marginRight: 4 }} /> Drill-down Enabled
                            </div>
                        </div>

                        <div className="bar-chart-container">
                            {departmentData.map((dept) => (
                                <div key={dept.id} className="bar-wrapper" onClick={() => handleDeptClick(dept)}>
                                    <div 
                                        className="bar-column" 
                                        data-tooltip={`Lead: ${dept.lead} | Click to Drill Down`}
                                        style={{ 
                                            height: `${dept.attendance}%`, 
                                            background: `linear-gradient(to top, ${dept.color} 20%, rgba(255,255,255,0.05) 100%)` 
                                        }}
                                    >
                                        <span className="bar-percentage" style={{ color: dept.color }}>{dept.attendance}%</span>
                                    </div>
                                    <span className="bar-label">{dept.name}</span>
                                    <span className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{dept.totalMembers} Members</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <h3 className="heading-sm" style={{ marginBottom: '1.25rem' }}>Select Feature Area</h3>
                    <div className="department-grid">
                        {departmentData.map((dept) => (
                            <div 
                                key={dept.id} 
                                className="glass-card drilldown-card" 
                                style={{ padding: '1.5rem', borderLeft: `4px solid ${dept.color}` }}
                                onClick={() => handleDeptClick(dept)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h4 className="heading-sm" style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {dept.name}
                                            {dept.trend !== undefined && (
                                                <span style={{ 
                                                    fontSize: '0.65rem', 
                                                    fontWeight: 800, 
                                                    padding: '0.1rem 0.4rem', 
                                                    borderRadius: '0.4rem', 
                                                    backgroundColor: dept.trend >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                                                    color: dept.trend >= 0 ? '#10b981' : '#f43f5e',
                                                    display: 'inline-flex',
                                                    alignItems: 'center'
                                                }}>
                                                    {dept.trend >= 0 ? `+${dept.trend}%` : `${dept.trend}%`} MoM
                                                </span>
                                            )}
                                        </h4>
                                        <p className="text-label" style={{ textTransform: 'none', fontSize: '0.75rem' }}>Lead: {dept.lead}</p>
                                    </div>
                                    <span className="badge" style={{ backgroundColor: `${dept.color}15`, color: dept.color }}>
                                        {dept.attendance}% Avg
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
                                    <span className="text-muted"><Users size={14} style={{ display: 'inline', marginRight: 4 }} /> {dept.totalMembers} Active Members</span>
                                    <span style={{ color: dept.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        View Team <ChevronRight size={14} />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!loading && !error && level === 2 && selectedDept && (
                <div>
                    <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 className="heading-md" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Users size={20} style={{ color: selectedDept.color }} />
                                    {selectedDept.name} Department Roster
                                </h3>
                                <p className="text-label" style={{ textTransform: 'none', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                    Click on any team member to view their itemized daily attendance logs
                                </p>
                            </div>
                            <span className="badge" style={{ backgroundColor: `${selectedDept.color}20`, color: selectedDept.color, padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                                {selectedDept.attendance}% Department Average
                            </span>
                        </div>

                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            gap: '1rem', 
                            marginBottom: '1.5rem', 
                            flexWrap: 'wrap',
                            background: 'rgba(255, 255, 255, 0.01)',
                            padding: '1rem',
                            borderRadius: '1rem',
                            border: '1px solid var(--card-border)'
                        }}>
                            <input 
                                type="text" 
                                placeholder="Search team by name, role or email..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ 
                                    height: '2.5rem', 
                                    flex: '1', 
                                    minWidth: '240px', 
                                    fontSize: '0.85rem', 
                                    padding: '0 1.25rem', 
                                    borderRadius: '0.75rem', 
                                    background: 'var(--input-bg)', 
                                    border: '1px solid var(--input-border)',
                                    color: 'var(--text-primary)',
                                    outline: 'none'
                                }}
                            />
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                {['all', 'ontime', 'late', 'absent'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setFilterType(type)}
                                        className="badge"
                                        style={{ 
                                            padding: '0.4rem 0.85rem', 
                                            borderRadius: '0.6rem', 
                                            border: '1px solid var(--card-border)',
                                            background: filterType === type ? 'var(--accent-glow)' : 'transparent',
                                            color: filterType === type ? 'var(--accent)' : 'var(--text-secondary)',
                                            fontWeight: 700,
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {type === 'all' && 'All'}
                                        {type === 'ontime' && 'On Time (≥90%)'}
                                        {type === 'late' && 'Tardy (<90%)'}
                                        {type === 'absent' && 'Critical (<50%)'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="glass-table-container">
                            <table className="glass-table">
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Job Role</th>
                                        <th>Punctuality Score</th>
                                        <th>Log Summary</th>
                                        <th style={{ textAlign: 'right' }}>Drill Down</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMembers.length > 0 ? (
                                        filteredMembers.map((emp) => (
                                        <tr key={emp.id} style={{ cursor: 'pointer' }} onClick={() => handleEmployeeClick(emp)}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                     <div className="avatar-circle" style={{ width: '2.25rem', height: '2.25rem', background: selectedDept.color, fontSize: '0.85rem', overflow: 'hidden', padding: 0 }}>
                                                         {emp.profile_photo ? (
                                                             <img src={emp.profile_photo} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                         ) : (
                                                             emp.name[0]
                                                         )}
                                                     </div>
                                                    <div>
                                                        <span style={{ fontWeight: 600, display: 'block' }}>{emp.name}</span>
                                                        <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{emp.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 500 }}>{emp.role}</span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '100px', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${emp.attendance}%`, height: '100%', background: selectedDept.color }} />
                                                    </div>
                                                    <span style={{ fontWeight: 700, color: selectedDept.color }}>{emp.attendance}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ color: '#10b981', fontWeight: 600 }}>{emp.presentDays} Present</span>
                                                <span style={{ opacity: 0.4 }}> / </span>
                                                <span style={{ color: '#f43f5e', fontWeight: 600 }}>{emp.absentDays} Absent</span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <span style={{ color: selectedDept.color, fontWeight: 700, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    Attendance Logs <ChevronRight size={14} />
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-secondary)' }}>
                                            <Users size={28} style={{ display: 'block', margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
                                            No team members match your search or filter settings.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {!loading && !error && level === 3 && selectedEmployee && (
                <div>
                    <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--card-border)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                <div className="avatar-circle" style={{ width: '4rem', height: '4rem', fontSize: '1.5rem', background: selectedDept.color, overflow: 'hidden', padding: 0 }}>
                                    {selectedEmployee.profile_photo ? (
                                        <img src={selectedEmployee.profile_photo} alt={selectedEmployee.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        selectedEmployee.name[0]
                                    )}
                                </div>
                                <div>
                                    <h2 className="heading-md" style={{ marginBottom: '0.25rem' }}>{selectedEmployee.name}</h2>
                                    <p className="text-muted" style={{ fontSize: '0.9rem' }}>{selectedEmployee.role} &bull; {selectedDept.name} Department</p>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                <div>
                                    <p className="text-label" style={{ textTransform: 'none' }}>Overall Period Attendance</p>
                                    <h2 className="heading-lg" style={{ color: selectedDept.color, margin: 0 }}>{selectedEmployee.attendance}%</h2>
                                </div>
                                <button 
                                    onClick={() => handleExportLogs(selectedEmployee)}
                                    className="badge-premium"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--card-border)',
                                        cursor: 'pointer',
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                                >
                                    <Download size={12} /> Export CSV Ledger
                                </button>
                            </div>
                        </div>

                        <h3 className="heading-sm" style={{ marginBottom: '1.5rem' }}>Itemized Daily Ledger</h3>
                        <div className="logs-timeline">
                            {getLogsForEmployee(selectedEmployee).map((log, index) => (
                                <div key={index} className="log-row">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Calendar size={18} style={{ opacity: 0.5 }} />
                                        <span style={{ fontWeight: 600 }}>{new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span className="badge" style={{
                                            backgroundColor: log.status === 'present' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                                            color: log.status === 'present' ? '#10b981' : '#f43f5e',
                                            padding: '0.25rem 0.75rem'
                                        }}>
                                            {log.status.toUpperCase()}
                                        </span>
                                        {log.status === 'present' && (
                                            <span style={{ color: log.type === 'On Time' ? '#10b981' : '#f59e0b', fontSize: '0.8rem', fontWeight: 600 }}>
                                                ({log.type})
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                                        <Clock size={16} style={{ opacity: 0.5 }} />
                                        <span>{log.hours.toFixed(1)} Hrs Logged</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                                        {log.status === 'present' ? (
                                            <span>Session: <strong>{log.inTime}</strong> &rarr; <strong>{log.outTime}</strong></span>
                                        ) : (
                                            <span className="text-muted" style={{ fontStyle: 'italic' }}>No session logs recorded</span>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'right', fontSize: '0.85rem', fontWeight: 600, color: log.status === 'present' ? '#10b981' : '#f43f5e' }}>
                                        {log.status === 'present' ? (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <CheckCircle2 size={14} /> Approved
                                            </span>
                                        ) : (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <AlertCircle size={14} /> Deducted
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Analytics;

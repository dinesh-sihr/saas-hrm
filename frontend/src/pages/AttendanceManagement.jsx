import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Clock, Calendar, User, Search, Filter, 
    ArrowRight, MapPin, CheckCircle, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import '../styles/UI.css';

const AttendanceManagement = () => {
    const { user } = useAuth();
    const isManager = user?.role === 'manager' || user?.role === 'admin';
    
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [searchFilter, setSearchFilter] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchFilter]);

    const loadAttendanceRecords = async () => {
        try {
            const dataEndpoint = isManager ? '/api/attendance/team' : '/api/attendance/history';
            const response = await axios.get(dataEndpoint);
            setAttendanceLogs(response.data);
        } catch (err) {
            console.error('Failed to load attendance:', err);
        } finally {
            setIsDataLoading(false);
        }
    };

    useEffect(() => {
        loadAttendanceRecords();
    }, []);

    const filteredLogs = attendanceLogs.filter(log => 
        (log.user_name || user.name).toLowerCase().includes(searchFilter.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

    if (isDataLoading) return <div className="empty-state">Just a moment, gathering your work logs...</div>;

    return (
        <div className="dashboard-container">
            <div className="feed-header" style={{marginBottom: '2rem'}}>
                <div>
                    <h1 className="heading-lg">{isManager ? 'Team Attendance Log' : 'My Work Hours History'}</h1>
                    <p className="text-label" style={{textTransform: 'none'}}>Review daily check-ins, check-outs, and total time spent</p>
                </div>
            </div>

            <div className="glass-card" style={{padding: '1.5rem'}}>
                <div className="input-group" style={{maxWidth: '400px', marginBottom: '1.5rem'}}>
                    <Search className="input-icon" size={18} />
                    <input 
                        type="text" 
                        placeholder={isManager ? "Find a team member..." : "Search through your history..."}
                        className="input-field"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                    />
                </div>

                <div className="glass-table-container">
                    <table className="glass-table">
                        <thead>
                            <tr>
                                {isManager && <th>Team Member</th>}
                                <th>Work Date</th>
                                <th>Clocked In</th>
                                <th>Clocked Out</th>
                                <th>Total Time</th>
                                <th>Presence</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length > 0 ? (
                                currentItems.map((log) => {
                                    const workDate = new Date(log.check_in || log.created_at);
                                    return (
                                        <tr key={log.id}>
                                            {isManager && (
                                                <td>
                                                    <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                                        <div className="avatar-circle" style={{width: '2rem', height: '2rem', fontSize: '0.7rem'}}>
                                                            {log.user_name?.charAt(0)}
                                                        </div>
                                                        <span style={{fontWeight: 600}}>{log.user_name}</span>
                                                    </div>
                                                </td>
                                            )}
                                            <td>
                                                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                                    <Calendar size={14} opacity={0.5} />
                                                    {workDate.toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td style={{color: '#10b981'}}>
                                                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                                    <Clock size={14} />
                                                    {log.check_in ? new Date(log.check_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '---'}
                                                </div>
                                            </td>
                                            <td style={{color: '#ef4444'}}>
                                                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                                    <Clock size={14} />
                                                    {log.check_out ? new Date(log.check_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Still Working'}
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{fontWeight: 700}}>
                                                    {log.total_hours ? `${log.total_hours} hrs` : '---'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${log.status || 'present'}`} style={{
                                                    backgroundColor: (log.status === 'present' || !log.status) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                    color: (log.status === 'present' || !log.status) ? '#10b981' : '#f59e0b'
                                                }}>
                                                    {(log.status || 'present').toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={isManager ? 6 : 5} style={{textAlign: 'center', padding: '4rem', opacity: 0.5}}>
                                        <Clock size={48} style={{marginBottom: '1rem', opacity: 0.2}} />
                                        <p>No work records to show yet. Time to get started!</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            </div>
        </div>
    );
};

export default AttendanceManagement;

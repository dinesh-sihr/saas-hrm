import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FileText, Plus, Search, Check, X, Clock,
    Calendar, AlertCircle, CheckCircle2, XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import '../styles/UI.css';

const LeaveManagement = () => {
    const { user } = useAuth();
    const isManager = user?.role === 'manager' || user?.role === 'admin';
    
    const [leaveList, setLeaveList] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
    const [applicationForm, setApplicationForm] = useState({
        type: 'Sick Leave',
        from_date: '',
        to_date: '',
        reason: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchAllLeaves = async () => {
        try {
            const response = await axios.get('/api/leaves');
            setLeaveList(response.data);
        } catch (err) {
            console.error('Failed to load leave records:', err);
        } finally {
            setIsDataLoading(false);
        }
    };

    useEffect(() => {
        fetchAllLeaves();
    }, []);

    const handleApplicationSubmit = async (e) => {
        e.preventDefault();
        
        if (new Date(applicationForm.to_date) < new Date(applicationForm.from_date)) {
            alert('Oops! Your "To Date" is earlier than your "From Date". Please fix that before submitting.');
            return;
        }

        try {
            await axios.post('/api/leaves', applicationForm);
            fetchAllLeaves();
            closeApplicationModal();
        } catch (err) {
            alert(err.response?.data?.message || 'We couldn’t submit your application right now. Please try again.');
        }
    };

    const updateRequestStatus = async (requestId, newStatus) => {
        try {
            await axios.patch(`/api/leaves/${requestId}/status`, { status: newStatus });
            fetchAllLeaves();
        } catch (err) {
            alert('Something went wrong while updating the status.');
        }
    };

    const closeApplicationModal = () => {
        setIsApplicationModalOpen(false);
        setApplicationForm({ type: 'Sick Leave', from_date: '', to_date: '', reason: '' });
    };

    const renderStatusBadge = (status) => {
        switch (status) {
            case 'approved': return <span className="badge" style={{backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}}><CheckCircle2 size={12} style={{marginRight: '4px'}} /> APPROVED</span>;
            case 'rejected': return <span className="badge" style={{backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444'}}><XCircle size={12} style={{marginRight: '4px'}} /> REJECTED</span>;
            default: return <span className="badge" style={{backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b'}}><Clock size={12} style={{marginRight: '4px'}} /> PENDING REVIEW</span>;
        }
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = leaveList.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(leaveList.length / itemsPerPage);

    if (isDataLoading) return <div className="empty-state">Just a moment, loading your time-off records...</div>;

    return (
        <div className="dashboard-container">
            <div className="feed-header" style={{marginBottom: '2rem'}}>
                <div>
                    <h1 className="heading-lg">{isManager ? 'Team Time-Off Requests' : 'My Time-Off Planner'}</h1>
                    <p className="text-label" style={{textTransform: 'none'}}>Keep track of holidays, sick days, and personal time</p>
                </div>
                {!isManager && (
                    <button onClick={() => setIsApplicationModalOpen(true)} className="btn-primary" style={{width: 'auto', padding: '0 1.5rem'}}>
                        <Plus size={18} />
                        <span>Plan Time Off</span>
                    </button>
                )}
            </div>

            <div className="glass-card" style={{padding: '1.5rem'}}>
                <div className="glass-table-container">
                    <table className="glass-table">
                        <thead>
                            <tr>
                                {isManager && <th>Team Member</th>}
                                <th>Type of Leave</th>
                                <th>Dates</th>
                                <th>Reason</th>
                                <th>Current Status</th>
                                {isManager && <th style={{textAlign: 'right'}}>Decision</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length > 0 ? (
                                currentItems.map((leave) => (
                                    <tr key={leave.id}>
                                        {isManager && (
                                            <td>
                                                <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                                    <div className="avatar-circle" style={{width: '2rem', height: '2rem', fontSize: '0.7rem'}}>
                                                        {leave.employee_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p style={{fontWeight: 600, margin: 0}}>{leave.employee_name}</p>
                                                        <span style={{fontSize: '0.7rem', opacity: 0.5}}>{leave.employee_email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                        <td><span style={{fontWeight: 600}}>{leave.type}</span></td>
                                        <td>
                                            <div style={{fontSize: '0.85rem'}}>
                                                <div style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                                                    <Calendar size={12} opacity={0.5} /> {new Date(leave.from_date).toLocaleDateString()}
                                                </div>
                                                <div style={{display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem'}}>
                                                    <Clock size={12} opacity={0.5} /> Until: {new Date(leave.to_date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{maxWidth: '200px'}}><p className="text-label" style={{textTransform: 'none', fontSize: '0.8rem'}}>{leave.reason || 'No specific reason shared.'}</p></td>
                                        <td>{renderStatusBadge(leave.status)}</td>
                                        {isManager && (
                                            <td style={{textAlign: 'right'}}>
                                                {leave.status === 'pending' && (
                                                    <div className="action-group" style={{justifyContent: 'flex-end'}}>
                                                        <button onClick={() => updateRequestStatus(leave.id, 'approved')} className="btn-icon edit" title="Approve Request"><Check size={16} /></button>
                                                        <button onClick={() => updateRequestStatus(leave.id, 'rejected')} className="btn-icon delete" title="Decline Request"><X size={16} /></button>
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={isManager ? 6 : 5} style={{textAlign: 'center', padding: '4rem', opacity: 0.5}}>
                                        <FileText size={48} style={{marginBottom: '1rem', opacity: 0.2}} />
                                        <p>No time-off requests here yet. Everything is business as usual!</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            </div>

            {isApplicationModalOpen && (
                <div className="modal-overlay" onClick={closeApplicationModal}>
                    <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '500px', width: '90%'}}>
                        <div className="feed-header">
                            <h3 className="heading-md">Plan Your Time Off</h3>
                            <button onClick={closeApplicationModal} className="btn-icon"><X size={18} /></button>
                        </div>

                        <form onSubmit={handleApplicationSubmit} className="auth-form" style={{marginTop: '1.5rem'}}>
                            <div className="field-wrapper">
                                <label className="input-label">What kind of leave do you need?</label>
                                <select className="input-field" style={{paddingLeft: '1rem'}} value={applicationForm.type} onChange={(e) => setApplicationForm({...applicationForm, type: e.target.value})}>
                                    <option value="Sick Leave">🤒 Sick Leave</option>
                                    <option value="Casual Leave">🏠 Casual Leave</option>
                                    <option value="Annual Leave">✈️ Annual Leave / Vacation</option>
                                    <option value="Maternity/Paternity">👶 Maternity/Paternity</option>
                                    <option value="Unpaid Leave">⏸️ Unpaid Leave</option>
                                </select>
                            </div>

                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                                <div className="field-wrapper">
                                    <label className="input-label">Starting From</label>
                                    <input type="date" className="input-field" value={applicationForm.from_date} onChange={(e) => setApplicationForm({...applicationForm, from_date: e.target.value})} required />
                                </div>
                                <div className="field-wrapper">
                                    <label className="input-label">Returning On</label>
                                    <input type="date" className="input-field" value={applicationForm.to_date} onChange={(e) => setApplicationForm({...applicationForm, to_date: e.target.value})} required />
                                </div>
                            </div>

                            <div className="field-wrapper">
                                <label className="input-label">A quick note for your manager</label>
                                <textarea 
                                    className="input-field" 
                                    style={{minHeight: '100px', paddingTop: '10px'}}
                                    value={applicationForm.reason} 
                                    onChange={(e) => setApplicationForm({...applicationForm, reason: e.target.value})} 
                                    placeholder="Tell us a little bit about why you need this time off..."
                                    required 
                                />
                            </div>

                            <button type="submit" className="btn-primary" style={{marginTop: '1rem'}}>
                                Submit for Review
                                <Check size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveManagement;

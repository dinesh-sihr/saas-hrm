import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Users, Plus, Search, Edit2, Trash2, X, Check,
    UserPlus, Mail, Shield, User as UserIcon, Clock
} from 'lucide-react';
import Pagination from '../components/Pagination';
import '../styles/UI.css';
import EmployeeProfileModal from '../components/dashboard/EmployeeProfileModal';

const EmployeeManagement = () => {
    const [teamMemberList, setTeamMemberList] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [searchFilter, setSearchFilter] = useState('');
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [selectedMemberForEdit, setSelectedMemberForEdit] = useState(null);
    const [selectedProfileId, setSelectedProfileId] = useState(null);
    const [activeTab, setActiveTab] = useState('active');
    const [teamMemberForm, setTeamMemberForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'employee'
    });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchFilter, activeTab]);

    const loadTeamMembers = async () => {
        try {
            const response = await axios.get('/api/employees');
            setTeamMemberList(response.data);
        } catch (err) {
            console.error('Failed to load team:', err);
        } finally {
            setIsDataLoading(false);
        }
    };

    useEffect(() => {
        loadTeamMembers();
    }, []);

    const handleTeamMemberSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedMemberForEdit) {
                await axios.put(`/api/employees/${selectedMemberForEdit.id}`, teamMemberForm);
            } else {
                await axios.post('/api/employees', teamMemberForm);
            }
            loadTeamMembers();
            closeTeamModal();
        } catch (err) {
            alert(err.response?.data?.message || 'We couldn’t process that action right now.');
        }
    };

    const removeMemberFromTeam = async (memberId) => {
        if (!window.confirm('Are you sure you want to remove this person from the team?')) return;
        try {
            await axios.delete(`/api/employees/${memberId}`);
            loadTeamMembers();
        } catch (err) {
            alert('Something went wrong while trying to remove the team member.');
        }
    };

    const approveEmployee = async (employeeId) => {
        try {
            await axios.patch(`/api/employees/${employeeId}/status`, { status: 'active' });
            loadTeamMembers();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to approve employee.');
        }
    };

    const rejectEmployee = async (memberId) => {
        if (!window.confirm('Are you sure you want to reject and remove this registration request?')) return;
        try {
            await axios.delete(`/api/employees/${memberId}`);
            loadTeamMembers();
        } catch (err) {
            alert('Something went wrong while trying to reject the registration.');
        }
    };

    const openTeamModal = (memberToEdit = null) => {
        if (memberToEdit) {
            setSelectedMemberForEdit(memberToEdit);
            setTeamMemberForm({
                name: memberToEdit.name,
                email: memberToEdit.email,
                role: memberToEdit.role,
                password: '' 
            });
        } else {
            setSelectedMemberForEdit(null);
            setTeamMemberForm({ name: '', email: '', password: '', role: 'employee' });
        }
        setIsTeamModalOpen(true);
    };

    const closeTeamModal = () => {
        setIsTeamModalOpen(false);
        setSelectedMemberForEdit(null);
    };

    const pendingEmployeesCount = teamMemberList.filter(member => member.status === 'pending').length;

    const tabFilteredTeam = teamMemberList.filter(member => 
        activeTab === 'pending' ? member.status === 'pending' : member.status !== 'pending'
    );

    const filteredTeam = tabFilteredTeam.filter(member => 
        member.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        member.email.toLowerCase().includes(searchFilter.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredTeam.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTeam.length / itemsPerPage);

    if (isDataLoading) return <div className="empty-state">Bringing the team together...</div>;

    return (
        <div className="dashboard-container">
            <div className="feed-header" style={{marginBottom: '2rem'}}>
                <div>
                    <h1 className="heading-lg">Our Amazing People</h1>
                    <p className="text-label" style={{textTransform: 'none'}}>The heart and soul of our company — manage your team members here</p>
                </div>
                <button onClick={() => openTeamModal()} className="btn-primary" style={{width: 'auto', padding: '0 1.5rem'}}>
                    <UserPlus size={18} />
                    <span>Welcome a New Member</span>
                </button>
            </div>

            <div className="glass-card" style={{padding: '1.5rem'}}>
                <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--card-border)', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
                    <button 
                        onClick={() => { setActiveTab('active'); setCurrentPage(1); }}
                        className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: activeTab === 'active' ? 'var(--accent)' : 'var(--text-muted)',
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            borderBottom: activeTab === 'active' ? '2px solid var(--accent)' : '2px solid transparent',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Users size={16} />
                        <span>Active Team</span>
                    </button>
                    <button 
                        onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
                        className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: activeTab === 'pending' ? 'var(--accent)' : 'var(--text-muted)',
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            borderBottom: activeTab === 'pending' ? '2px solid var(--accent)' : '2px solid transparent',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Clock size={16} />
                        <span>Pending Approvals</span>
                        {pendingEmployeesCount > 0 && (
                            <span style={{
                                backgroundColor: '#f59e0b',
                                color: '#fff',
                                fontSize: '0.7rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '9999px',
                                fontWeight: 'bold',
                                marginLeft: '0.25rem',
                                boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)'
                            }}>
                                {pendingEmployeesCount}
                            </span>
                        )}
                    </button>
                </div>

                <div className="input-group" style={{maxWidth: '400px', marginBottom: '1.5rem'}}>
                    <Search className="input-icon" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search for a teammate by name or email..." 
                        className="input-field"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                    />
                </div>

                <div className="glass-table-container">
                    <table className="glass-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email Address</th>
                                <th>Company</th>
                                <th>Permission Role</th>
                                <th>{activeTab === 'pending' ? 'Registered On' : 'Joined Us On'}</th>
                                <th style={{textAlign: 'right'}}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length > 0 ? (
                                currentItems.map((member) => (
                                    <tr 
                                        key={member.id} 
                                        style={{cursor: activeTab === 'active' ? 'pointer' : 'default'}} 
                                        onClick={() => {
                                            if (activeTab === 'active') {
                                                setSelectedProfileId(member.id);
                                            }
                                        }}
                                    >
                                        <td>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                                <div className="avatar-circle" style={{width: '2rem', height: '2rem', fontSize: '0.7rem'}}>
                                                    {member.name.charAt(0)}
                                                </div>
                                                <span style={{fontWeight: 600}}>{member.name}</span>
                                            </div>
                                        </td>
                                        <td>{member.email}</td>
                                        <td>{member.company_name}</td>
                                        <td>
                                            <span className="badge" style={{
                                                backgroundColor: member.role === 'manager' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                                                color: member.role === 'manager' ? '#6366f1' : 'inherit'
                                            }}>
                                                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                            </span>
                                        </td>
                                        <td>{new Date(member.created_at).toLocaleDateString()}</td>
                                        <td style={{textAlign: 'right'}} onClick={(e) => e.stopPropagation()}>
                                            {activeTab === 'active' ? (
                                                <div className="action-group" style={{justifyContent: 'flex-end'}}>
                                                    <button onClick={() => openTeamModal(member)} className="btn-icon edit" title="Edit Member Info">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => removeMemberFromTeam(member.id)} className="btn-icon delete" title="Remove from Team">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="action-group" style={{justifyContent: 'flex-end'}}>
                                                    <button 
                                                        onClick={() => approveEmployee(member.id)} 
                                                        className="btn-icon" 
                                                        title="Approve Request"
                                                        style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => rejectEmployee(member.id)} 
                                                        className="btn-icon" 
                                                        title="Reject Request"
                                                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{textAlign: 'center', padding: '3rem', opacity: 0.5}}>
                                        <Users size={40} style={{marginBottom: '1rem', opacity: 0.2}} />
                                        <p>No team members found matching that search. Start by inviting someone!</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            </div>

            {isTeamModalOpen && (
                <div className="modal-overlay">
                    <div className="glass-card modal-content" style={{maxWidth: '500px', width: '90%'}}>
                        <div className="feed-header">
                            <h3 className="heading-md">{selectedMemberForEdit ? 'Update Teammate Details' : 'Welcome a New Teammate'}</h3>
                            <button onClick={closeTeamModal} className="btn-icon"><X size={18} /></button>
                        </div>

                        <form onSubmit={handleTeamMemberSubmit} className="auth-form" style={{marginTop: '1.5rem'}}>
                            <div className="field-wrapper">
                                <label className="input-label">Full Name</label>
                                <div className="input-group">
                                    <UserIcon className="input-icon" size={18} />
                                    <input 
                                        className="input-field"
                                        placeholder="e.g. John Doe"
                                        value={teamMemberForm.name}
                                        onChange={(e) => setTeamMemberForm({...teamMemberForm, name: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="field-wrapper">
                                <label className="input-label">Email Address</label>
                                <div className="input-group">
                                    <Mail className="input-icon" size={18} />
                                    <input 
                                        type="email"
                                        className="input-field"
                                        placeholder="work@company.com"
                                        value={teamMemberForm.email}
                                        onChange={(e) => setTeamMemberForm({...teamMemberForm, email: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>

                            {!selectedMemberForEdit && (
                                <div className="field-wrapper">
                                    <label className="input-label">Initial Password</label>
                                    <input 
                                        type="password"
                                        className="input-field"
                                        style={{paddingLeft: '1rem'}}
                                        placeholder="Set a secure password"
                                        value={teamMemberForm.password}
                                        onChange={(e) => setTeamMemberForm({...teamMemberForm, password: e.target.value})}
                                        required
                                    />
                                </div>
                            )}

                            <div className="field-wrapper">
                                <label className="input-label">Permission & Role</label>
                                <select 
                                    className="input-field" 
                                    style={{paddingLeft: '1rem'}}
                                    value={teamMemberForm.role}
                                    onChange={(e) => setTeamMemberForm({...teamMemberForm, role: e.target.value})}
                                >
                                    <option value="employee">Staff Member / Employee</option>
                                    <option value="manager">Manager / Admin</option>
                                </select>
                            </div>

                            <button type="submit" className="btn-primary" style={{marginTop: '1rem'}}>
                                {selectedMemberForEdit ? 'Save Changes' : 'Invite to Team'}
                                <Check size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {selectedProfileId && (
                <EmployeeProfileModal 
                    employeeId={selectedProfileId} 
                    onClose={() => setSelectedProfileId(null)} 
                />
            )}
        </div>
    );
};

export default EmployeeManagement;

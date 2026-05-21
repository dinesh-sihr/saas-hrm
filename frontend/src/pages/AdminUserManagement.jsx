import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit3, Trash2, Search } from 'lucide-react';
import Pagination from '../components/Pagination';
import '../styles/Dashboard.css';
import '../styles/UI.css';

const AdminUserManagement = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
    
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const fetchAdmins = async () => {
        try {
            const response = await axios.get('/api/super-admin/admins');
            setAdmins(response.data);
        } catch (error) {
            console.error('Error fetching admins:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/super-admin/admins', newAdmin);
            setShowModal(false);
            setNewAdmin({ name: '', email: '', password: '' });
            fetchAdmins();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to add admin');
        }
    };

    const filteredAdmins = admins.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredAdmins.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage);

    if (loading) return <div className="empty-state">Loading administrators...</div>;

    return (
        <div className="dashboard-container">
            <div className="feed-header" style={{marginBottom: '1rem'}}>
                <div>
                    <h1 className="heading-lg">Platform Administrators</h1>
                    <p className="input-label" style={{textTransform: 'none', marginTop: '0.25rem'}}>Manage platform-level super admins</p>
                </div>
                <div className="header-user-actions">
                    <div className="input-group" style={{width: '240px', marginBottom: '0'}}>
                        <Search className="input-icon" size={16} />
                        <input 
                            type="text" 
                            className="input-field" 
                            placeholder="Search admins..." 
                            style={{height: '2.75rem', borderRadius: '1rem'}} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={() => setShowModal(true)} className="btn-primary" style={{width: 'auto', padding: '0 1.5rem', height: '2.75rem', borderRadius: '1rem', backgroundColor: '#f59e0b', boxShadow: 'none'}}>
                        <Plus size={18} />
                        <span>Add New Super Admin</span>
                    </button>
                </div>
            </div>

            {showModal && (
                <div className="sidebar-overlay" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <div className="glass-card" style={{width: '400px', padding: '2rem', animation: 'fadeIn 0.3s ease'}}>
                        <h2 className="heading-md" style={{marginBottom: '1.5rem'}}>Add Super Admin</h2>
                        <form onSubmit={handleAddAdmin} style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
                            <div className="field-wrapper">
                                <label className="input-label">Full Name</label>
                                <input 
                                    required
                                    className="input-field" 
                                    value={newAdmin.name}
                                    onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div className="field-wrapper">
                                <label className="input-label">Email Address</label>
                                <input 
                                    required
                                    type="email"
                                    className="input-field" 
                                    value={newAdmin.email}
                                    onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                                    placeholder="admin@platform.com"
                                />
                            </div>
                            <div className="field-wrapper">
                                <label className="input-label">Initial Password</label>
                                <input 
                                    required
                                    type="password"
                                    className="input-field" 
                                    value={newAdmin.password}
                                    onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                                    placeholder="Set password"
                                />
                            </div>
                            <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                                <button type="button" className="btn-secondary tap-button" onClick={() => setShowModal(false)} style={{flex: 1}}>Cancel</button>
                                <button type="submit" className="btn-primary tap-button" style={{flex: 1}}>Create Admin</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="glass-table-container">
                <table className="glass-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((admin) => (
                            <tr key={admin.id}>
                                <td style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                                    <div className="avatar-circle" style={{width: '2rem', height: '2rem', backgroundColor: 'var(--accent-glow)', color: 'var(--accent)'}}>
                                        {admin.name[0]}
                                    </div>
                                    <span style={{fontWeight: 700}}>{admin.name}</span>
                                </td>
                                <td style={{opacity: 0.7}}>{admin.email}</td>
                                <td>
                                    <span className="badge" style={{backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1'}}>
                                        {admin.role.replace('_', ' ').toUpperCase()}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-group">
                                        <button className="btn-icon edit">
                                            <Edit3 size={16} />
                                        </button>
                                        <button className="btn-icon delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredAdmins.length === 0 && (
                    <div className="empty-state">No administrators found.</div>
                )}
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
        </div>
    );
};

export default AdminUserManagement;


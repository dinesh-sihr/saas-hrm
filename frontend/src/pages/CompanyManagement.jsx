import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Edit3, Trash2, Building2, Mail, CheckCircle, XCircle, RotateCcw, Clock } from 'lucide-react';
import Pagination from '../components/Pagination';
import '../styles/Dashboard.css';
import '../styles/UI.css';

const CompanyManagement = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [newCompany, setNewCompany] = useState({ name: '', email: '', plan: 'basic', managerName: '', password: '' });
    const [editData, setEditData] = useState({ name: '', logo: '', portal_header: '', portal_config: {} });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const fetchCompanies = async () => {
        try {
            const response = await axios.get('/api/companies');
            setCompanies(response.data);
        } catch (error) {
            console.error('Error fetching companies:', error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        try {
            await axios.patch(`/api/companies/${id}/status`, { status: newStatus });
            fetchCompanies();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const handleAddCompany = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/companies', newCompany);
            setShowModal(false);
            setNewCompany({ name: '', email: '', plan: 'basic', managerName: '', password: '' });
            fetchCompanies();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to add company');
        }
    };

    const handleEditClick = (company) => {
        setSelectedCompany(company);
        setEditData({
            name: company.name,
            logo: company.logo || '',
            portal_header: company.portal_header || '',
            portal_config: company.portal_config || {}
        });
        setShowEditModal(true);
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditData(prev => ({ ...prev, logo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateDetails = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/companies/${selectedCompany.id}`, editData);
            setShowEditModal(false);
            fetchCompanies();
        } catch (error) {
            alert('Failed to update company details');
        }
    };


    const handleDeleteCompany = async (e, id, name) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete ${name}? This will remove all associated users, attendance, and data.`)) {
            try {
                await axios.delete(`/api/companies/${id}`);
                fetchCompanies();
            } catch (error) {
                alert('Failed to delete company');
            }
        }
    };


    const filteredCompanies = companies.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredCompanies.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);

    if (loading) return <div className="empty-state">Loading companies...</div>;

    return (
        <div className="dashboard-container">
            <div className="feed-header" style={{marginBottom: '2rem'}}>
                <div>
                    <h1 className="heading-lg">Companies Management</h1>
                    <p className="input-label" style={{textTransform: 'none', marginTop: '0.25rem'}}>Manage all client organizations and their status</p>
                </div>
                <div className="header-user-actions">
                    <div className="input-group" style={{width: '300px', marginBottom: '0'}}>
                        <Search className="input-icon" size={16} />
                        <input 
                            type="text" 
                            className="input-field" 
                            placeholder="Search by name or email..." 
                            style={{height: '3rem', borderRadius: '1rem'}}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={() => setShowModal(true)} className="btn-primary" style={{width: 'auto', padding: '0 1.5rem', height: '3rem', borderRadius: '1rem'}}>
                        <Plus size={18} />
                        <span>Add Company</span>
                    </button>
                </div>
            </div>

            {showModal && (
                <div className="sidebar-overlay" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <div className="glass-card" style={{width: '400px', padding: '2rem', animation: 'fadeIn 0.3s ease'}}>
                        <h2 className="heading-md" style={{marginBottom: '1.5rem'}}>Register New Company</h2>
                        <form onSubmit={handleAddCompany} style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
                            <div className="field-wrapper">
                                <label className="input-label">Company Name</label>
                                <input 
                                    required
                                    className="input-field" 
                                    value={newCompany.name}
                                    onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                                    placeholder="Enter company name"
                                />
                            </div>
                            <div className="field-wrapper">
                                <label className="input-label">Contact Email</label>
                                <input 
                                    required
                                    type="email"
                                    className="input-field" 
                                    value={newCompany.email}
                                    onChange={(e) => setNewCompany({...newCompany, email: e.target.value})}
                                    placeholder="e.g. contact@company.com"
                                />
                            </div>
                            <div className="field-wrapper">
                                <label className="input-label">Manager Name</label>
                                <input 
                                    required
                                    className="input-field" 
                                    value={newCompany.managerName}
                                    onChange={(e) => setNewCompany({...newCompany, managerName: e.target.value})}
                                    placeholder="Enter primary manager's name"
                                />
                            </div>
                            <div className="field-wrapper">
                                <label className="input-label">Manager Password</label>
                                <input 
                                    required
                                    type="password"
                                    className="input-field" 
                                    value={newCompany.password}
                                    onChange={(e) => setNewCompany({...newCompany, password: e.target.value})}
                                    placeholder="Set initial password"
                                />
                            </div>
                            <div className="field-wrapper">
                                <label className="input-label">Initial Plan</label>
                                <select 
                                    className="input-field" 
                                    value={newCompany.plan}
                                    onChange={(e) => setNewCompany({...newCompany, plan: e.target.value})}
                                    style={{padding: '0 1rem'}}
                                >
                                    <option value="basic">Basic (Trial)</option>
                                    <option value="premium">Premium</option>
                                </select>
                            </div>
                            <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                                <button type="submit" className="btn-primary">Create Company</button>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-primary" style={{backgroundColor: 'transparent', border: '1px solid var(--card-border)', color: 'inherit'}}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditModal && (
                <div className="sidebar-overlay" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <div className="glass-card" style={{width: '500px', padding: '2rem', animation: 'fadeIn 0.3s ease'}}>
                        <h2 className="heading-md" style={{marginBottom: '1.5rem'}}>Edit Portal Details: {selectedCompany?.name}</h2>
                        <form onSubmit={handleUpdateDetails} style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
                            <div className="field-wrapper">
                                <label className="input-label">Display Name</label>
                                <input 
                                    required
                                    className="input-field" 
                                    value={editData.name}
                                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                                />
                            </div>
                            <div className="field-wrapper">
                                <label className="input-label">Company Logo</label>
                                <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                                    <div className="avatar-circle" style={{width: '3.5rem', height: '3.5rem', borderRadius: '1rem', overflow: 'hidden', backgroundColor: 'var(--accent-glow)'}}>
                                        {editData.logo ? (
                                            <img src={editData.logo} alt="Logo Preview" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                                        ) : (
                                            <Building2 size={20} style={{color: 'var(--accent)'}} />
                                        )}
                                    </div>
                                    <input 
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        id="logo-upload"
                                        style={{display: 'none'}}
                                    />
                                    <label htmlFor="logo-upload" className="btn-secondary" style={{cursor: 'pointer', margin: 0}}>
                                        Choose Logo File
                                    </label>
                                </div>
                            </div>
                            <div className="field-wrapper">
                                <label className="input-label">Portal Header Content</label>
                                <textarea 
                                    className="input-field" 
                                    style={{minHeight: '80px', paddingTop: '10px'}}
                                    value={editData.portal_header}
                                    onChange={(e) => setEditData({...editData, portal_header: e.target.value})}
                                    placeholder="Custom message for company employees..."
                                />
                            </div>
                            <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                                <button type="submit" className="btn-primary">Save Changes</button>
                                <button type="button" onClick={() => setShowEditModal(false)} className="btn-primary" style={{backgroundColor: 'transparent', border: '1px solid var(--card-border)', color: 'inherit'}}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="glass-table-container">
                <table className="glass-table">
                    <thead>
                        <tr>
                            <th>Company Details</th>
                            <th>Contact Email</th>
                            <th>Status</th>
                            <th>Registration Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((company) => (
                            <tr key={company.id} style={{cursor: 'pointer'}} onClick={() => handleEditClick(company)}>
                                <td style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                                    <div className="avatar-circle" style={{backgroundColor: 'var(--accent-glow)', color: 'var(--accent)', overflow: 'hidden'}}>
                                        {company.logo ? (
                                            <img src={company.logo} alt="Logo" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                                        ) : (
                                            <Building2 size={16} />
                                        )}
                                    </div>
                                    <div>
                                        <p style={{fontWeight: 700, margin: 0}}>{company.name}</p>
                                        <span style={{fontSize: '0.7rem', opacity: 0.5}}>ID: #{company.id}</span>
                                    </div>
                                </td>
                                <td>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                        <Mail size={14} style={{opacity: 0.5}} />
                                        <span>{company.email}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${company.status}`} style={{
                                        backgroundColor: company.status === 'active' 
                                            ? 'rgba(16, 185, 129, 0.1)' 
                                            : company.status === 'pending'
                                                ? 'rgba(245, 158, 11, 0.1)'
                                                : 'rgba(239, 68, 68, 0.1)',
                                        color: company.status === 'active' 
                                            ? '#10b981' 
                                            : company.status === 'pending'
                                                ? '#f59e0b'
                                                : '#ef4444'
                                    }}>
                                        {company.status === 'active' ? (
                                            <CheckCircle size={10} style={{marginRight: '4px'}} />
                                        ) : company.status === 'pending' ? (
                                            <Clock size={10} style={{marginRight: '4px'}} />
                                        ) : (
                                            <XCircle size={10} style={{marginRight: '4px'}} />
                                        )}
                                        {company.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{opacity: 0.7}}>
                                    {new Date(company.created_at).toLocaleDateString()}
                                </td>
                                <td>
                                    <div className="action-group">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleStatus(company.id, company.status);
                                            }}
                                            className="btn-icon edit" 
                                            title="Toggle Status"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                        <button 
                                            onClick={(e) => handleDeleteCompany(e, company.id, company.name)}
                                            className="btn-icon delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredCompanies.length === 0 && (
                    <div className="empty-state">No companies found matching your search.</div>
                )}
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
        </div>
    );
};

export default CompanyManagement;


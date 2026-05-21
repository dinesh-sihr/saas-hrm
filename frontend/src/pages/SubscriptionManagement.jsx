import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, Calendar, RefreshCcw, ShieldCheck, AlertCircle, Plus } from 'lucide-react';
import Pagination from '../components/Pagination';
import '../styles/Dashboard.css';
import '../styles/UI.css';

const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(new Date(dateString));
};

const SubscriptionManagement = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newSubscription, setNewSubscription] = useState({ company_id: '', plan: 'basic' });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchSubs = async () => {
        try {
            const response = await axios.get('/api/subscriptions');
            setSubscriptions(response.data);
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanies = async () => {
        try {
            const response = await axios.get('/api/super-admin/companies');
            setCompanies(response.data);
            if (response.data.length > 0) {
                setNewSubscription(prev => ({...prev, company_id: response.data[0].id}));
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    };

    useEffect(() => {
        fetchSubs();
        fetchCompanies();
    }, []);

    const handleAddSubscription = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/subscriptions', newSubscription);
            setShowModal(false);
            fetchSubs();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to add subscription');
        }
    };

    const handleRenew = async (id) => {
        try {
            await axios.patch(`/api/subscriptions/${id}/renew`);
            fetchSubs();
        } catch (error) {
            alert('Failed to renew subscription');
        }
    };

    const handleCancel = async (id) => {
        if (window.confirm('Are you sure you want to cancel this subscription?')) {
            try {
                await axios.patch(`/api/subscriptions/${id}/cancel`);
                fetchSubs();
            } catch (error) {
                alert('Failed to cancel subscription');
            }
        }
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = subscriptions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(subscriptions.length / itemsPerPage);

    if (loading) return <div className="empty-state">Loading subscription data...</div>;

    return (
        <div className="dashboard-container">
            <div className="feed-header" style={{marginBottom: '2rem'}}>
                <div>
                    <h1 className="heading-lg">Subscription Plans</h1>
                    <p className="input-label" style={{textTransform: 'none', marginTop: '0.25rem'}}>Monitor license status and renewals for all clients</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary" style={{width: 'auto', padding: '0 1.5rem', height: '3rem', borderRadius: '1rem'}}>
                    <Plus size={18} />
                    <span>Add New Subscription</span>
                </button>
            </div>

            {showModal && (
                <div className="sidebar-overlay" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <div className="glass-card" style={{width: '400px', padding: '2rem', animation: 'fadeIn 0.3s ease'}}>
                        <h2 className="heading-md" style={{marginBottom: '1.5rem'}}>Add New Subscription</h2>
                        <form onSubmit={handleAddSubscription} style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
                            <div className="field-wrapper">
                                <label className="input-label">Company Name</label>
                                <select 
                                    required
                                    className="input-field" 
                                    value={newSubscription.company_id}
                                    onChange={(e) => setNewSubscription({...newSubscription, company_id: e.target.value})}
                                >
                                    <option value="" disabled>Select a company</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="field-wrapper">
                                <label className="input-label">Initial Plan</label>
                                <select 
                                    className="input-field" 
                                    value={newSubscription.plan}
                                    onChange={(e) => setNewSubscription({...newSubscription, plan: e.target.value})}
                                >
                                    <option value="basic">Basic (30 Days)</option>
                                    <option value="pro">Pro (30 Days)</option>
                                    <option value="enterprise">Enterprise (30 Days)</option>
                                </select>
                            </div>
                            <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                                <button type="button" className="btn-secondary tap-button" onClick={() => setShowModal(false)} style={{flex: 1}}>Cancel</button>
                                <button type="submit" className="btn-primary tap-button" style={{flex: 1}}>Create Subscription</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="glass-table-container">
                <table className="glass-table">
                    <thead>
                        <tr>
                            <th>Company</th>
                            <th>Active Plan</th>
                            <th>Start Date</th>
                            <th>Expiry Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((sub) => (
                            <tr key={sub.id}>
                                <td style={{fontWeight: 700}}>{sub.company_name || 'Loading...'}</td>
                                <td>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                        <ShieldCheck size={14} style={{color: 'var(--accent)'}} />
                                        <span style={{fontWeight: 600}}>{sub.plan.toUpperCase()}</span>
                                    </div>
                                </td>
                                <td style={{opacity: 0.7}}>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                        <Calendar size={14} />
                                        {formatDate(sub.start_date)}
                                    </div>
                                </td>
                                <td style={{opacity: 0.7}}>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: new Date(sub.end_date) < new Date() ? '#ef4444' : 'inherit'}}>
                                        <AlertCircle size={14} />
                                        {formatDate(sub.end_date)}
                                    </div>
                                </td>
                                <td>
                                    <span className="badge" style={{
                                        backgroundColor: sub.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: sub.status === 'active' ? '#10b981' : '#ef4444'
                                    }}>
                                        {sub.status.toUpperCase()}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-group">
                                        <button 
                                            onClick={() => handleRenew(sub.id)}
                                            className="btn-icon edit" 
                                            title="Renew 30 Days"
                                            style={{color: 'var(--accent)'}}
                                        >
                                            <RefreshCcw size={16} />
                                        </button>
                                        {sub.status !== 'cancelled' && (
                                            <button 
                                                onClick={() => handleCancel(sub.id)}
                                                className="btn-icon delete" 
                                                title="Cancel Subscription"
                                            >
                                                <ShieldCheck size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                {subscriptions.length === 0 && (
                    <div className="empty-state">No active subscriptions found in the database.</div>
                )}
            </div>
        </div>
    );
};

export default SubscriptionManagement;

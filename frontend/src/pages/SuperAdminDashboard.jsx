import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Rocket, LayoutGrid, EyeOff, AlertTriangle, ExternalLink } from 'lucide-react';
import Pagination from '../components/Pagination';
import '../styles/Dashboard.css';
import '../styles/UI.css';

const SuperAdminDashboard = () => {
    const [stats, setStats] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, companiesRes] = await Promise.all([
                    axios.get('/api/super-admin/stats'),
                    axios.get('/api/super-admin/recent-companies')
                ]);

                const formattedStats = [
                    { label: 'Total Companies', value: statsRes.data.totalCompanies, icon: Rocket, theme: {bg: 'rgba(99, 102, 241, 0.1)', color: '#6366f1'} },
                    { label: 'Active Companies', value: statsRes.data.activeCompanies, icon: LayoutGrid, theme: {bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981'} },
                    { label: 'Inactive Companies', value: statsRes.data.inactiveCompanies, icon: EyeOff, theme: {bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b'} },
                    { label: 'License Expired', value: statsRes.data.expiredLicenses, icon: AlertTriangle, theme: {bg: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e'} },
                ];

                setStats(formattedStats);
                setCompanies(companiesRes.data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = companies.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(companies.length / itemsPerPage);

    if (loading) return <div className="empty-state">Loading dashboard data...</div>;

    return (
        <div className="dashboard-container">
            <div className="stats-grid">
                {stats.map((stat, i) => (
                    <div key={i} className="stat-item glass-card">
                        <div className="stat-icon-box" style={{backgroundColor: stat.theme.bg, color: stat.theme.color}}>
                            <stat.icon size={22} />
                        </div>
                        <div className="stat-content">
                            <p className="text-label" style={{marginBottom: '0'}}>{stat.label}</p>
                            <h3>{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="glass-card" style={{padding: '2rem'}}>
                <div className="feed-header">
                    <h3 className="heading-md">Recently Registered Companies</h3>
                    
                </div>

                <div className="glass-table-container" style={{marginTop: '1.5rem'}}>
                    <table className="glass-table">
                        <thead>
                            <tr>
                                <th>Company Name</th>
                                <th>Email</th>
                                <th>Details</th>
                                <th>Subscription</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((company) => (
                                <tr key={company.id}>
                                    <td style={{fontWeight: 700}}>{company.name}</td>
                                    <td style={{opacity: 0.7}}>{company.email}</td>
                                    <td>
                                        <p style={{fontSize: '0.75rem', opacity: 0.6}}>Verified: ✅</p>
                                        <p style={{fontSize: '0.75rem', opacity: 0.6}}>Reg: {company.date}</p>
                                    </td>
                                    <td>
                                        <span className="badge" style={{backgroundColor: 'var(--accent-glow)', color: 'var(--accent)'}}>
                                            {company.plan}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="badge" style={{backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}}>
                                            {company.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;

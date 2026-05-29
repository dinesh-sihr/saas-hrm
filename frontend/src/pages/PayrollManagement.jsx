import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    DollarSign, Search, Download, Trash2, X, Check,
    CreditCard, TrendingUp, Calendar, Clock, Printer,
    Wallet, ChevronRight, Eye, ShieldAlert, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import '../styles/UI.css';

const PayrollManagement = () => {
    const { user } = useAuth();
    const isManager = user?.role === 'manager' || user?.role === 'admin';

    const getTodayStr = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    const [activeTab, setActiveTab] = useState('accruals');
    const [range, setRange] = useState({ from: getTodayStr(firstDay), to: getTodayStr(today) });
    const [accrualsList, setAccrualsList] = useState([]);
    const [historyList, setHistoryList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [btnLoading, setBtnLoading] = useState(false);
    const [overrides, setOverrides] = useState({});
    
    const [selectedSlipEmp, setSelectedSlipEmp] = useState(null);
    const [slipDetails, setSlipDetails] = useState(null);
    const [slipLoading, setSlipLoading] = useState(false);
    const [slipError, setSlipError] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const loadAccruals = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/payroll/employees-summary?from=${range.from}&to=${range.to}`);
            setAccrualsList(res.data);
            const initialOverrides = {};
            res.data.forEach(emp => {
                initialOverrides[emp.id] = emp.netSalary;
            });
            setOverrides(initialOverrides);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadHistory = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/payroll');
            setHistoryList(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'accruals') {
            loadAccruals();
        } else {
            loadHistory();
        }
    }, [activeTab]);

    const handleSaveOverride = async (empId, isApprove = false) => {
        const emp = accrualsList.find(e => e.id === empId);
        if (!emp) return;

        const dateFrom = new Date(range.from);
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthName = monthNames[dateFrom.getMonth()];
        const yearVal = dateFrom.getFullYear();

        const amount = overrides[empId] !== undefined ? parseFloat(overrides[empId]) : emp.netSalary;

        try {
            setBtnLoading(true);
            await axios.post('/api/payroll/save-override', {
                user_id: empId,
                month: monthName,
                year: yearVal,
                net_salary: amount,
                status: isApprove ? 'paid' : 'pending'
            });
            alert(isApprove ? 'Payment approved and payroll slip generated!' : 'Final pay override saved successfully.');
            loadAccruals();
        } catch (err) {
            console.error(err);
            alert('Failed to save payroll changes.');
        } finally {
            setBtnLoading(false);
        }
    };

    const removeHistoryRecord = async (recordId) => {
        if (!window.confirm('Are you sure you want to delete this payment record?')) return;
        try {
            await axios.delete(`/api/payroll/${recordId}`);
            loadHistory();
        } catch (err) {
            console.error(err);
            alert('Failed to delete history record.');
        }
    };

    const openSlipModal = async (emp) => {
        setSelectedSlipEmp(emp);
        setSlipLoading(true);
        setSlipError('');
        setSlipDetails(null);
        try {
            const res = await axios.get(`/api/payroll/calculate?user_id=${emp.id}&from=${range.from}&to=${range.to}`);
            setSlipDetails(res.data);
        } catch (err) {
            console.error(err);
            setSlipError('Failed to fetch itemized slip ledger details.');
        } finally {
            setSlipLoading(false);
        }
    };

    const loadScript = (url) => {
        return new Promise((resolve) => {
            if (document.querySelector(`script[src="${url}"]`)) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleDownloadPDF = async () => {
        setSlipLoading(true);
        setSlipError('');
        try {
            if (!window.html2canvas) {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
            }
            if (!window.jspdf) {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            }

            if (!window.html2canvas || !window.jspdf) {
                setSlipError('Failed to load required PDF generation libraries. Please verify your connection.');
                setSlipLoading(false);
                return;
            }

            const element = document.querySelector('.modal-print-area');
            element.classList.add('force-light-mode');
            let canvas;
            try {
                canvas = await window.html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false
                });
            } finally {
                element.classList.remove('force-light-mode');
            }

            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`Salary_Report_${selectedSlipEmp.name}_${range.from}_to_${range.to}.pdf`);
        } catch (err) {
            console.error(err);
            setSlipError('Error generating PDF report file.');
        } finally {
            setSlipLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleOverrideChange = (empId, val) => {
        setOverrides({
            ...overrides,
            [empId]: val
        });
    };

    const listData = activeTab === 'accruals' ? accrualsList : historyList;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = listData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(listData.length / itemsPerPage);

    const totalCalculatedPayout = accrualsList.reduce((sum, e) => sum + e.earnedSalary, 0);
    const totalCompanyPayout = historyList.reduce((sum, r) => sum + parseFloat(r.net_salary), 0);

    return (
        <div className="dashboard-container" style={{ paddingBottom: '3rem' }}>
            <style>{`
                .force-light-mode {
                    background: #ffffff !important;
                    color: #1f2937 !important;
                    border: none !important;
                    box-shadow: none !important;
                }
                .force-light-mode * {
                    color: #4b5563 !important;
                    border-color: #e5e7eb !important;
                    background: transparent !important;
                }
                .force-light-mode .heading-md,
                .force-light-mode .heading-sm {
                    color: #111827 !important;
                }
                .force-light-mode .text-label {
                    color: #6b7280 !important;
                }
                .force-light-mode .employee-details-box {
                    background: #f3f4f6 !important;
                }
                .force-light-mode .employee-details-box * {
                    color: #1f2937 !important;
                }
                .force-light-mode .net-earnings-box {
                    background: #f5f3ff !important;
                    border: 1px solid #4f46e5 !important;
                }
                .force-light-mode .net-earnings-box h2,
                .force-light-mode .net-earnings-box p {
                    color: #4f46e5 !important;
                }
                .force-light-mode table th {
                    border-bottom: 2px solid #e5e7eb !important;
                    color: #1f2937 !important;
                }
                .force-light-mode table td {
                    border-bottom: 1px solid #e5e7eb !important;
                    color: #4b5563 !important;
                }

                .print-area {
                    display: none;
                }

                @media print {
                    .sidebar, .navbar, .no-print, button, .top-header, .sidebar-link, .modal-overlay, .dashboard-header, .feed-header, .glass-card, .tabs-container {
                        display: none !important;
                    }
                    .main-content {
                        margin-left: 0 !important;
                        padding: 0 !important;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    .print-area {
                        display: block !important;
                        visibility: visible !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        background: white !important;
                        color: black !important;
                        padding: 2rem !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                    .print-area * {
                        color: black !important;
                    }
                }
            `}</style>

            <div className="no-print">
                <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
                    <div>
                        <h1 className="heading-lg">Salary Management</h1>
                        <p className="text-label" style={{ textTransform: 'none' }}>Review real-time attendance logs, configure payouts, and manage team salaries</p>
                    </div>
                </div>

                <div className="tabs-container" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--card-border)', marginBottom: '2rem', paddingBottom: '0.5rem' }}>
                    <button 
                        onClick={() => { setActiveTab('accruals'); setCurrentPage(1); }} 
                        className={`tab-btn ${activeTab === 'accruals' ? 'active' : ''}`}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: activeTab === 'accruals' ? 'var(--accent)' : 'var(--text-secondary)',
                            fontSize: '1rem',
                            fontWeight: 600,
                            padding: '0.5rem 1rem',
                            borderBottom: activeTab === 'accruals' ? '2px solid var(--accent)' : 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Active Accruals (Pending)
                    </button>
                    <button 
                        onClick={() => { setActiveTab('history'); setCurrentPage(1); }} 
                        className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: activeTab === 'history' ? 'var(--accent)' : 'var(--text-secondary)',
                            fontSize: '1rem',
                            fontWeight: 600,
                            padding: '0.5rem 1rem',
                            borderBottom: activeTab === 'history' ? '2px solid var(--accent)' : 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Payment Ledger (Paid)
                    </button>
                </div>

                {activeTab === 'accruals' ? (
                    <>
                        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                    <div className="field-wrapper" style={{ margin: 0 }}>
                                        <label className="input-label">From Date</label>
                                        <input type="date" className="input-field" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} style={{ paddingLeft: '1rem' }} />
                                    </div>
                                    <div className="field-wrapper" style={{ margin: 0 }}>
                                        <label className="input-label">To Date</label>
                                        <input type="date" className="input-field" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} style={{ paddingLeft: '1rem' }} />
                                    </div>
                                    <button onClick={loadAccruals} className="btn-primary" style={{ margin: 0, height: '42px', display: 'flex', alignItems: 'center', padding: '0 1.5rem' }}>
                                        Calculate Salaries
                                    </button>
                                </div>
                                <div style={{ display: 'flex', gap: '1.5rem' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <p className="text-label">Est. Total Accrued</p>
                                        <h2 className="heading-md" style={{ color: 'var(--accent)', marginTop: '0.25rem' }}>₹{totalCalculatedPayout.toLocaleString('en-IN')}</h2>
                                    </div>
                                    <div style={{ textAlign: 'right', borderLeft: '1px solid var(--card-border)', paddingLeft: '1.5rem' }}>
                                        <p className="text-label">Active Team Size</p>
                                        <h2 className="heading-md" style={{ marginTop: '0.25rem' }}>{accrualsList.length} Members</h2>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            {loading ? (
                                <div className="empty-state">Computing live attendance salaries...</div>
                            ) : (
                                <div className="glass-table-container">
                                    <table className="glass-table">
                                        <thead>
                                            <tr>
                                                <th>Employee</th>
                                                <th>Hours / Worked Days</th>
                                                <th>Base Wage</th>
                                                <th>Absent Deductions</th>
                                                <th>Calculated Net</th>
                                                <th style={{ width: '180px' }}>Override Net Pay</th>
                                                <th>Status</th>
                                                <th style={{ textAlign: 'right' }}>Slip Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.length > 0 ? (
                                                currentItems.map((emp) => (
                                                    <tr key={emp.id}>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                <div className="avatar-circle" style={{ width: '2rem', height: '2rem', fontSize: '0.7rem', background: 'var(--accent)' }}>
                                                                    {emp.name?.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <span style={{ fontWeight: 600, display: 'block' }}>{emp.name}</span>
                                                                    <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{emp.email}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span style={{ fontWeight: 600 }}>{emp.totalEffectiveHours.toFixed(2)} Hrs</span>
                                                            <span style={{ fontSize: '0.75rem', opacity: 0.5, display: 'block' }}>({emp.actualWorkedDays.toFixed(2)} Days worked)</span>
                                                        </td>
                                                        <td>₹{emp.basicSalary.toLocaleString('en-IN')}</td>
                                                        <td style={{ color: emp.deductions > 0 ? '#f43f5e' : 'inherit' }}>
                                                            {emp.deductions > 0 ? `-₹${emp.deductions.toLocaleString('en-IN')}` : '₹0'}
                                                        </td>
                                                        <td><span style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{emp.earnedSalary.toLocaleString('en-IN')}</span></td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                                                                <span style={{ opacity: 0.6 }}>₹</span>
                                                                <input 
                                                                    type="number" 
                                                                    disabled={emp.status === 'paid' || btnLoading}
                                                                    value={overrides[emp.id] !== undefined ? overrides[emp.id] : emp.netSalary} 
                                                                    onChange={(e) => handleOverrideChange(emp.id, e.target.value)} 
                                                                    style={{ 
                                                                        margin: 0, 
                                                                        padding: '0 0.75rem', 
                                                                        height: '38px', 
                                                                        width: '120px', 
                                                                        fontSize: '0.95rem', 
                                                                        color: '#ffffff', 
                                                                        backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                                                                        border: '1px solid rgba(255, 255, 255, 0.3)', 
                                                                        borderRadius: '0.5rem',
                                                                        fontWeight: '600',
                                                                        outline: 'none',
                                                                        boxSizing: 'border-box',
                                                                        textAlign: 'center'
                                                                    }} 
                                                                />
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="badge" style={{
                                                                backgroundColor: emp.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                                color: emp.status === 'paid' ? '#10b981' : '#f59e0b'
                                                            }}>
                                                                {emp.status.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <div className="action-group" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                                <button onClick={() => openSlipModal(emp)} className="btn-icon edit" title="View / Print Slip" style={{ color: 'var(--accent)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
                                                                    <Eye size={16} />
                                                                </button>
                                                                {emp.status !== 'paid' && (
                                                                    <>
                                                                        <button onClick={() => handleSaveOverride(emp.id, false)} disabled={btnLoading} className="btn-icon edit" title="Save Pay Override" style={{ color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                                                                            <Check size={16} />
                                                                        </button>
                                                                        <button onClick={() => handleSaveOverride(emp.id, true)} disabled={btnLoading} className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', height: '32px', margin: 0 }}>
                                                                            Approve & Pay
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                                                        <ShieldAlert size={40} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                                        <p>No active employees found in this corporate portal.</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #6366f1' }}>
                                <p className="text-label">Total Processed Payments</p>
                                <h2 className="heading-lg" style={{ margin: '0.5rem 0' }}>₹{totalCompanyPayout.toLocaleString('en-IN')}</h2>
                                <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Sum of all finalized official payslips</span>
                            </div>
                            <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
                                <p className="text-label">Processed Ledgers</p>
                                <h2 className="heading-lg" style={{ margin: '0.5rem 0' }}>{historyList.length} Payouts</h2>
                                <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Archived historical records</span>
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            {loading ? (
                                <div className="empty-state">Loading payment database...</div>
                            ) : (
                                <div className="glass-table-container">
                                    <table className="glass-table">
                                        <thead>
                                            <tr>
                                                <th>Team Member</th>
                                                <th>Month/Year</th>
                                                <th>Base Pay</th>
                                                <th>Bonuses (+)</th>
                                                <th>Deductions (-)</th>
                                                <th>Take-Home Pay</th>
                                                <th>Status</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.length > 0 ? (
                                                currentItems.map((record) => (
                                                    <tr key={record.id}>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                <div className="avatar-circle" style={{ width: '2rem', height: '2rem', fontSize: '0.7rem' }}>
                                                                    {record.employee_name?.charAt(0)}
                                                                </div>
                                                                <span style={{ fontWeight: 600 }}>{record.employee_name}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span style={{ fontWeight: 600 }}>{record.month}</span>
                                                            <span style={{ opacity: 0.5, fontSize: '0.75rem', marginLeft: '0.25rem' }}>{record.year}</span>
                                                        </td>
                                                        <td>₹{parseFloat(record.basic_salary).toLocaleString('en-IN')}</td>
                                                        <td style={{ color: '#10b981' }}>+₹{parseFloat(record.allowances).toLocaleString('en-IN')}</td>
                                                        <td style={{ color: '#ef4444' }}>-₹{parseFloat(record.deductions).toLocaleString('en-IN')}</td>
                                                        <td><span style={{ fontWeight: 700, color: '#6366f1' }}>₹{parseFloat(record.net_salary).toLocaleString('en-IN')}</span></td>
                                                        <td>
                                                            <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                                                PAID
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                                                                <button onClick={() => removeHistoryRecord(record.id)} className="btn-icon delete" title="Delete Record">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                                                        <DollarSign size={40} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                                        <p>No processed payroll ledgers found in this portal.</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {selectedSlipEmp && slipDetails && (
                <div className="print-area">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--card-border)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                        <div>
                            <h2 className="heading-md" style={{ color: 'var(--accent)' }}>{user?.company_name || 'SHNOOR HRM'}</h2>
                            <p className="text-label" style={{ textTransform: 'none', fontSize: '0.85rem' }}>Salary Calculation Slip</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontWeight: 600 }}>Period</p>
                            <p className="text-label" style={{ textTransform: 'none', fontSize: '0.85rem' }}>{range.from} to {range.to}</p>
                        </div>
                    </div>

                    <div className="employee-details-box" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem', background: 'var(--card-border)', padding: '1.5rem', borderRadius: '8px' }}>
                        <div>
                            <p className="input-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Employee Name</p>
                            <p style={{ fontWeight: 600, fontSize: '1rem' }}>{selectedSlipEmp.name}</p>
                            <p className="text-label" style={{ textTransform: 'none', fontSize: '0.85rem' }}>{selectedSlipEmp.email}</p>
                        </div>
                        <div>
                            <p className="input-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Employee ID</p>
                            <p style={{ fontWeight: 600, fontSize: '1rem' }}>EMP-{selectedSlipEmp.id}</p>
                            <p className="text-label" style={{ textTransform: 'none', fontSize: '0.85rem' }}>Role: EMPLOYEE</p>
                        </div>
                    </div>

                    <h3 className="heading-sm" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>Itemized Breakdown</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Basic Salary (Base Monthly)</span>
                            <span style={{ fontWeight: 600 }}>₹{slipDetails.basicSalary.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Unpaid / Absent Deductions</span>
                            <span style={{ fontWeight: 600, color: slipDetails.deductions > 0 ? '#f43f5e' : 'inherit' }}>-₹{slipDetails.deductions.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Standard Shift Hours (Daily)</span>
                            <span style={{ fontWeight: 600 }}>8.00 Hours</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Target Working Calendar (Days)</span>
                            <span style={{ fontWeight: 600 }}>26.00 Days</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Holidays Registered in Range</span>
                            <span style={{ fontWeight: 600 }}>-{slipDetails.holidaysCount}.00 Days</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Adjusted Standard Calendar Days</span>
                            <span style={{ fontWeight: 600 }}>{slipDetails.standardDays}.00 Days</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Total Working Hours Logged</span>
                            <span style={{ fontWeight: 600 }}>{slipDetails.totalEffectiveHours} Hours</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Earned Attendance Days Equivalent</span>
                            <span style={{ fontWeight: 600 }}>{slipDetails.actualWorkedDays} Days</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Calculated Net (Salary Engine)</span>
                            <span style={{ fontWeight: 600 }}>₹{slipDetails.earnedSalary.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Computed Daily Wage Rate</span>
                            <span style={{ fontWeight: 600 }}>₹{slipDetails.dailyRate.toLocaleString('en-IN')} / Day</span>
                        </div>
                    </div>

                    <div className="net-earnings-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(99, 102, 241, 0.08)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--accent)', marginBottom: '2.5rem' }}>
                        <div>
                            <p style={{ fontWeight: 600, color: 'var(--accent)', fontSize: '1.1rem' }}>Net Take-Home Pay (Final Payout)</p>
                            <p className="text-label" style={{ textTransform: 'none', fontSize: '0.8rem', marginTop: '0.25rem' }}>Based on final overridden or approved payment amount</p>
                        </div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)' }}>₹{slipDetails.netSalary.toLocaleString('en-IN')}</h2>
                    </div>

                    <h3 className="heading-sm" style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', marginTop: '2.5rem' }}>Itemized Daily Ledger</h3>
                    <div style={{ overflowX: 'auto', marginBottom: '2.5rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--card-border)', textAlign: 'left' }}>
                                    <th style={{ padding: '0.5rem', fontWeight: 600 }}>Date</th>
                                    <th style={{ padding: '0.5rem', fontWeight: 600 }}>Shift Hours</th>
                                    <th style={{ padding: '0.5rem', fontWeight: 600 }}>Daily Rate</th>
                                    <th style={{ padding: '0.5rem', fontWeight: 600, textAlign: 'right' }}>Earned Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {slipDetails.logs.map((log) => (
                                    <tr key={log.date} style={{ borderBottom: '1px solid var(--card-border)' }}>
                                        <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>{log.date}</td>
                                        <td style={{ padding: '0.5rem', fontWeight: 500 }}>{log.effectiveHours.toFixed(2)} Hrs</td>
                                        <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>₹{log.dailyRate.toLocaleString('en-IN')}</td>
                                        <td style={{ padding: '0.5rem', fontWeight: 600, textAlign: 'right' }}>₹{log.earnedAmount.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {selectedSlipEmp && (
                <div className="modal-overlay" onClick={() => setSelectedSlipEmp(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000, overflowY: 'auto', padding: '2rem 0' }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ 
                        maxWidth: '850px', 
                        width: '90%', 
                        background: 'var(--card-bg)', 
                        position: 'relative', 
                        border: '1px solid var(--card-border)', 
                        padding: '2.5rem', 
                        maxHeight: '90vh', 
                        overflowY: 'auto',
                        borderRadius: '1.5rem',
                        backdropFilter: 'blur(40px)',
                        boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.05)'
                    }}>
                        <div className="feed-header no-print" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                            <h3 className="heading-md">Employee Salary Slip</h3>
                            <button onClick={() => setSelectedSlipEmp(null)} className="btn-icon" style={{ cursor: 'pointer' }}><X size={18} /></button>
                        </div>

                        {slipLoading ? (
                            <div className="empty-state">Loading itemized payroll calculations...</div>
                        ) : slipError ? (
                            <div className="empty-state" style={{ color: '#f43f5e' }}>{slipError}</div>
                        ) : slipDetails ? (
                            <div>
                                <div className="modal-print-area">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--card-border)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                                        <div>
                                            <h2 className="heading-md" style={{ color: 'var(--accent)' }}>{user?.company_name || 'SHNOOR HRM'}</h2>
                                            <p className="text-label" style={{ textTransform: 'none', fontSize: '0.85rem' }}>Salary Calculation Slip</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontWeight: 600 }}>Period</p>
                                            <p className="text-label" style={{ textTransform: 'none', fontSize: '0.85rem' }}>{range.from} to {range.to}</p>
                                        </div>
                                    </div>

                                    <div className="employee-details-box" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem', background: 'var(--card-border)', padding: '1.5rem', borderRadius: '8px' }}>
                                        <div>
                                            <p className="input-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Employee Name</p>
                                            <p style={{ fontWeight: 600, fontSize: '1rem' }}>{selectedSlipEmp.name}</p>
                                            <p className="text-label" style={{ textTransform: 'none', fontSize: '0.85rem' }}>{selectedSlipEmp.email}</p>
                                        </div>
                                        <div>
                                            <p className="input-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Employee ID</p>
                                            <p style={{ fontWeight: 600, fontSize: '1rem' }}>EMP-{selectedSlipEmp.id}</p>
                                            <p className="text-label" style={{ textTransform: 'none', fontSize: '0.85rem' }}>Role: EMPLOYEE</p>
                                        </div>
                                    </div>

                                    <h3 className="heading-sm" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>Itemized Breakdown</h3>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Basic Salary (Base Monthly)</span>
                                            <span style={{ fontWeight: 600 }}>₹{slipDetails.basicSalary.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Unpaid / Absent Deductions</span>
                                            <span style={{ fontWeight: 600, color: slipDetails.deductions > 0 ? '#f43f5e' : 'inherit' }}>-₹{slipDetails.deductions.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Standard Shift Hours (Daily)</span>
                                            <span style={{ fontWeight: 600 }}>8.00 Hours</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Target Working Calendar (Days)</span>
                                            <span style={{ fontWeight: 600 }}>26.00 Days</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Holidays Registered in Range</span>
                                            <span style={{ fontWeight: 600 }}>-{slipDetails.holidaysCount}.00 Days</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Adjusted Standard Calendar Days</span>
                                            <span style={{ fontWeight: 600 }}>{slipDetails.standardDays}.00 Days</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Total Working Hours Logged</span>
                                            <span style={{ fontWeight: 600 }}>{slipDetails.totalEffectiveHours} Hours</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Earned Attendance Days Equivalent</span>
                                            <span style={{ fontWeight: 600 }}>{slipDetails.actualWorkedDays} Days</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Calculated Net (Salary Engine)</span>
                                            <span style={{ fontWeight: 600 }}>₹{slipDetails.earnedSalary.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Computed Daily Wage Rate</span>
                                            <span style={{ fontWeight: 600 }}>₹{slipDetails.dailyRate.toLocaleString('en-IN')} / Day</span>
                                        </div>
                                    </div>

                                    <div className="net-earnings-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(99, 102, 241, 0.08)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--accent)', marginBottom: '2.5rem' }}>
                                        <div>
                                            <p style={{ fontWeight: 600, color: 'var(--accent)', fontSize: '1.1rem' }}>Net Take-Home Pay (Final Payout)</p>
                                            <p className="text-label" style={{ textTransform: 'none', fontSize: '0.8rem', marginTop: '0.25rem' }}>Based on final overridden or approved payment amount</p>
                                        </div>
                                        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)' }}>₹{slipDetails.netSalary.toLocaleString('en-IN')}</h2>
                                    </div>

                                    <h3 className="heading-sm" style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', marginTop: '2.5rem' }}>Itemized Daily Ledger</h3>
                                    <div style={{ overflowX: 'auto', marginBottom: '2.5rem' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid var(--card-border)', textAlign: 'left' }}>
                                                    <th style={{ padding: '0.5rem', fontWeight: 600 }}>Date</th>
                                                    <th style={{ padding: '0.5rem', fontWeight: 600 }}>Shift Hours</th>
                                                    <th style={{ padding: '0.5rem', fontWeight: 600 }}>Daily Rate</th>
                                                    <th style={{ padding: '0.5rem', fontWeight: 600, textAlign: 'right' }}>Earned Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {slipDetails.logs.map((log) => (
                                                    <tr key={log.date} style={{ borderBottom: '1px solid var(--card-border)' }}>
                                                        <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>{log.date}</td>
                                                        <td style={{ padding: '0.5rem', fontWeight: 500 }}>{log.effectiveHours.toFixed(2)} Hrs</td>
                                                        <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>₹{log.dailyRate.toLocaleString('en-IN')}</td>
                                                        <td style={{ padding: '0.5rem', fontWeight: 600, textAlign: 'right' }}>₹{log.earnedAmount.toLocaleString('en-IN')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
                                    <button 
                                        onClick={handlePrint} 
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            color: 'var(--text-primary, #ffffff)',
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            outline: 'none'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                                        }}
                                    >
                                        <Printer size={16} />
                                        <span>Print Slip</span>
                                    </button>
                                    <button 
                                        onClick={handleDownloadPDF} 
                                        disabled={slipLoading}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '12px',
                                            border: 'none',
                                            background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                                            color: '#ffffff',
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                                            outline: 'none'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.45)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.3)';
                                        }}
                                    >
                                        <Download size={16} />
                                        <span>Download PDF</span>
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrollManagement;

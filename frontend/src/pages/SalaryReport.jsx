import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Wallet, Clock, Printer, Download, AlertCircle, FileText, Landmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';
import '../styles/UI.css';

const SalaryReport = () => {
    const { user } = useAuth();
    
    const getMonthDates = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const formatDate = (date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };
        
        return {
            start: formatDate(start),
            end: formatDate(end)
        };
    };

    const dates = getMonthDates();
    const [range, setRange] = useState({ from: dates.start, to: dates.end });
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchReport = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`/api/payroll/calculate`, {
                params: { from: range.from, to: range.to }
            });
            setReport(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate salary report.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const handlePrint = () => {
        window.print();
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
        setLoading(true);
        setError('');
        try {
            if (!window.html2canvas) {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
            }
            if (!window.jspdf) {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            }

            if (!window.html2canvas || !window.jspdf) {
                setError('Failed to load required PDF generation libraries. Please verify your connection.');
                setLoading(false);
                return;
            }

            const element = document.querySelector('.print-area');
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

            pdf.save(`Salary_Report_${range.from}_to_${range.to}.pdf`);
        } catch (err) {
            console.error(err);
            setError('Error generating PDF report file.');
        } finally {
            setLoading(false);
        }
    };

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

                @media print {
                    .sidebar, .navbar, .no-print, button, .top-header, .sidebar-link {
                        display: none !important;
                    }
                    .main-content {
                        margin-left: 0 !important;
                        padding: 0 !important;
                    }
                    body {
                        background: #white !important;
                        color: #000 !important;
                    }
                    .print-area {
                        visibility: visible !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
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
                        <h1 className="heading-lg">My Salary</h1>
                        <p className="text-label" style={{ textTransform: 'none' }}>Compute monthly attendance and generate earnings reports</p>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <h3 className="heading-sm" style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Select Date Range</h3>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div className="field-wrapper" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
                            <label className="input-label"><Calendar size={14} style={{ marginRight: '8px' }} /> From Date</label>
                            <input 
                                type="date" 
                                value={range.from} 
                                onChange={(e) => setRange({ ...range, from: e.target.value })}
                                className="input-field" 
                            />
                        </div>
                        <div className="field-wrapper" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
                            <label className="input-label"><Calendar size={14} style={{ marginRight: '8px' }} /> To Date</label>
                            <input 
                                type="date" 
                                value={range.to} 
                                onChange={(e) => setRange({ ...range, to: e.target.value })}
                                className="input-field" 
                            />
                        </div>
                        <button 
                            onClick={fetchReport} 
                            disabled={loading} 
                            className="btn-primary" 
                            style={{ margin: 0, height: '46px', padding: '0 2rem' }}
                        >
                            Generate Report
                        </button>
                    </div>
                </div>
            </div>

            {loading && <div className="empty-state">Generating calculations...</div>}
            {error && (
                <div className="glass-card no-print" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', borderColor: '#f43f5e', background: 'rgba(244, 63, 94, 0.05)' }}>
                    <AlertCircle size={20} style={{ color: '#f43f5e' }} />
                    <span style={{ color: '#f43f5e' }}>{error}</span>
                </div>
            )}

            {!loading && report && (
                <div>
                    <div className="stats-grid no-print" style={{ marginBottom: '2rem' }}>
                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-title">Base Salary</span>
                                <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                                    <Wallet size={20} />
                                </div>
                            </div>
                            <h2 className="stat-value" style={{ marginTop: '0.5rem' }}>₹{report.basicSalary.toLocaleString('en-IN')}</h2>
                            <p className="text-label" style={{ marginTop: '0.25rem', textTransform: 'none' }}>Standard monthly pay</p>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-title">Productive Days</span>
                                <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                    <Clock size={20} />
                                </div>
                            </div>
                            <h2 className="stat-value" style={{ marginTop: '0.5rem' }}>{report.actualWorkedDays} Days</h2>
                            <p className="text-label" style={{ marginTop: '0.25rem', textTransform: 'none' }}>{report.totalEffectiveHours} working hours</p>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-title">Target Work Days</span>
                                <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                                    <Calendar size={20} />
                                </div>
                            </div>
                            <h2 className="stat-value" style={{ marginTop: '0.5rem' }}>{report.standardDays} Days</h2>
                            <p className="text-label" style={{ marginTop: '0.25rem', textTransform: 'none' }}>{report.holidaysCount} holidays excluded</p>
                        </div>
                    </div>

                    <div className="glass-card print-area" style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto' }}>
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
                                <p style={{ fontWeight: 600, fontSize: '1rem' }}>{user?.name}</p>
                                <p className="text-label" style={{ textTransform: 'none', fontSize: '0.85rem' }}>{user?.email}</p>
                            </div>
                            <div>
                                <p className="input-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Employee ID</p>
                                <p style={{ fontWeight: 600, fontSize: '1rem' }}>EMP-{user?.id || 'N/A'}</p>
                                <p className="text-label" style={{ textTransform: 'none', fontSize: '0.85rem' }}>Role: {user?.role?.toUpperCase()}</p>
                            </div>
                        </div>

                        <h3 className="heading-sm" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>Itemized Breakdown</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Basic Salary (Base Monthly)</span>
                                <span style={{ fontWeight: 600 }}>₹{report.basicSalary.toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Unpaid / Absent Deductions</span>
                                <span style={{ fontWeight: 600, color: report.deductions > 0 ? '#f43f5e' : 'inherit' }}>-₹{report.deductions.toLocaleString('en-IN')}</span>
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
                                <span style={{ fontWeight: 600 }}>-{report.holidaysCount}.00 Days</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Adjusted Standard Calendar Days</span>
                                <span style={{ fontWeight: 600 }}>{report.standardDays}.00 Days</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Total Working Hours Logged</span>
                                <span style={{ fontWeight: 600 }}>{report.totalEffectiveHours} Hours</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Earned Attendance Days Equivalent</span>
                                <span style={{ fontWeight: 600 }}>{report.actualWorkedDays} Days</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Calculated Net (Salary Engine)</span>
                                <span style={{ fontWeight: 600 }}>₹{report.earnedSalary.toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Computed Daily Wage Rate</span>
                                <span style={{ fontWeight: 600 }}>₹{report.dailyRate.toLocaleString('en-IN')} / Day</span>
                            </div>
                        </div>

                        <div className="net-earnings-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(99, 102, 241, 0.08)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--accent)', marginBottom: '2.5rem' }}>
                            <div>
                                <p style={{ fontWeight: 600, color: 'var(--accent)', fontSize: '1.1rem' }}>Net Take-Home Pay (Final Payout)</p>
                                <p className="text-label" style={{ textTransform: 'none', fontSize: '0.8rem', marginTop: '0.25rem' }}>Based on final overridden or approved payment amount</p>
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)' }}>₹{report.netSalary.toLocaleString('en-IN')}</h2>
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
                                    {report.logs.map((log) => (
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
                                disabled={loading}
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
                                <span>{loading ? 'Processing...' : 'Download PDF'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalaryReport;

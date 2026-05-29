import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, User, Building2, ArrowRight, Sun, Moon, Users, ShieldAlert, Clock, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

import '../styles/Global.css';
import '../styles/UI.css';
import '../styles/Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        companyName: '',
        role: 'employee'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [pendingStatus, setPendingStatus] = useState(null);
    
    const { register } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await register(formData);
            if (res && res.pending) {
                setPendingStatus({
                    role: formData.role,
                    message: res.message
                });
            } else {
                navigate(formData.role === 'super_admin' ? '/super-admin/dashboard' : '/dashboard');
            }
        } catch (err) {
            setError(err.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page app-container">
            <div className="auth-glow-top"></div>
            <div className="auth-glow-bottom"></div>

            <button onClick={toggleTheme} className="auth-theme-toggle glass-card">
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="auth-card glass-card" style={{maxWidth: '45rem'}}>
                {pendingStatus ? (
                    <div style={{textAlign: 'center', padding: '2rem 1rem'}}>
                        <div className="auth-icon-box" style={{margin: '0 auto 2rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b'}}>
                            <Clock size={40} className="animate-pulse" />
                        </div>
                        <h1 className="heading-xl" style={{marginBottom: '1rem'}}>Awaiting Approval</h1>
                        <div className="badge" style={{
                            backgroundColor: 'rgba(245, 158, 11, 0.1)', 
                            color: '#f59e0b', 
                            padding: '1.25rem', 
                            fontSize: '1rem', 
                            lineHeight: '1.6', 
                            borderRadius: '1rem',
                            marginBottom: '2rem',
                            display: 'block',
                            width: '100%',
                            whiteSpace: 'normal',
                            textAlign: 'center'
                        }}>
                            {pendingStatus.message}
                        </div>
                        <p style={{opacity: 0.7, marginBottom: '2rem', fontSize: '0.95rem'}}>
                            {pendingStatus.role === 'manager' 
                                ? 'We have notified our system administrators to review your organization setup. Please check back later.' 
                                : 'Please contact your manager or HR administrator to approve your access.'}
                        </p>
                        <button onClick={() => navigate('/login')} className="btn-primary" style={{margin: '0 auto', maxWidth: '200px'}}>
                            <span>Back to Login</span>
                            <ArrowRight size={18} />
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="auth-header">
                            <div className="auth-icon-box">
                                <ShieldCheck size={40} />
                            </div>
                            <h1 className="heading-xl">Join SHNOOR</h1>
                            <p className="input-label" style={{textTransform: 'none', marginTop: '0.5rem'}}>Start your organization's journey</p>
                        </div>

                        {error && (
                            <div className="badge" style={{backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', textAlign: 'center', padding: '0.75rem', width: '100%'}}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="role-grid" style={{gridTemplateColumns: 'repeat(4, 1fr)'}}>
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, role: 'super_admin'})}
                                    className={`role-btn ${formData.role === 'super_admin' ? 'active' : ''}`}
                                >
                                    <ShieldAlert size={20} />
                                    <span>Super Admin</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, role: 'manager'})}
                                    className={`role-btn ${formData.role === 'manager' ? 'active' : ''}`}
                                >
                                    <Users size={20} />
                                    <span>Manager</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, role: 'employee'})}
                                    className={`role-btn ${formData.role === 'employee' ? 'active' : ''}`}
                                >
                                    <User size={20} />
                                    <span>Employee</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, role: 'tester'})}
                                    className={`role-btn ${formData.role === 'tester' ? 'active' : ''}`}
                                >
                                    <Activity size={20} />
                                    <span>Tester</span>
                                </button>
                            </div>

                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                                <div className="field-wrapper">
                                    <label className="input-label">Full Name</label>
                                    <div className="input-group">
                                        <User className="input-icon" size={18} />
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Dinesh"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="field-wrapper">
                                    <label className="input-label">Company Name</label>
                                    <div className="input-group">
                                        <Building2 className="input-icon" size={18} />
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="SHNOOR"
                                            value={formData.companyName}
                                            onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="field-wrapper">
                                <label className="input-label">Email Address</label>
                                <div className="input-group">
                                    <Mail className="input-icon" size={18} />
                                    <input
                                        type="email"
                                        className="input-field"
                                        placeholder="name@company.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="field-wrapper">
                                <label className="input-label">Password</label>
                                <div className="input-group">
                                    <Lock className="input-icon" size={18} />
                                    <input
                                        type="password"
                                        className="input-field"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="btn-primary">
                                <span>{loading ? 'Creating Account...' : 'Get Started'}</span>
                                {!loading && <ArrowRight size={18} />}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <p className="input-label" style={{textTransform: 'none', fontSize: '0.875rem'}}>
                                Already have an account?{' '}
                                <Link to="/login" className="auth-link">Sign In</Link>
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Register;

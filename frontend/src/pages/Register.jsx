import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, User, Building2, ArrowRight, Sun, Moon, Users, ShieldAlert } from 'lucide-react';
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
    
    const { register } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(formData);
            navigate(formData.role === 'super_admin' ? '/super-admin/dashboard' : '/dashboard');
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
                    <div className="role-grid" style={{gridTemplateColumns: 'repeat(3, 1fr)'}}>
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
            </div>
        </div>
    );
};

export default Register;

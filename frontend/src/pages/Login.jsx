import React, { useState } from 'react';
import { Mail, Lock, LogIn, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';

import '../styles/Global.css';
import '../styles/UI.css';
import '../styles/Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(email, password);
        if (result.success) navigate('/dashboard');
        else setError(result.message);
    };

    return (
        <div className="auth-page app-container">
            <div className="auth-glow-top"></div>
            <div className="auth-glow-bottom"></div>

            <button onClick={toggleTheme} className="auth-theme-toggle glass-card">
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="auth-card glass-card">
                <div className="auth-header">
                    <div className="auth-icon-box">
                        <ShieldCheck size={40} />
                    </div>
                    <h1 className="heading-xl">SHNOOR</h1>
                    <p className="input-label" style={{opacity: 0.5, marginTop: '0.5rem'}}>Secure Cloud HRM Portal</p>
                </div>

                {error && (
                    <div className="badge" style={{backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', textAlign: 'center', padding: '0.75rem'}}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="field-wrapper">
                        <label className="input-label">Email Address</label>
                        <div className="input-group">
                            <Mail className="input-icon" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                placeholder="name@company.com"
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
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary">
                        <span>Sign In</span>
                        <LogIn size={18} />
                    </button>
                </form>

                <div className="auth-footer">
                    <p className="input-label" style={{textTransform: 'none', fontSize: '0.875rem'}}>
                        Don't have an account?{' '}
                        <Link to="/register" className="auth-link">Join SHNOOR</Link>
                    </p>
                    
                </div>
            </div>
        </div>
    );
};

export default Login;

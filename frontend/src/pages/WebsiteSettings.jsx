import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Globe, Save, RefreshCcw, Type, MessageSquare, Mail, Phone } from 'lucide-react';
import '../styles/Dashboard.css';
import '../styles/UI.css';

const WebsiteSettings = () => {
    const [settings, setSettings] = useState({
        heroTitle: '',
        heroSubtitle: '',
        contactEmail: '',
        contactPhone: '',
        footerText: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get('/api/settings');
                if (Object.keys(response.data).length > 0) {
                    setSettings(prev => ({ ...prev, ...response.data }));
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axios.post('/api/settings', settings);
            alert('Website content updated successfully!');
        } catch (error) {
            alert('Failed to update content');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="empty-state">Loading website configurations...</div>;

    return (
        <div className="dashboard-container">
            <div className="feed-header" style={{marginBottom: '2rem'}}>
                <div>
                    <h1 className="heading-lg">Website Configuration</h1>
                    <p className="input-label" style={{textTransform: 'none', marginTop: '0.25rem'}}>Customize the content of your public landing page</p>
                </div>
                <div className="avatar-circle" style={{backgroundColor: 'var(--accent-glow)', color: 'var(--accent)'}}>
                    <Globe size={24} />
                </div>
            </div>

            <div className="glass-card" style={{padding: '2.5rem', maxWidth: '800px'}}>
                <form onSubmit={handleSave} style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
                    <div className="field-wrapper">
                        <label className="input-label"><Type size={14} style={{marginRight: '8px'}} /> Hero Section Title</label>
                        <input 
                            name="heroTitle"
                            value={settings.heroTitle}
                            onChange={handleChange}
                            className="input-field" 
                            placeholder="e.g. Elevate Your Workforce with SIHR Silk"
                        />
                    </div>

                    <div className="field-wrapper">
                        <label className="input-label"><MessageSquare size={14} style={{marginRight: '8px'}} /> Hero Subtitle</label>
                        <textarea 
                            name="heroSubtitle"
                            value={settings.heroSubtitle}
                            onChange={handleChange}
                            className="input-field" 
                            style={{minHeight: '100px', paddingTop: '1rem'}}
                            placeholder="Describe your platform in a few sentences..."
                        />
                    </div>

                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
                        <div className="field-wrapper">
                            <label className="input-label"><Mail size={14} style={{marginRight: '8px'}} /> Public Contact Email</label>
                            <input 
                                name="contactEmail"
                                value={settings.contactEmail}
                                onChange={handleChange}
                                className="input-field" 
                                placeholder="support@sihr-silk.com"
                            />
                        </div>
                        <div className="field-wrapper">
                            <label className="input-label"><Phone size={14} style={{marginRight: '8px'}} /> Contact Phone</label>
                            <input 
                                name="contactPhone"
                                value={settings.contactPhone}
                                onChange={handleChange}
                                className="input-field" 
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                    </div>

                    <div className="field-wrapper">
                        <label className="input-label">Footer Copyright Text</label>
                        <input 
                            name="footerText"
                            value={settings.footerText}
                            onChange={handleChange}
                            className="input-field" 
                            placeholder="© 2026 SIHR Silk. All rights reserved."
                        />
                    </div>

                    <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                        <button type="submit" disabled={saving} className="btn-primary" style={{width: 'auto', padding: '0 2rem'}}>
                            {saving ? <RefreshCcw size={18} className="animate-spin" /> : <Save size={18} />}
                            <span>{saving ? 'Saving Changes...' : 'Save Configuration'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WebsiteSettings;

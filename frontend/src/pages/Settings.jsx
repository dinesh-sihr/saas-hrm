import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Lock, Shield, Calendar, Save, RefreshCcw, MapPin, Navigation } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';
import '../styles/UI.css';

const compressImage = (base64Str, maxWidth = 150, maxHeight = 150, quality = 0.7) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(base64Str);
    });
};

const Settings = () => {
    const { user, setUser } = useAuth();
    const [profile, setProfile] = useState({
        name: user?.name || '',
        email: user?.email || '',
        profile_photo: user?.profile_photo || '',
        password: '',
        confirmPassword: ''
    });
    
    const [geofence, setGeofence] = useState({ latitude: '', longitude: '' });
    const [fetchingCoords, setFetchingCoords] = useState(false);
    const [savingGeofence, setSavingGeofence] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchGeofence = async () => {
            if (user?.role === 'manager' || user?.role === 'admin') {
                try {
                    const response = await axios.get('/api/attendance/geofence');
                    setGeofence({
                        latitude: response.data.latitude !== null ? response.data.latitude.toString() : '',
                        longitude: response.data.longitude !== null ? response.data.longitude.toString() : ''
                    });
                } catch (error) {
                    console.error('Failed to load geofencing coordinates:', error);
                }
            }
        };
        fetchGeofence();
    }, [user]);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                const response = await axios.get('/api/auth/profile');
                setProfile(prev => ({ 
                    ...prev, 
                    name: response.data.name, 
                    email: response.data.email,
                    profile_photo: response.data.profile_photo || ''
                }));
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user]);

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const compressed = await compressImage(reader.result, 150, 150, 0.7);
                setProfile(prev => ({ ...prev, profile_photo: compressed }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (profile.password && profile.password !== profile.confirmPassword) {
            alert("Passwords don't match");
            return;
        }

        setSaving(true);
        try {
            const response = await axios.put('/api/auth/profile', {
                name: profile.name,
                email: profile.email,
                profile_photo: profile.profile_photo,
                password: profile.password || undefined
            });
            
            const updatedUser = { ...user, ...response.data.user };
            setUser(updatedUser);
            
            const { profile_photo, company_logo, ...safeUser } = updatedUser;
            localStorage.setItem('user', JSON.stringify(safeUser));

            alert('Profile updated successfully!');
            setProfile(prev => ({ ...prev, password: '', confirmPassword: '' }));
        } catch (error) {
            console.error('Update Error:', error);
            alert(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            alert('Your browser does not support geolocation tracking.');
            return;
        }

        setFetchingCoords(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setGeofence({
                    latitude: pos.coords.latitude.toFixed(6),
                    longitude: pos.coords.longitude.toFixed(6)
                });
                setFetchingCoords(false);
            },
            (err) => {
                console.error('GPS Detection Error:', err);
                alert("We couldn't get your location. Please check your browser permission settings.");
                setFetchingCoords(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleUpdateGeofence = async (e) => {
        e.preventDefault();
        
        if (!geofence.latitude || !geofence.longitude) {
            alert('Please provide valid latitude and longitude coordinates.');
            return;
        }

        setSavingGeofence(true);
        try {
            const res = await axios.post('/api/attendance/geofence', {
                latitude: parseFloat(geofence.latitude),
                longitude: parseFloat(geofence.longitude)
            });
            alert(res.data.message || 'Office geofencing location updated!');
        } catch (err) {
            console.error('Geofencing Update Error:', err);
            alert(err.response?.data?.message || 'Failed to save geofence location.');
        } finally {
            setSavingGeofence(false);
        }
    };

    if (loading) return <div className="empty-state">Loading your profile...</div>;
    if (!user) return <div className="empty-state">Please log in to manage settings.</div>;

    return (
        <div className="dashboard-container">
            <div className="feed-header" style={{marginBottom: '2rem'}}>
                <div>
                    <h1 className="heading-lg">Account Settings</h1>
                    <p className="input-label" style={{textTransform: 'none', marginTop: '0.25rem'}}>Manage your profile and security preferences</p>
                </div>
                <div className="avatar-circle" style={{backgroundColor: 'var(--accent-glow)', color: 'var(--accent)', overflow: 'hidden', width: '4rem', height: '4rem'}}>
                    {profile.profile_photo ? (
                        <img src={profile.profile_photo} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    ) : (
                        <User size={32} />
                    )}
                </div>
            </div>

            <div className="glass-card" style={{padding: '2.5rem', maxWidth: '600px'}}>
                <form onSubmit={handleUpdate} style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                    <div className="field-wrapper">
                        <label className="input-label"><User size={14} style={{marginRight: '8px'}} /> Profile Photo</label>
                        <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                            <input 
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                id="photo-upload"
                                style={{display: 'none'}}
                            />
                            <label htmlFor="photo-upload" className="btn-secondary" style={{cursor: 'pointer', margin: 0}}>
                                Choose File
                            </label>
                            {profile.profile_photo && (
                                <button 
                                    type="button" 
                                    className="btn-icon delete" 
                                    onClick={() => setProfile({...profile, profile_photo: ''})}
                                    style={{padding: '0.5rem'}}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="field-wrapper">
                        <label className="input-label"><User size={14} style={{marginRight: '8px'}} /> Full Name</label>
                        <input 
                            name="name"
                            value={profile.name}
                            onChange={handleChange}
                            className="input-field" 
                            required
                        />
                    </div>

                    <div className="field-wrapper">
                        <label className="input-label"><Mail size={14} style={{marginRight: '8px'}} /> Email Address</label>
                        <input 
                            name="email"
                            type="email"
                            value={profile.email}
                            onChange={handleChange}
                            className="input-field" 
                            required
                        />
                    </div>

                    <hr style={{border: 'none', borderTop: '1px solid var(--card-border)', margin: '1rem 0'}} />
                    
                    <h3 className="heading-sm" style={{marginBottom: '0.5rem', color: 'var(--accent)'}}>Update Password</h3>
                    <p className="input-label" style={{textTransform: 'none', marginBottom: '1rem'}}>Leave blank if you don't want to change it</p>

                    <div className="field-wrapper">
                        <label className="input-label"><Lock size={14} style={{marginRight: '8px'}} /> New Password</label>
                        <input 
                            name="password"
                            type="password"
                            value={profile.password}
                            onChange={handleChange}
                            className="input-field" 
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="field-wrapper">
                        <label className="input-label"><Lock size={14} style={{marginRight: '8px'}} /> Confirm New Password</label>
                        <input 
                            name="confirmPassword"
                            type="password"
                            value={profile.confirmPassword}
                            onChange={handleChange}
                            className="input-field" 
                            placeholder="••••••••"
                        />
                    </div>

                    <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                        <button type="submit" disabled={saving} className="btn-primary" style={{width: 'auto', padding: '0 2rem'}}>
                            {saving ? <RefreshCcw size={18} className="animate-spin" /> : <Save size={18} />}
                            <span>{saving ? 'Saving...' : 'Update Profile'}</span>
                        </button>
                    </div>
                </form>
            </div>

            {(user?.role === 'manager' || user?.role === 'admin') && (
                <div className="glass-card" style={{padding: '2.5rem', maxWidth: '600px', marginTop: '2rem'}}>
                    <h3 className="heading-sm" style={{marginBottom: '0.5rem', color: 'var(--accent)'}}>Office Location & Geofencing</h3>
                    <p className="input-label" style={{textTransform: 'none', marginBottom: '1.5rem'}}>
                        Configure your company's GPS coordinates. Clock-in and clock-out will be restricted to a 100-meter radius around this location.
                    </p>

                    <form onSubmit={handleUpdateGeofence} style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                            <div className="field-wrapper">
                                <label className="input-label"><MapPin size={14} style={{marginRight: '8px'}} /> Latitude</label>
                                <input 
                                    type="number"
                                    step="any"
                                    placeholder="e.g. 12.9716"
                                    value={geofence.latitude}
                                    onChange={(e) => setGeofence({ ...geofence, latitude: e.target.value })}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div className="field-wrapper">
                                <label className="input-label"><MapPin size={14} style={{marginRight: '8px'}} /> Longitude</label>
                                <input 
                                    type="number"
                                    step="any"
                                    placeholder="e.g. 77.5946"
                                    value={geofence.longitude}
                                    onChange={(e) => setGeofence({ ...geofence, longitude: e.target.value })}
                                    className="input-field"
                                    required
                                />
                            </div>
                        </div>

                        <div style={{display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap'}}>
                            <button 
                                type="button" 
                                onClick={handleDetectLocation}
                                disabled={fetchingCoords}
                                className="btn-secondary"
                                style={{margin: 0, flex: 1, minWidth: '150px'}}
                            >
                                <Navigation size={16} className={fetchingCoords ? "animate-pulse" : ""} />
                                <span>{fetchingCoords ? 'Locating...' : 'Use Current GPS'}</span>
                            </button>
                            <button 
                                type="submit" 
                                disabled={savingGeofence} 
                                className="btn-primary"
                                style={{margin: 0, flex: 1, minWidth: '150px'}}
                            >
                                {savingGeofence ? <RefreshCcw size={16} className="animate-spin" /> : <Save size={16} />}
                                <span>{savingGeofence ? 'Saving...' : 'Save Geofence'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass-card" style={{padding: '2rem', maxWidth: '600px', marginTop: '2rem'}}>
                <h3 className="heading-sm" style={{marginBottom: '1rem'}}>Account Information</h3>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
                    <div>
                        <p className="input-label">Role</p>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem'}}>
                            <Shield size={16} style={{color: 'var(--accent)'}} />
                            <span style={{fontWeight: 600}}>{user.role?.toUpperCase() || 'N/A'}</span>
                        </div>
                    </div>
                    <div>
                        <p className="input-label">Joined On</p>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem'}}>
                            <Calendar size={16} style={{color: 'var(--accent)'}} />
                            <span style={{fontWeight: 600}}>
                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;

import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import '../styles/UI.css';

const NotificationToast = ({ notification, onClose }) => {
    if (!notification) return null;

    return (
        <div className="glass-card toast-notification" style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            minWidth: '300px',
            padding: '1rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start',
            animation: 'slideInRight 0.3s ease',
            borderLeft: '4px solid var(--accent)'
        }}>
            <div className="avatar-circle" style={{backgroundColor: 'var(--accent-glow)', color: 'var(--accent)', flexShrink: 0}}>
                <Bell size={18} />
            </div>
            <div style={{flex: 1}}>
                <h4 style={{margin: 0, fontSize: '0.9rem', fontWeight: 700}}>{notification.title}</h4>
                <p style={{margin: '0.25rem 0 0', fontSize: '0.8rem', opacity: 0.8, lineHeight: 1.4}}>{notification.message}</p>
            </div>
            <button onClick={onClose} style={{background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.5}}>
                <X size={16} />
            </button>
        </div>
    );
};

export default NotificationToast;

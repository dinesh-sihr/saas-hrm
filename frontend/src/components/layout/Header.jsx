import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bell, Sun, Moon, Menu, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import NotificationToast from '../NotificationToast';
import '../../styles/Layout.css';
import '../../styles/UI.css';

const Header = ({ user, toggleSidebar }) => {
    const { isDark, toggleTheme } = useTheme();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [activeToast, setActiveToast] = useState(null);
    const lastNotifIdRef = useRef(0);
    const toastTimerRef = useRef(null);
    const unreadCount = notifications.filter(n => !n.is_read).length;

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await axios.get('/api/notifications');
                const newNotifications = response.data;
                
                if (newNotifications.length > 0) {
                    const currentMaxId = Math.max(...newNotifications.map(n => n.id));
                    
                    if (lastNotifIdRef.current !== 0 && currentMaxId > lastNotifIdRef.current) {
                        const latest = newNotifications[0];
                        setActiveToast(latest);
                        
                        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
                        toastTimerRef.current = setTimeout(() => setActiveToast(null), 5000);
                    }
                    lastNotifIdRef.current = currentMaxId;
                }
                
                setNotifications(newNotifications);
            } catch (error) {
                console.error('Error fetching notifications:', error.response?.data || error.message);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 5000); 
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id) => {
        try {
            await axios.patch(`/api/notifications/${id}`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Error marking read:', error);
        }
    };

    const deleteNotification = async (e, id) => {
        e.stopPropagation(); 
        try {
            await axios.delete(`/api/notifications/${id}`);
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const markAllRead = async () => {
        try {
            await axios.patch('/api/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marking all read:', error);
        }
    };

    const getNotificationIcon = (title) => {
        const t = title.toLowerCase();
        if (t.includes('leave')) return <Clock size={14} />;
        if (t.includes('reward')) return <Sun size={14} />;
        if (t.includes('asset')) return <Menu size={14} />;
        if (t.includes('salary')) return <CheckCircle2 size={14} />;
        if (t.includes('workload')) return <AlertTriangle size={14} color="#f59e0b" />;
        return <Bell size={14} />;
    };

    return (
        <header className="header">
            <div className="header-greeting" style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                <button onClick={toggleSidebar} className="header-btn mobile-only glass-card" style={{display: 'none'}}>
                    <Menu size={20} />
                </button>
                <div>
                    <h1 className="heading-lg">Hey, {user.name.split(' ')[0]}</h1>
                </div>
            </div>

            <div className="header-user-actions">
                <button onClick={toggleTheme} className="header-btn glass-card">
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                
                <div style={{position: 'relative'}}>
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)} 
                        className="header-btn glass-card"
                        style={{position: 'relative'}}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="notification-badge">{unreadCount}</span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="glass-card notification-dropdown">
                            <div className="dropdown-header">
                                <h3 className="heading-sm">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} className="text-btn">Mark all read</button>
                                )}
                            </div>
                            <div className="notification-list">
                                {notifications.length > 0 ? (
                                    notifications.map(n => (
                                        <div 
                                            key={n.id} 
                                            className={`notification-item ${n.is_read ? 'read' : 'unread'}`}
                                            onClick={() => !n.is_read && markAsRead(n.id)}
                                            style={{cursor: n.is_read ? 'default' : 'pointer'}}
                                        >
                                            <div className="notification-icon">
                                                {getNotificationIcon(n.title)}
                                            </div>
                                            <div className="notification-content">
                                                <p className="notification-title">{n.title}</p>
                                                <p className="notification-msg">{n.message}</p>
                                                <span className="notification-time">
                                                    <Clock size={10} /> {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="notification-actions">
                                                {!n.is_read && <div className="unread-dot"></div>}
                                                <button 
                                                    onClick={(e) => deleteNotification(e, n.id)}
                                                    className="delete-notif-btn"
                                                    title="Delete notification"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-notifications">No notifications yet</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <UserBadge user={user} />
            </div>
            
            <NotificationToast 
                notification={activeToast} 
                onClose={() => setActiveToast(null)} 
            />
        </header>
    );
};


const UserBadge = ({ user }) => (
    <div className="user-badge">
        {user.profile_photo ? (
            <img 
                src={user.profile_photo} 
                alt="Profile" 
                style={{width: '2.25rem', height: '2.25rem', borderRadius: '0.75rem', objectFit: 'cover'}} 
            />
        ) : (
            <div className="avatar-init" style={{width: '2.25rem', height: '2.25rem', background: 'linear-gradient(to tr, #6366f1, #8b5cf6)', color: 'white'}}>
                {user.name[0]}
            </div>
        )}

        <div className="user-info">
            <p>{user.name}</p>
            <span>{user.role.replace('_', ' ')}</span>
        </div>
    </div>
);

export default Header;

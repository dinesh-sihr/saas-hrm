import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
    LayoutDashboard, Users, Megaphone, Settings, LogOut, 
    Building2, CreditCard, Receipt, MessageSquare, ShieldAlert, 
    Briefcase, Calendar, Star, FileText, Clock, Wallet, UserMinus, Zap, Video, Brain, BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/Layout.css';

const Sidebar = ({ isOpen, closeSidebar }) => {
    const { user, logout } = useAuth();
    
    const employeeMenu = [
        { path: '/dashboard', label: 'My Overview', icon: LayoutDashboard },
        { path: '/analytics', label: 'Interactive Analytics', icon: BarChart3 },
        { path: '/attendance', label: 'My Work Log', icon: Clock },
        { path: '/leaves', label: 'Time Off', icon: FileText },
        { path: '/assets', label: 'My Equipment', icon: Briefcase },
        { path: '/holidays', label: 'Company Holidays', icon: Calendar },
        { path: '/appreciations', label: 'My Achievements', icon: Star },
        { path: '/ai-insights', label: 'AI Insights', icon: Zap },
        { path: '/meetings', label: 'Meetings', icon: Video },
        { path: '/behavioral-iq', label: 'Behavioral IQ', icon: Brain },
        { path: '/salary-report', label: 'My Salary', icon: Wallet },
    ];

    const managerMenu = [
        { path: '/dashboard', label: 'Team Overview', icon: LayoutDashboard },
        { path: '/analytics', label: 'Interactive Analytics', icon: BarChart3 },
        { path: '/employees', label: 'Our People', icon: Users },
        { path: '/assets', label: 'Inventory', icon: Briefcase },
        { path: '/holidays', label: 'Holidays', icon: Calendar },
        { path: '/leaves', label: 'Leave Requests', icon: FileText },
        { path: '/attendance', label: 'Daily Attendance', icon: Clock },
        { path: '/payroll', label: 'Salary Management', icon: Wallet },
        { path: '/appreciations', label: 'Give Recognition', icon: Star },
        { path: '/ai-insights', label: 'Team Insights', icon: Zap },
        { path: '/meetings', label: 'Meetings', icon: Video },
        { path: '/behavioral-iq', label: 'Behavioral IQ', icon: Brain },
    ];

    const superAdminMenu = [
        { path: '/super-admin/dashboard', label: 'Global Overview', icon: LayoutDashboard },
        { path: '/super-admin/companies', label: 'Companies', icon: Building2 },
        { path: '/super-admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
        { path: '/super-admin/users', label: 'System Admins', icon: ShieldAlert },
    ];

    const getActiveMenu = () => {
        if (user?.role === 'super_admin') return superAdminMenu;
        if (user?.role === 'manager' || user?.role === 'admin') return managerMenu;
        return employeeMenu;
    };

    const activeMenu = getActiveMenu();

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="top-section">
                <div className="sidebar-logo">
                    {user?.company_logo ? (
                        <img src={user.company_logo} alt="Logo" style={{width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', objectFit: 'cover'}} />
                    ) : (
                        <div className="avatar-circle" style={{backgroundColor: 'var(--accent)', color: 'white', fontWeight: 'bold'}}>
                            {(user?.company_name || 'S')[0].toUpperCase()}
                        </div>
                    )}
                    <h2 className="heading-md" style={{letterSpacing: '1px'}}>{user?.company_name || 'SHNOOR'}</h2>
                </div>

                <nav className="sidebar-nav">
                    {activeMenu.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>

            <div className="bottom-section" style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                <NavLink to="/settings" className="sidebar-link">
                    <Settings size={20} />
                    <span>Settings</span>
                </NavLink>
                <button onClick={logout} className="sidebar-link logout">
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;

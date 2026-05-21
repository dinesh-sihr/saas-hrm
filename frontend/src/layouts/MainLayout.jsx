import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import ChatBot from '../components/ChatBot';

const MainLayout = () => {
    const { user, loading } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (loading) return <LoadingScreen />;

    if (!user) return <Navigate to="/login" />;

    return (
        <div className={`app-wrapper ${isSidebarOpen ? 'sidebar-open' : ''}`}>
            <Sidebar isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />
            
            <main className="main-content">
                <Header user={user} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                
                <section className="dashboard-view">
                    <Outlet />
                </section>
                <ChatBot />
            </main>
            
            {/* Mobile Overlay */}
            {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
        </div>
    );
};


const LoadingScreen = () => (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
    </div>
);

export default MainLayout;

import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            axios.get('/api/auth/profile').then(res => {
                setUser(prev => ({ ...prev, profile_photo: res.data.profile_photo, company_logo: res.data.company_logo }));
            }).catch(err => console.error("Failed to fetch profile photos:", err));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await axios.post('/api/auth/login', { email, password });
            const { token, user: userData } = response.data;

            localStorage.setItem('token', token);
            const { profile_photo, company_logo, portal_config, ...persistedUser } = userData;
            localStorage.setItem('user', JSON.stringify(persistedUser));
            
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(userData);
            
            return { success: true };
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message;
            return { 
                success: false, 
                message: errorMsg
            };
        }
    };

    const register = async (formData) => {
        try {
            const response = await axios.post('/api/auth/register', formData);
            const { token, user: userData } = response.data;

            localStorage.setItem('token', token);
            const { profile_photo, company_logo, portal_config, ...persistedUser } = userData;
            localStorage.setItem('user', JSON.stringify(persistedUser));
            
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(userData);
            
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    useEffect(() => {
        if (!user) return;

        let timeoutId;

        const resetTimer = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                logout();
                alert("Your session has expired due to 30 minutes of inactivity. Please log in again.");
            }, 1800000);
        };

        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        
        events.forEach(event => window.addEventListener(event, resetTimer));
        
        resetTimer();

        return () => {
            clearTimeout(timeoutId);
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

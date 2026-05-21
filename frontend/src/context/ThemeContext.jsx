import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(() => {
        const stored = localStorage.getItem('theme');
        if (stored) return stored === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    const applyTheme = (darkState) => {
        const root = window.document.documentElement;
        if (darkState) {
            root.classList.add('dark');
            root.style.backgroundColor = '#0f172a';
            root.style.colorScheme = 'dark';
        } else {
            root.classList.remove('dark');
            root.style.backgroundColor = '#ffffff';
            root.style.colorScheme = 'light';
        }
    };

    useEffect(() => {
        applyTheme(isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    const toggleTheme = () => {
        const newState = !isDark;
        setIsDark(newState);
        applyTheme(newState); 
    };

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);

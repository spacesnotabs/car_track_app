import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { settingsService } from '../services/settingsService';
import { THEMES, COLOR_THEMES, DEFAULT_SETTINGS } from '../constants/themes';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setSettings(DEFAULT_SETTINGS);
                setUserId(user.uid);
                setLoading(true);
            } else {
                setUserId(null);
                setSettings(DEFAULT_SETTINGS);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // Load settings whenever the authenticated user changes
    useEffect(() => {
        if (!userId) {
            return;
        }

        let isActive = true;

        const loadSettings = async () => {
            try {
                const savedSettings = await settingsService.getSettings(userId);
                if (savedSettings && isActive) {
                    setSettings(prev => ({ ...prev, ...savedSettings }));
                }
            } catch (error) {
                console.error("Failed to load settings:", error);
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        loadSettings();

        return () => {
            isActive = false;
        };
    }, [userId]);

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;
        const colorTheme = COLOR_THEMES[settings.colorTheme.toUpperCase()] || COLOR_THEMES.BLUE;

        // Apply Light/Dark mode
        if (settings.theme === THEMES.DARK) {
            root.style.setProperty('--bg-primary', '#0f172a');
            root.style.setProperty('--bg-secondary', '#1e293b');
            root.style.setProperty('--bg-card', '#1e293b');
            root.style.setProperty('--text-primary', '#f8fafc');
            root.style.setProperty('--text-secondary', '#94a3b8');
            root.style.setProperty('--border-color', '#334155');
        } else {
            root.style.setProperty('--bg-primary', '#f8fafc');
            root.style.setProperty('--bg-secondary', '#ffffff');
            root.style.setProperty('--bg-card', '#ffffff');
            root.style.setProperty('--text-primary', '#0f172a');
            root.style.setProperty('--text-secondary', '#64748b');
            root.style.setProperty('--border-color', '#e2e8f0');
        }

        // Apply Accent Color
        root.style.setProperty('--accent-primary', colorTheme.colors.primary);
        root.style.setProperty('--accent-hover', colorTheme.colors.hover);

    }, [settings]);

    const updateSettings = async (newSettings) => {
        const updatedSettings = { ...settings, ...newSettings };
        setSettings(updatedSettings);

        if (!userId) {
            return;
        }

        try {
            await settingsService.saveSettings(userId, updatedSettings);
        } catch (error) {
            console.error("Failed to save settings:", error);
        }
    };

    return (
        <ThemeContext.Provider value={{ settings, updateSettings, loading }}>
            {children}
        </ThemeContext.Provider>
    );
};

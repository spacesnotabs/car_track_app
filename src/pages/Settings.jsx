import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { THEMES, COLOR_THEMES } from '../constants/themes';
import { Moon, Sun, Check } from 'lucide-react';

const Settings = () => {
    const { settings, updateSettings } = useTheme();

    const handleThemeChange = (theme) => {
        updateSettings({ theme });
    };

    const handleColorThemeChange = (colorThemeId) => {
        updateSettings({ colorTheme: colorThemeId });
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-text-primary">Settings</h1>

            <div className="grid gap-6 max-w-2xl">
                {/* Appearance Section */}
                <div className="bg-card rounded-xl p-6 border border-border">
                    <h2 className="text-xl font-semibold mb-6 text-text-primary">Appearance</h2>

                    {/* Light/Dark Mode */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-text-secondary mb-4">
                            Theme Mode
                        </label>
                        <div className="flex gap-4">
                            <button
                                onClick={() => handleThemeChange(THEMES.LIGHT)}
                                className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all ${settings.theme === THEMES.LIGHT
                                        ? 'border-accent bg-secondary text-text-primary'
                                        : 'border-border bg-secondary text-text-secondary hover:border-text-secondary'
                                    }`}
                            >
                                <Sun size={24} />
                                <span className="font-medium">Light</span>
                            </button>
                            <button
                                onClick={() => handleThemeChange(THEMES.DARK)}
                                className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all ${settings.theme === THEMES.DARK
                                        ? 'border-accent bg-secondary text-text-primary'
                                        : 'border-border bg-secondary text-text-secondary hover:border-text-secondary'
                                    }`}
                            >
                                <Moon size={24} />
                                <span className="font-medium">Dark</span>
                            </button>
                        </div>
                    </div>

                    {/* Color Theme */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-4">
                            Accent Color
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                            {Object.values(COLOR_THEMES).map((theme) => (
                                <button
                                    key={theme.id}
                                    onClick={() => handleColorThemeChange(theme.id)}
                                    className={`group relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${settings.colorTheme === theme.id
                                            ? 'border-text-primary bg-secondary'
                                            : 'border-border bg-secondary hover:border-text-secondary'
                                        }`}
                                >
                                    <div
                                        className="w-8 h-8 rounded-full shadow-lg"
                                        style={{ backgroundColor: theme.colors.primary }}
                                    />
                                    <span className={`text-sm font-medium ${settings.colorTheme === theme.id ? 'text-text-primary' : 'text-text-secondary'
                                        }`}>
                                        {theme.name}
                                    </span>
                                    {settings.colorTheme === theme.id && (
                                        <div className="absolute top-2 right-2 text-text-primary">
                                            <Check size={14} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;

export const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
};

export const COLOR_THEMES = {
    BLUE: {
        id: 'blue',
        name: 'Blue',
        colors: {
            primary: '#3b82f6',
            hover: '#2563eb',
        }
    },
    GREEN: {
        id: 'green',
        name: 'Green',
        colors: {
            primary: '#22c55e',
            hover: '#16a34a',
        }
    },
    PURPLE: {
        id: 'purple',
        name: 'Purple',
        colors: {
            primary: '#a855f7',
            hover: '#9333ea',
        }
    },
    ORANGE: {
        id: 'orange',
        name: 'Orange',
        colors: {
            primary: '#f97316',
            hover: '#ea580c',
        }
    },
    RED: {
        id: 'red',
        name: 'Red',
        colors: {
            primary: '#ef4444',
            hover: '#dc2626',
        }
    }
};

export const DEFAULT_SETTINGS = {
    theme: THEMES.DARK,
    colorTheme: 'blue'
};

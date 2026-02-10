/** @type {import('tailwindcss').Config} */
module.exports = {
    // NOTE: NativeWind uses `content` to specify which files to watch for utility classes.
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#3B82F6', // Blue-500
                    50: '#EFF6FF',
                    100: '#DBEAFE',
                    200: '#BFDBFE',
                    300: '#93C5FD',
                    400: '#60A5FA',
                    500: '#3B82F6',
                    600: '#2563EB',
                    700: '#1D4ED8',
                    800: '#1E40AF',
                    900: '#1E3A8A',
                },
                background: '#FFFFFF',
                surface: '#F8FAFC', // Slate-50
                text: {
                    DEFAULT: '#1E293B', // Slate-800
                    secondary: '#64748B', // Slate-500
                    light: '#94A3B8', // Slate-400
                },
                border: '#E2E8F0', // Slate-200
            },
            fontFamily: {
                sans: ['PlusJakartaSans_400Regular'],
                medium: ['PlusJakartaSans_500Medium'],
                semiBold: ['PlusJakartaSans_600SemiBold'],
                bold: ['PlusJakartaSans_700Bold'],
            },
            borderRadius: {
                'xl': '12px',
                '2xl': '16px',
                '3xl': '24px',
            },
            boxShadow: {
                'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                'floating': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            }
        },
    },
    plugins: [],
}

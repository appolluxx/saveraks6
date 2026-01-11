export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Sarabun', 'Inter', 'sans-serif'],
                display: ['Kanit', 'Space Grotesk', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            colors: {
                eco: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#22c55e', // Keeping legacy for fallback
                    600: '#16a34a',
                    700: '#15803d',
                },
                // New Neon Palette
                neon: {
                    green: '#00E978',
                    blue: '#3B82F6',
                    dark: '#003819',
                },
                zinc: {
                    850: '#1f1f22', // Custom surface
                    900: '#18181B',
                    950: '#09090B',
                }
            },
            borderRadius: {
                'unit': '32px',
                'inner': '24px',
            },
            boxShadow: {
                'eco': '0 10px 30px -5px rgba(0, 233, 120, 0.15)',
                'eco-strong': '0 20px 40px -10px rgba(0, 233, 120, 0.25)',
                'neon': '0 0 15px rgba(0, 233, 120, 0.5)',
            },
            animation: {
                'scan': 'scan 2s linear infinite',
            },
            keyframes: {
                scan: {
                    '0%': { top: '0%' },
                    '50%': { top: '100%' },
                    '100%': { top: '0%' },
                }
            }
        }
    },
    plugins: [],
}

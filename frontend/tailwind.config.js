export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', '../components/**/*.{js,ts,jsx,tsx}', '../pages/**/*.{js,ts,jsx,tsx}', '../services/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['DM Sans', 'sans-serif'],
                display: ['Space Grotesk', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            colors: {
                eco: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#22c55e', // Vibrant Natural Green
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                },
                slate: {
                    950: '#0f172a',
                }
            },
            borderRadius: {
                'unit': '32px',
                'inner': '24px',
            },
            boxShadow: {
                'eco': '0 10px 30px -5px rgba(34, 197, 94, 0.15)',
                'eco-strong': '0 20px 40px -10px rgba(34, 197, 94, 0.25)',
            }
        }
    },
    plugins: [],
};

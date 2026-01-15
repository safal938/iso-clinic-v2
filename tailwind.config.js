/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#1f2937',
                    hover: '#111827',
                },
                secondary: {
                    DEFAULT: '#f3f4f6',
                    30: 'rgba(243, 244, 246, 0.3)',
                },
                border: '#e5e7eb',
                neutral: {
                    100: '#f5f5f5',
                    400: '#9ca3af',
                    600: '#4b5563',
                    700: '#374151',
                    800: '#1f2937',
                    900: '#111827',
                },
            },
        },
    },
    plugins: [],
}

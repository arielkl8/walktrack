/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#070B14',
        surface:  '#0F1523',
        card:     '#161E30',
        'card-2': '#1C2640',
        border:   'rgba(255,255,255,0.07)',
        primary:  '#4F94FF',
        accent:   '#00D084',
        danger:   '#FF4757',
        warning:  '#FF9F43',
        'text-1': '#F1F5F9',
        'text-2': '#94A3B8',
        'text-3': '#475569',
      },
      backgroundImage: {
        'grad-start':   'linear-gradient(135deg, #00D084 0%, #0BAB64 100%)',
        'grad-stop':    'linear-gradient(135deg, #FF4757 0%, #C0392B 100%)',
        'grad-primary': 'linear-gradient(135deg, #4F94FF 0%, #1D6FE8 100%)',
        'grad-app':     'linear-gradient(160deg, #070B14 0%, #0D1421 60%, #131B2E 100%)',
        'grad-card':    'linear-gradient(145deg, #161E30, #1C2640)',
      },
      boxShadow: {
        'glow-green':  '0 0 30px rgba(0,208,132,0.35), 0 4px 20px rgba(0,0,0,0.4)',
        'glow-red':    '0 0 30px rgba(255,71,87,0.35),  0 4px 20px rgba(0,0,0,0.4)',
        'glow-blue':   '0 0 30px rgba(79,148,255,0.35), 0 4px 20px rgba(0,0,0,0.4)',
        'card':        '0 4px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'fade-up':    'fadeUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%,100%': { opacity: 1 },
          '50%':     { opacity: 0.6 },
        },
      },
    },
  },
  plugins: [],
};

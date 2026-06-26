/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Aerospace dark ─────────────────────────────────────────────
        // Deep-navy neutrals carry structure + light text; cyan steel is the
        // cool accent, saturated colour reserved for the thermal scale.
        ground: '#060A14', // deep navy — page background
        surface: {
          DEFAULT: '#0B1322', // panels
          raised: '#121D33', // raised cards / instrument glass
          sunk: '#080F1C', // recessed wells (slider tracks, readouts)
        },
        hairline: '#1F3350', // rules & borders
        ink: {
          DEFAULT: '#E7EEF7', // primary text
          soft: '#9BACC4', // secondary text / captions
          faint: '#647892', // tertiary / disabled
        },
        steel: {
          DEFAULT: '#1C84A8', // cyan accent — links, non-thermal data
          deep: '#34B4D6',
          wash: '#13283C', // tinted fill on the dark ground
        },
        // `*-ink` variants are brightened for legible text on the dark ground.
        thermal: {
          healthy: '#2EA982',
          'healthy-ink': '#45D9A8',
          warm: '#E0A100',
          'warm-ink': '#F2C75A',
          ember: '#E2631E',
          critical: '#EF5350',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        eyebrow: '0.18em',
      },
      boxShadow: {
        panel: '0 1px 2px rgba(26, 23, 20, 0.04), 0 8px 24px -12px rgba(26, 23, 20, 0.12)',
        'panel-raised': '0 2px 4px rgba(26, 23, 20, 0.06), 0 16px 40px -16px rgba(26, 23, 20, 0.18)',
        instrument: 'inset 0 1px 0 rgba(255,255,255,0.7), inset 0 0 0 1px rgba(207,201,192,0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out both',
        'slide-in': 'slideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'halo-pulse': 'haloPulse 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'signal-blink': 'signalBlink 1.8s steps(1, end) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        haloPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(200, 65, 11, 0.0)' },
          '50%': { boxShadow: '0 0 0 6px rgba(200, 65, 11, 0.16)' },
        },
        signalBlink: {
          '0%, 60%': { opacity: '1' },
          '61%, 100%': { opacity: '0.35' },
        },
      },
    },
  },
  plugins: [],
};

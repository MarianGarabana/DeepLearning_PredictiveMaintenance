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
        // ── Titanium & Ember ───────────────────────────────────────────
        // Warm metallic neutrals carry structure + text; saturated colour
        // is reserved for the thermal scale (colour = heat = remaining life).
        ground: '#E9E6E1', // brushed titanium — page background
        surface: {
          DEFAULT: '#FBFAF8', // panels
          raised: '#FFFFFF', // raised cards / instrument glass
          sunk: '#E2DED7', // recessed wells (slider tracks, readouts)
        },
        hairline: '#CFC9C0', // rules & borders
        ink: {
          DEFAULT: '#1A1714', // graphite — primary text
          soft: '#5A544C', // secondary text / captions
          faint: '#8C857B', // tertiary / disabled
        },
        steel: {
          DEFAULT: '#3B6E8F', // cool accent — links, non-thermal data
          deep: '#2A506A',
          wash: '#E4EBF0', // tinted fill on light ground
        },
        // `*-ink` variants are darkened for legible text on the light ground.
        thermal: {
          healthy: '#2E9E7B',
          'healthy-ink': '#1F6E55',
          warm: '#E0A100',
          'warm-ink': '#946800',
          ember: '#C8410B',
          critical: '#8E1B0E',
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

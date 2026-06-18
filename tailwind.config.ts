/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    // Use glob patterns that work from project root (where npm run build executes)
    "./client/src/**/*.{js,jsx,ts,tsx}",
    "./client/index.html",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Color mappings using HSL CSS variables (supports opacity modifiers)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // Premium Design System Color Tokens
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        tertiary: {
          DEFAULT: "hsl(var(--tertiary))",
          foreground: "hsl(var(--tertiary-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        error: {
          DEFAULT: "hsl(var(--error))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        
        // Existing mappings (backward compatibility)
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Neutral palette mappings
        surface: "hsl(var(--card))",
        text: "hsl(var(--foreground))",

        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        // RT-SYS Design Token Colors (opacity-modifier safe)
        "rt-primary": {
          DEFAULT: "hsl(var(--rt-sys-color-primary))",
          fg: "hsl(var(--rt-sys-color-primary-fg))",
        },
        "rt-secondary": {
          DEFAULT: "hsl(var(--rt-sys-color-secondary))",
          fg: "hsl(var(--rt-sys-color-secondary-fg))",
        },
        "rt-tertiary": {
          DEFAULT: "hsl(var(--rt-sys-color-tertiary))",
          fg: "hsl(var(--rt-sys-color-tertiary-fg))",
        },
        "rt-success": {
          DEFAULT: "hsl(var(--rt-sys-color-success))",
          fg: "hsl(var(--rt-sys-color-success-fg))",
        },
        "rt-destructive": {
          DEFAULT: "hsl(var(--rt-sys-color-destructive))",
          fg: "hsl(var(--rt-sys-color-destructive-fg))",
        },
        "rt-warning": {
          DEFAULT: "hsl(var(--rt-sys-color-warning))",
          fg: "hsl(var(--rt-sys-color-warning-fg))",
        },
        "rt-background": "hsl(var(--rt-sys-color-background))",
        "rt-surface": "hsl(var(--rt-sys-color-surface))",
        "rt-border": "hsl(var(--rt-sys-color-border))",
        "rt-muted": {
          DEFAULT: "hsl(var(--rt-sys-color-muted))",
          fg: "hsl(var(--rt-sys-color-muted-fg))",
        },
      },

      // Custom spacing scale (4/8/12/16/24/32px)
      spacing: {
        'xs': 'var(--spacing-xs)',
        'sm': 'var(--spacing-sm)',
        'md': 'var(--spacing-md)',
        'lg': 'var(--spacing-lg)',
        'xl': 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
        // RT-SYS fluid spacing tokens
        'rt-xs':  'var(--rt-sys-spacing-xs)',
        'rt-sm':  'var(--rt-sys-spacing-sm)',
        'rt-md':  'var(--rt-sys-spacing-md)',
        'rt-lg':  'var(--rt-sys-spacing-lg)',
        'rt-xl':  'var(--rt-sys-spacing-xl)',
        'rt-2xl': 'var(--rt-sys-spacing-2xl)',
      },

      // Custom box-shadow values including glow effect
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'glow': 'var(--shadow-glow)',
        // RT-SYS shadow tokens
        'soft': 'var(--rt-sys-shadow-soft)',
        'rt-glow': 'var(--rt-sys-shadow-glow)',
      },

      // Transition duration utilities
      transitionDuration: {
        'fast': 'var(--duration-fast)',
        'normal': 'var(--duration-normal)',
        'slow': 'var(--duration-slow)',
        'slower': 'var(--duration-slower)',
        '120': '120ms',
        '160': '160ms',
        '180': '180ms',
      },

      // Transition timing function utilities
      transitionTimingFunction: {
        'bounce': 'cubic-bezier(0.2, 0.9, 0.3, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Premium design system radius tokens
        'xs': 'var(--radius-sm)',
        'premium-sm': 'var(--radius-md)',
        'premium-md': 'var(--radius-lg)',
        'premium-lg': 'var(--radius-xl)',
        'full': 'var(--radius-full)',
        // RT-SYS radius tokens
        'rt-sm':  'var(--rt-sys-radius-sm)',
        'rt-md':  'var(--rt-sys-radius-md)',
        'rt-lg':  'var(--rt-sys-radius-lg)',
        'rt-xl':  'var(--rt-sys-radius-xl)',
        'rt-2xl': 'var(--rt-sys-radius-2xl)',
      },

      // RT-SYS fluid font sizes
      fontSize: {
        'rt-sm':   ['var(--rt-sys-text-sm)',   { lineHeight: '1.4' }],
        'rt-base': ['var(--rt-sys-text-base)', { lineHeight: '1.5' }],
        'rt-lg':   ['var(--rt-sys-text-lg)',   { lineHeight: '1.5' }],
        'rt-xl':   ['var(--rt-sys-text-xl)',   { lineHeight: '1.3' }],
        'rt-2xl':  ['var(--rt-sys-text-2xl)',  { lineHeight: '1.2' }],
        'rt-3xl':  ['var(--rt-sys-text-3xl)',  { lineHeight: '1.1' }],
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

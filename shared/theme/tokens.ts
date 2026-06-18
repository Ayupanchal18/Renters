export const palettes = {
  light: {
    background: "hsl(210, 40%, 98%)",    // #F8FAFC
    surface: "hsl(0, 0%, 100%)",         // #FFFFFF
    textPrimary: "hsl(222, 47%, 11%)",   // #0F172A
    textSecondary: "hsl(215, 16%, 40%)", // #64748B
    primary: "hsl(228, 100%, 58%)",      // #2B50FF
    primaryPressed: "hsl(228, 100%, 48%)",
    secondary: "hsl(1, 100%, 70%)",      // #FF6B68
    tertiary: "hsl(41, 100%, 67%)",      // #FFC857
    border: "hsl(214, 32%, 91%)",        // #E2E8F0
    success: "hsl(160, 84%, 39%)",       // #10B981
    error: "hsl(0, 84%, 60%)",           // #EF4444
    warning: "hsl(38, 92%, 50%)",        // #F59E0B
    card: "hsl(0, 0%, 100%)",
    input: "hsl(210, 40%, 96%)",
  },
  dark: {
    background: "hsl(222, 47%, 6%)",     // Very dark navy
    surface: "hsl(222, 47%, 11%)",        // Dark navy
    textPrimary: "hsl(210, 40%, 98%)",   // Off-white
    textSecondary: "hsl(215, 16%, 70%)", // Muted gray
    primary: "hsl(228, 100%, 65%)",      // Brighter blue for dark mode
    primaryPressed: "hsl(228, 100%, 75%)",
    secondary: "hsl(1, 100%, 75%)",
    tertiary: "hsl(41, 100%, 70%)",
    border: "hsl(222, 47%, 18%)",        // Dark border
    success: "hsl(160, 84%, 45%)",
    error: "hsl(0, 84%, 65%)",
    warning: "hsl(38, 92%, 60%)",
    card: "hsl(222, 47%, 13%)",
    input: "hsl(222, 47%, 10%)",
  }
};

export const colors = palettes.light;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
  weights: {
    normal: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
};

export const radius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14,
  full: 9999,
};

export const shadows = {
  light: {
    soft: {
      shadowColor: "hsl(228, 100%, 58%)",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    glow: {
      shadowColor: "hsl(228, 100%, 58%)",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 4,
    }
  },
  dark: {
    soft: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
    },
    glow: {
      shadowColor: "hsl(228, 100%, 65%)",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 6,
    }
  }
};

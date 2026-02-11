/**
 * ASSESSIFY Color System
 * Centralized color constants for use across the application
 */

// Core Brand Colors
export const COLORS = {
  // Primary Brand Colors (Foundation)
  PRIMARY_DARK: "#1F2A5A", // Authority & Trust - nav, titles, sidebars
  PRIMARY_BLUE: "#2563EB", // Primary CTA - buttons, active links
  ACCENT_CYAN: "#38D4E5", // Progress & Highlight - progress bars, indicators

  // Neutral UI Colors (Daily Use)
  BG_WHITE: "#FFFFFF", // Main content background
  BG_LIGHT: "#F5F7FA", // Dashboard background, cards
  BORDER_GRAY: "#E5E7EB", // Input borders, dividers
  TEXT_GRAY: "#6B7280", // Body text, helper text

  // Semantic Colors (System Feedback)
  SUCCESS: "#16A34A", // Submitted, passed, positive
  WARNING: "#F59E0B", // Pending, needs review
  ERROR: "#DC2626", // Failed, rejected, errors

  // Dark Mode Colors
  DARK_BG: "#0F172A",
  DARK_CARD: "#1E293B",
  DARK_BORDER: "rgba(255, 255, 255, 0.1)",
} as const;

// Button Color Maps
export const BUTTON_COLORS = {
  primary: {
    bg: COLORS.PRIMARY_BLUE,
    text: COLORS.BG_WHITE,
    hover: "#1D4ED8",
    disabled: "#93C5FD",
  },
  secondary: {
    bg: COLORS.BG_WHITE,
    border: COLORS.PRIMARY_BLUE,
    text: COLORS.PRIMARY_BLUE,
    hover: "#EFF6FF",
  },
  danger: {
    bg: COLORS.ERROR,
    text: COLORS.BG_WHITE,
    hover: "#B91C1C",
  },
} as const;

// Status Color Maps
export const STATUS_COLORS = {
  submitted: COLORS.SUCCESS,
  pending: COLORS.WARNING,
  notSubmitted: COLORS.ERROR,
  graded: COLORS.PRIMARY_BLUE,
  awaitingGrading: COLORS.WARNING,
  overdue: COLORS.ERROR,
} as const;

// Chart/Analytics Colors
export const CHART_COLORS = {
  primary: COLORS.PRIMARY_BLUE,
  secondary: COLORS.ACCENT_CYAN,
  success: COLORS.SUCCESS,
  warning: COLORS.WARNING,
  error: COLORS.ERROR,
  grid: COLORS.BORDER_GRAY,
} as const;

// Form State Colors
export const FORM_COLORS = {
  default: {
    border: COLORS.BORDER_GRAY,
    bg: COLORS.BG_WHITE,
    text: COLORS.PRIMARY_DARK,
  },
  focus: {
    border: COLORS.PRIMARY_BLUE,
    shadow: "rgba(37, 99, 235, 0.25)",
  },
  error: {
    border: COLORS.ERROR,
    text: COLORS.ERROR,
  },
} as const;

/**
 * Get color value from CSS custom properties
 * Useful for dynamic styling in JavaScript
 */
export function getCSSVariable(variableName: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(
    `--${variableName}`
  ).trim();
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

/**
 * Get contrast color (black or white) for a given background color
 */
export function getContrastColor(
  hexColor: string
): typeof COLORS.BG_WHITE | typeof COLORS.PRIMARY_DARK {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return COLORS.PRIMARY_DARK;

  // Calculate luminance
  const luminance =
    (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? COLORS.PRIMARY_DARK : COLORS.BG_WHITE;
}

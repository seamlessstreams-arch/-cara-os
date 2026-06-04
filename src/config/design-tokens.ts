// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — DESIGN TOKENS
// Calm design system constants. Warm neutrals, gentle status colours,
// generous spacing. Every value here feeds the "professional calm" aesthetic.
// ══════════════════════════════════════════════════════════════════════════════

export const CORNERSTONE_TOKENS = {
  colors: {
    // Warm neutrals (primary palette)
    navy: "#1e293b",        // Primary brand
    warmWhite: "#fafaf9",   // Background
    stone: "#78716c",       // Muted text
    warmGray: "#f5f5f4",    // Card backgrounds
    sand: "#e7e5e4",        // Borders
    // Status (gentle, not harsh)
    safeGreen: "#16a34a",
    cautionAmber: "#d97706",
    alertRed: "#dc2626",
    infoBlue: "#2563eb",
    // Accents
    ariaGold: "#d4a843",    // AI features
    calmTeal: "#119488",    // Cornerstone signature teal (logo growth/plant)
    softPurple: "#7c3aed",  // Intelligence
    // Avisaar — warm children's-care accent trio (logo puzzle pieces)
    avisaarSage: "#6fb497",
    avisaarCoral: "#d9685c",
    avisaarAmber: "#eaba3f",
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    xxl: "3rem",
  },
  radius: {
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
    full: "9999px",
  },
  shadow: {
    subtle: "0 1px 2px 0 rgb(0 0 0 / 0.03)",
    card: "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
    elevated: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
  },
} as const;

export const ROLE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  support_worker: {
    label: "Support Worker",
    color: "bg-blue-100 text-blue-800",
    icon: "Heart",
  },
  senior_support_worker: {
    label: "Senior Support Worker",
    color: "bg-indigo-100 text-indigo-800",
    icon: "Shield",
  },
  registered_manager: {
    label: "Registered Manager",
    color: "bg-purple-100 text-purple-800",
    icon: "Crown",
  },
  responsible_individual: {
    label: "Responsible Individual",
    color: "bg-amber-100 text-amber-800",
    icon: "Building2",
  },
  admin: {
    label: "Administrator",
    color: "bg-slate-100 text-slate-800",
    icon: "Settings",
  },
};

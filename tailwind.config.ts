import type { Config } from 'tailwindcss'
import tailwindcss from '@tailwindcss/vite'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Professional dark tool aesthetic — Phase 3 redesign
        'bg-primary': '#09090B',      // zinc-950 — deepest background
        'bg-secondary': '#18181B',     // zinc-900 — panel surface
        'bg-tertiary': '#1C1C1E',     // zinc-900/80 — elevated surface
        'bg-hover': '#27272A',        // zinc-800 — hover state
        'border-subtle': '#27272A',    // zinc-800 — default border
        'border-default': '#3F3F46',  // zinc-700 — emphasis border
        'text-primary': '#fafafa',    // zinc-50 — primary text
        'text-secondary': '#a1a1aa',  // zinc-400 — secondary text
        'text-disabled': '#52525b',   // zinc-600 — disabled/muted
        'accent-primary': '#f97316',  // orange-500 — primary brand
        'accent-primary-hover': '#fb923c', // orange-400
        'accent-secondary': '#3b82f6', // blue-500
        'accent-success': '#22c55e', // green-500
        'accent-warning': '#eab308', // yellow-500
        'accent-danger': '#ef4444',  // red-500
        'timeline-video': '#8b5cf6', // violet-500
        'timeline-audio': '#06b6d4', // cyan-500
        'timeline-subtitle': '#f59e0b', // amber-500
        // Base-ui / shadcn design tokens (required by components)
        'foreground': '#fafafa',
        'muted': '#27272A',
        'muted-foreground': '#71717a',
        'popover': '#18181B',
        'popover-foreground': '#fafafa',
        'accent': '#27272A',
        'accent-foreground': '#fafafa',
        'primary': '#f97316',
        'primary-foreground': '#ffffff',
        'secondary': '#27272A',
        'secondary-foreground': '#fafafa',
        'destructive': '#ef4444',
        'destructive-foreground': '#ffffff',
        'border': '#27272A',
        'input': '#27272A',
        'ring': '#f97316',
        'ring-offset': '#09090B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config

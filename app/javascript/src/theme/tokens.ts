/**
 * Typed accessors for the kidsmin CSS variable contract.
 *
 * These read the live computed value at call time, so they always reflect
 * the current theme — including overrides set by a host app theme gem.
 *
 * Usage:
 *   import { tokens } from "@/theme/tokens"
 *   const color = tokens.color.primary  // → "#5B21B6" (or whatever the theme sets)
 *
 * Components should prefer Tailwind utilities (bg-primary etc.) over calling
 * these directly. Use tokens only when you need the value in JS (e.g. canvas, charts).
 */

function cssVar(name: string): string {
  if (typeof window === "undefined") return ""
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export const tokens = {
  color: {
    primary:      () => cssVar("--kidsmin-color-primary"),
    primaryFg:    () => cssVar("--kidsmin-color-primary-fg"),
    primaryHover: () => cssVar("--kidsmin-color-primary-hover"),
    accent:       () => cssVar("--kidsmin-color-accent"),
    accentFg:     () => cssVar("--kidsmin-color-accent-fg"),
    accentHover:  () => cssVar("--kidsmin-color-accent-hover"),
    background:   () => cssVar("--kidsmin-color-background"),
    surface:      () => cssVar("--kidsmin-color-surface"),
    text:         () => cssVar("--kidsmin-color-text"),
    textMuted:    () => cssVar("--kidsmin-color-text-muted"),
    textInverse:  () => cssVar("--kidsmin-color-text-inverse"),
    border:       () => cssVar("--kidsmin-color-border"),
    success:      () => cssVar("--kidsmin-color-success"),
    warning:      () => cssVar("--kidsmin-color-warning"),
    error:        () => cssVar("--kidsmin-color-error"),
  },
  font: {
    heading: () => cssVar("--kidsmin-font-heading"),
    body:    () => cssVar("--kidsmin-font-body"),
    mono:    () => cssVar("--kidsmin-font-mono"),
  },
  radius: {
    base: () => cssVar("--kidsmin-radius"),
    sm:   () => cssVar("--kidsmin-radius-sm"),
    full: () => cssVar("--kidsmin-radius-full"),
  },
  shadow: {
    sm: () => cssVar("--kidsmin-shadow-sm"),
    md: () => cssVar("--kidsmin-shadow-md"),
    lg: () => cssVar("--kidsmin-shadow-lg"),
  },
} as const

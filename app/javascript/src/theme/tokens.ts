/**
 * Typed accessors for the kidspire CSS variable contract.
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
    primary:      () => cssVar("--kidspire-color-primary"),
    primaryFg:    () => cssVar("--kidspire-color-primary-fg"),
    primaryHover: () => cssVar("--kidspire-color-primary-hover"),
    accent:       () => cssVar("--kidspire-color-accent"),
    accentFg:     () => cssVar("--kidspire-color-accent-fg"),
    accentHover:  () => cssVar("--kidspire-color-accent-hover"),
    background:   () => cssVar("--kidspire-color-background"),
    surface:      () => cssVar("--kidspire-color-surface"),
    text:         () => cssVar("--kidspire-color-text"),
    textMuted:    () => cssVar("--kidspire-color-text-muted"),
    textInverse:  () => cssVar("--kidspire-color-text-inverse"),
    border:       () => cssVar("--kidspire-color-border"),
    success:      () => cssVar("--kidspire-color-success"),
    warning:      () => cssVar("--kidspire-color-warning"),
    error:        () => cssVar("--kidspire-color-error"),
  },
  font: {
    heading: () => cssVar("--kidspire-font-heading"),
    body:    () => cssVar("--kidspire-font-body"),
    mono:    () => cssVar("--kidspire-font-mono"),
  },
  radius: {
    base: () => cssVar("--kidspire-radius"),
    sm:   () => cssVar("--kidspire-radius-sm"),
    full: () => cssVar("--kidspire-radius-full"),
  },
  shadow: {
    sm: () => cssVar("--kidspire-shadow-sm"),
    md: () => cssVar("--kidspire-shadow-md"),
    lg: () => cssVar("--kidspire-shadow-lg"),
  },
} as const

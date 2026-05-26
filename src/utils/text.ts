/** Capitalize first letter of each word */
export function capitalize(s: string): string {
  if (!s) return s
  return s.replace(/\b[a-z]/g, c => c.toUpperCase())
}

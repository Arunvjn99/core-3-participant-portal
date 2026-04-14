/** Apply company primary + optional branding to CSS variables (legacy + new tokens). */

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

function darkenColor(hex: string, percent: number): string {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) return hex
  const num = Number.parseInt(normalized, 16)
  const r = Math.max(0, (num >> 16) - Math.round(2.55 * percent))
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(2.55 * percent))
  const b = Math.max(0, (num & 0xff) - Math.round(2.55 * percent))
  return toHex(r, g, b)
}

function lightenColor(hex: string, percent: number): string {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) return hex
  const num = Number.parseInt(normalized, 16)
  const r = Math.min(255, (num >> 16) + Math.round(2.55 * percent))
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(2.55 * percent))
  const b = Math.min(255, (num & 0xff) + Math.round(2.55 * percent))
  return toHex(r, g, b)
}

function parseBranding(brandingJson: unknown): { font_family?: string } | null {
  if (!brandingJson) return null
  if (typeof brandingJson === 'string') {
    try {
      return JSON.parse(brandingJson) as { font_family?: string }
    } catch {
      return null
    }
  }
  if (typeof brandingJson === 'object' && brandingJson !== null) {
    return brandingJson as { font_family?: string }
  }
  return null
}

function expandShortHex(hex: string): string {
  const t = hex.trim()
  if (/^#[0-9A-Fa-f]{3}$/.test(t)) {
    return `#${t[1]}${t[1]}${t[2]}${t[2]}${t[3]}${t[3]}`
  }
  return t
}

export function applyBrandTheme(primaryColor: string, brandingJson?: unknown) {
  const root = document.documentElement
  const trimmed = primaryColor.trim()
  const isHex = /^#[0-9A-Fa-f]{6}$/.test(trimmed) || /^#[0-9A-Fa-f]{3}$/.test(trimmed)

  root.style.setProperty('--brand-primary', primaryColor)
  root.style.setProperty('--color-brand', primaryColor)

  if (isHex) {
    const full = expandShortHex(trimmed)
    const hover = darkenColor(full, 15)
    const light = lightenColor(full, 85)
    root.style.setProperty('--brand-primary-hover', hover)
    root.style.setProperty('--brand-primary-light', light)
    root.style.setProperty('--brand-primary-ring', `${full}40`)
    root.style.setProperty('--color-brand-hover', hover)
  } else {
    root.style.setProperty('--brand-primary-hover', primaryColor)
    root.style.setProperty('--brand-primary-light', '#eff6ff')
    root.style.setProperty('--brand-primary-ring', 'rgba(37, 99, 235, 0.25)')
    root.style.setProperty('--color-brand-hover', primaryColor)
  }

  const branding = parseBranding(brandingJson)
  if (branding?.font_family) {
    root.style.setProperty('--brand-font', branding.font_family)
    root.style.setProperty('--font-sans', branding.font_family)
  }
}

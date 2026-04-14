import type { ThemeMode, BrandTheme } from '../types/theme.types'
import { defaultBrands, getBrandBySlug } from './defaultBrands'
import { STORAGE_KEYS } from '../../lib/constants'

export function applyTheme(resolved: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', resolved)
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(resolved)
}

export function applyBrand(slug: string) {
  document.documentElement.setAttribute('data-brand', slug)
}

export function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return mode
}

export function persistMode(mode: ThemeMode) {
  localStorage.setItem(STORAGE_KEYS.THEME, mode)
}

export function persistBrand(slug: string) {
  localStorage.setItem(STORAGE_KEYS.BRAND, slug)
}

export function loadPersistedMode(): ThemeMode {
  return (localStorage.getItem(STORAGE_KEYS.THEME) as ThemeMode) || 'system'
}

export function loadPersistedBrand(): string {
  return localStorage.getItem(STORAGE_KEYS.BRAND) || 'default'
}

export async function resolveBrandFromSupabase(_companyId: string): Promise<BrandTheme | null> {
  // In a real app, fetch company brand data from Supabase here
  // For now, fall back to defaults
  return null
}

export { defaultBrands, getBrandBySlug }

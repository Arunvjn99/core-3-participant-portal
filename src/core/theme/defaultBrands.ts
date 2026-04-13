import type { BrandTheme } from '../types/theme.types'

export const defaultBrands: BrandTheme[] = [
  {
    slug: 'default',
    label: 'Default',
    primaryColor: '#0052CC',
    primaryHover: '#0747A6',
    primaryActive: '#043584',
    primarySubtle: '#DEEBFF',
  },
  {
    slug: 'lincoln',
    label: 'Lincoln Financial',
    primaryColor: '#002B5C',
    primaryHover: '#001E42',
    primaryActive: '#001129',
    primarySubtle: '#E8EEF5',
  },
  {
    slug: 'vanguard',
    label: 'Vanguard',
    primaryColor: '#7B1F28',
    primaryHover: '#5C1720',
    primaryActive: '#3D0F16',
    primarySubtle: '#F5E8EA',
  },
  {
    slug: 'fidelity',
    label: 'Fidelity',
    primaryColor: '#006FAD',
    primaryHover: '#005A8C',
    primaryActive: '#00426B',
    primarySubtle: '#E0F0F9',
  },
  {
    slug: 'schwab',
    label: 'Charles Schwab',
    primaryColor: '#00A0DC',
    primaryHover: '#0085B8',
    primaryActive: '#006A94',
    primarySubtle: '#E0F5FC',
  },
]

export const getBrandBySlug = (slug: string): BrandTheme | undefined =>
  defaultBrands.find((b) => b.slug === slug)

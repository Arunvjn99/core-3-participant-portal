import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react'
import type { Severity } from './buildNotifications'


// Borders use color-mix: the status colours are CSS variables, so Tailwind's "/30" opacity suffix produces nothing
// and the border would fall back to the default light grey, which shows as a white line in dark theme.
export const SEVERITY_STYLE: Record<Severity, { box: string; icon: string; Icon: typeof Info }> = {
  action: { box: 'border-[color:color-mix(in_srgb,var(--status-danger)_25%,transparent)] bg-status-danger-bg', icon: 'text-status-danger', Icon: ShieldAlert },
  warning: { box: 'border-[color:color-mix(in_srgb,var(--status-warning)_30%,transparent)] bg-status-warning-bg', icon: 'text-status-warning', Icon: AlertTriangle },
  info: { box: 'border-border-default bg-surface-card', icon: 'text-primary', Icon: Info },
  success: { box: 'border-[color:color-mix(in_srgb,var(--status-success)_25%,transparent)] bg-status-success-bg', icon: 'text-status-success', Icon: CheckCircle2 },
}

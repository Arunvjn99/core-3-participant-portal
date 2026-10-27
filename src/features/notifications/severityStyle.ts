import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react'
import type { Severity } from './buildNotifications'

export const SEVERITY_STYLE: Record<Severity, { box: string; icon: string; Icon: typeof Info }> = {
  action: { box: 'border-status-danger/25 bg-status-danger-bg', icon: 'text-status-danger', Icon: ShieldAlert },
  warning: { box: 'border-status-warning/30 bg-status-warning-bg', icon: 'text-status-warning', Icon: AlertTriangle },
  info: { box: 'border-border-default bg-surface-card', icon: 'text-primary', Icon: Info },
  success: { box: 'border-status-success/25 bg-status-success-bg', icon: 'text-status-success', Icon: CheckCircle2 },
}

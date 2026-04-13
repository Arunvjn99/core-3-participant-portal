import { useNavigate } from 'react-router-dom'
import { TrendingUp, BarChart2, Banknote, UserCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../../../design-system/components/Card'

const actions = [
  { label: 'Change Contribution', icon: TrendingUp, path: '/enrollment/contribution', color: 'text-primary' },
  { label: 'View Investments', icon: BarChart2, path: '/investments', color: 'text-status-info' },
  { label: 'Request Loan', icon: Banknote, path: '/transactions/loan', color: 'text-status-warning' },
  { label: 'Update Profile', icon: UserCircle, path: '/profile', color: 'text-status-success' },
]

export function QuickActions() {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <div className="grid grid-cols-2 gap-3">
        {actions.map(({ label, icon: Icon, path, color }) => (
          <button
            key={label}
            type="button"
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-2 rounded-lg border border-border-default p-4 text-center transition-colors hover:border-border-focus hover:bg-surface-page"
          >
            <Icon className={`h-5 w-5 ${color}`} />
            <span className="text-xs font-medium text-text-secondary">{label}</span>
          </button>
        ))}
      </div>
    </Card>
  )
}

export default QuickActions

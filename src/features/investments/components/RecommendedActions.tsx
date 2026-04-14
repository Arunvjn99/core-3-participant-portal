import { RefreshCw, TrendingUp, ShieldAlert, ArrowRight, Sparkles } from "lucide-react";

const actions = [
  {
    title: "Rebalance Portfolio",
    description: "Your allocation has drifted 5% from target. Rebalancing reduces risk and locks in gains.",
    improvement: "+0.8% expected annual return",
    icon: RefreshCw,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    ctaLabel: "Rebalance Now",
    ctaBg: "btn-brand",
    priority: "Recommended",
    priorityBg: "bg-blue-50 text-blue-700",
    accentColor: "from-blue-500",
  },
  {
    title: "Increase Contribution",
    description: "Increasing from 8% to 10% could add ~$42,000 to your retirement balance by age 65.",
    improvement: "+$42k projected at 65",
    icon: TrendingUp,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    ctaLabel: "Adjust Contribution",
    ctaBg: "bg-emerald-600 hover:bg-emerald-700",
    priority: "High Impact",
    priorityBg: "bg-emerald-50 text-emerald-700",
    accentColor: "from-emerald-500",
  },
  {
    title: "Review Risk Level",
    description: "Market conditions have changed. Consider reviewing your risk tolerance for better alignment.",
    improvement: "Better risk-adjusted returns",
    icon: ShieldAlert,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    ctaLabel: "Review Risk",
    ctaBg: "bg-amber-600 hover:bg-amber-700",
    priority: "Optional",
    priorityBg: "bg-amber-50 text-amber-700",
    accentColor: "from-amber-500",
  },
];

function RecommendedActions() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <h3 className="text-gray-900 dark:text-white">Recommended Actions</h3>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Personalized steps to improve your retirement outlook</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <div
              key={action.title}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 hover:shadow-md transition-all group relative overflow-hidden flex flex-col"
            >
              {/* Top accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${action.accentColor} to-transparent opacity-60`} />

              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${action.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${action.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-900 dark:text-white" style={{ fontWeight: 600 }}>{action.title}</p>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${action.priorityBg}`}
                    style={{ fontWeight: 500 }}
                  >
                    {action.priority}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3 flex-1">{action.description}</p>

              <div className="flex items-center gap-1 mb-4">
                <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="text-xs text-emerald-600" style={{ fontWeight: 500 }}>{action.improvement}</span>
              </div>

              <button
                className={`${action.ctaBg} text-white w-full py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5`}
                style={{ fontWeight: 500 }}
              >
                {action.ctaLabel}
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RecommendedActions

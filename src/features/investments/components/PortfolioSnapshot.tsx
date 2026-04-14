import { TrendingUp, ArrowUpRight, BarChart3 } from "lucide-react";

function PortfolioSnapshot() {
  const totalBalance = 287450.82;
  const totalInvested = 239220.0;
  const totalGain = totalBalance - totalInvested;
  const gainPercent = ((totalGain / totalInvested) * 100).toFixed(1);
  const annualReturn = 12.4;
  const spComparison = 1.2;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
      {/* Main Balance Section */}
      <div className="p-5 sm:p-7 pb-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
            <BarChart3 className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-900 dark:text-white" style={{ fontWeight: 500 }}>Portfolio Snapshot</p>
            <p className="text-[11px] text-gray-400">As of March 16, 2026</p>
          </div>
        </div>

        {/* Total Balance — Primary Focus */}
        <div className="mb-5">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide" style={{ fontWeight: 500 }}>Total Portfolio Balance</p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <p className="text-4xl sm:text-5xl text-gray-900 dark:text-white tracking-tight" style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
              ${Math.floor(totalBalance).toLocaleString()}
              <span className="text-xl text-gray-300 dark:text-gray-600" style={{ fontWeight: 400 }}>
                .{(totalBalance % 1).toFixed(2).slice(2)}
              </span>
            </p>
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs" style={{ fontWeight: 500 }}>
              <TrendingUp className="w-3 h-3" />
              +{annualReturn}% YTD
            </span>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard
            label="Total Invested"
            value={`$${totalInvested.toLocaleString("en-US", { minimumFractionDigits: 0 })}`}
            detail="contributions + rollovers"
            color="text-gray-900 dark:text-white"
          />
          <MetricCard
            label="Total Gain"
            value={`+$${totalGain.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            detail={`+${gainPercent}% all time`}
            color="text-emerald-600"
            positive
          />
          <MetricCard
            label="Annual Return"
            value={`+${annualReturn}%`}
            detail="since Jan 2026"
            color="text-emerald-600"
            positive
          />
          <MetricCard
            label="vs S&P 500"
            value={`+${spComparison}%`}
            detail="outperforming benchmark"
            color="text-blue-600"
            positive
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  color,
  positive,
}: {
  label: string;
  value: string;
  detail: string;
  color: string;
  positive?: boolean;
}) {
  return (
      <div className="bg-gray-50/80 dark:bg-gray-800 rounded-xl p-3.5">
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1.5">{label}</p>
      <div className="flex items-center gap-1">
        {positive && (
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        )}
        <p className={`text-base sm:text-lg ${color} tracking-tight`} style={{ fontWeight: 600 }}>
          {value}
        </p>
      </div>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{detail}</p>
    </div>
  );
}

export default PortfolioSnapshot

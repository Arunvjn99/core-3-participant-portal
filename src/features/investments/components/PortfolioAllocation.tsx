import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const allocationData = [
  {
    group: "Growth Assets",
    percentage: 55,
    color: "#3b82f6",
    items: ["US Large Cap (35%)", "Int'l Stocks (12%)", "Small Cap (8%)"],
  },
  {
    group: "Income Assets",
    percentage: 30,
    color: "#8b5cf6",
    items: ["Investment Grade Bonds (18%)", "TIPS (7%)", "High Yield (5%)"],
  },
  {
    group: "Defensive Assets",
    percentage: 15,
    color: "#06b6d4",
    items: ["Money Market (8%)", "Stable Value (5%)", "Cash (2%)"],
  },
];

const pieData = allocationData.map((d) => ({ name: d.group, value: d.percentage, color: d.color }));

function PortfolioAllocation() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
      <h3 className="text-gray-900 mb-1">Portfolio Allocation</h3>
      <p className="text-xs text-gray-500 mb-5">Asset class breakdown by category</p>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Donut Chart */}
        <div className="relative shrink-0" style={{ width: 160, height: 160, minHeight: 160, minWidth: 160 }}>
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg text-gray-900" style={{ fontWeight: 600 }}>3</span>
            <span className="text-[10px] text-gray-400">classes</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-4 w-full">
          {allocationData.map((group) => (
            <div key={group.group}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                  <span className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{group.group}</span>
                </div>
                <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{group.percentage}%</span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-gray-100 rounded-full mb-1.5">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${group.percentage}%`, backgroundColor: group.color }}
                />
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                {group.items.map((item) => (
                  <span key={item} className="text-[11px] text-gray-400">{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default PortfolioAllocation

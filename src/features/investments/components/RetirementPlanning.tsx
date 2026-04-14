import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Target, TrendingUp } from "lucide-react";

const goalValue = 1300;

const scenarios: Record<
  string,
  {
    data: { age: number; projected: number }[];
    projected: string;
    monthlyIncome: string;
    color: string;
    description: string;
    score: number;
  }
> = {
  Base: {
    projected: "$1,420,000",
    monthlyIncome: "$4,820",
    color: "#3b82f6",
    description: "Current trajectory at 8% contribution",
    score: 74,
    data: [
      { age: 35, projected: 287 },
      { age: 40, projected: 420 },
      { age: 45, projected: 580 },
      { age: 50, projected: 780 },
      { age: 55, projected: 1020 },
      { age: 60, projected: 1220 },
      { age: 65, projected: 1420 },
    ],
  },
  "Market -10%": {
    projected: "$1,120,000",
    monthlyIncome: "$3,800",
    color: "#ef4444",
    description: "Stress test with 10% market decline",
    score: 58,
    data: [
      { age: 35, projected: 287 },
      { age: 40, projected: 370 },
      { age: 45, projected: 470 },
      { age: 50, projected: 610 },
      { age: 55, projected: 790 },
      { age: 60, projected: 950 },
      { age: 65, projected: 1120 },
    ],
  },
  "Market +10%": {
    projected: "$1,780,000",
    monthlyIncome: "$6,040",
    color: "#10b981",
    description: "Optimistic scenario with market growth",
    score: 92,
    data: [
      { age: 35, projected: 287 },
      { age: 40, projected: 480 },
      { age: 45, projected: 710 },
      { age: 50, projected: 990 },
      { age: 55, projected: 1300 },
      { age: 60, projected: 1540 },
      { age: 65, projected: 1780 },
    ],
  },
  "+2% Contribution": {
    projected: "$1,610,000",
    monthlyIncome: "$5,460",
    color: "#8b5cf6",
    description: "Increase contribution from 8% to 10%",
    score: 84,
    data: [
      { age: 35, projected: 287 },
      { age: 40, projected: 460 },
      { age: 45, projected: 660 },
      { age: 50, projected: 900 },
      { age: 55, projected: 1180 },
      { age: 60, projected: 1400 },
      { age: 65, projected: 1610 },
    ],
  },
};

const tabs = Object.keys(scenarios);

function ReadinessRing({ score, color }: { score: number; color: string }) {
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="40" fill="none" stroke="#f3f4f6" strokeWidth="7" />
        <circle
          cx="48"
          cy="48"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 48 48)"
          style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.3s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl text-gray-900" style={{ fontWeight: 700 }}>{score}</span>
        <span className="text-[10px] text-gray-400">/ 100</span>
      </div>
    </div>
  );
}

function RetirementPlanning() {
  const [active, setActive] = useState("Base");
  const scenario = scenarios[active];
  const meetsGoal = parseInt(scenario.projected.replace(/\D/g, "")) >= goalValue * 1000;

  const getScoreLabel = (s: number) => {
    if (s >= 80) return { text: "On Track", bg: "bg-emerald-50", color: "text-emerald-700" };
    if (s >= 60) return { text: "Needs Attention", bg: "bg-amber-50", color: "text-amber-700" };
    return { text: "Off Track", bg: "bg-red-50", color: "text-red-700" };
  };

  const scoreLabel = getScoreLabel(scenario.score);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4 text-blue-500" />
          <h3 className="text-gray-900 dark:text-white">Retirement Planning</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">What your portfolio means for retirement at age 65</p>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Readiness Score */}
          <div className="flex items-center gap-4 bg-gray-50/80 dark:bg-gray-800 rounded-xl p-4">
            <ReadinessRing score={scenario.score} color={scenario.color} />
            <div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5" style={{ fontWeight: 500 }}>Readiness Score</p>
              <span className={`inline-flex items-center gap-1 ${scoreLabel.bg} ${scoreLabel.color} px-2 py-0.5 rounded-full text-[11px]`} style={{ fontWeight: 500 }}>
                <TrendingUp className="w-3 h-3" />
                {scoreLabel.text}
              </span>
            </div>
          </div>

          {/* Projected Savings */}
          <div className="bg-gray-50/80 dark:bg-gray-800 rounded-xl p-4">
            <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1" style={{ fontWeight: 500 }}>Projected at 65</p>
            <p className="text-2xl text-gray-900 dark:text-white tracking-tight" style={{ fontWeight: 600 }}>{scenario.projected}</p>
            <span
              className={`inline-flex text-[11px] mt-1 px-2 py-0.5 rounded-full ${
                meetsGoal ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}
              style={{ fontWeight: 500 }}
            >
              {meetsGoal ? "Meets Goal" : "Below $1.3M Goal"}
            </span>
          </div>

          {/* Monthly Income */}
          <div className="bg-gray-50/80 dark:bg-gray-800 rounded-xl p-4">
            <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1" style={{ fontWeight: 500 }}>Est. Monthly Income</p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl text-gray-900 dark:text-white tracking-tight" style={{ fontWeight: 600 }}>{scenario.monthlyIncome}</p>
              <span className="text-xs text-gray-400 dark:text-gray-500">/mo</span>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Based on 4% withdrawal rate</p>
          </div>
        </div>

        {/* Scenario Toggle */}
        <div className="flex gap-1.5 mb-5 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                active === tab
                  ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-sm"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Projection Chart */}
        <div style={{ width: "100%", height: 220, minHeight: 220, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={scenario.data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id={`retireGrad-${active}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={scenario.color} stopOpacity={0.12} />
                  <stop offset="100%" stopColor={scenario.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="age"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}`}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}k`}
              />
              <ReferenceLine
                y={goalValue}
                stroke="#d1d5db"
                strokeDasharray="6 4"
                label={{
                  value: "Goal: $1.3M",
                  position: "insideTopRight",
                  fill: "#9ca3af",
                  fontSize: 10,
                }}
              />
              <Area
                key="area-projected"
                type="monotone"
                dataKey="projected"
                stroke={scenario.color}
                strokeWidth={2.5}
                fill={`url(#retireGrad-${active})`}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, fill: "#fff" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: scenario.color }} />
            <span className="text-[11px] text-gray-500 dark:text-gray-400">Projected Savings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 border-t border-dashed border-gray-300 dark:border-gray-600" />
            <span className="text-[11px] text-gray-500 dark:text-gray-400">Retirement Goal</span>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 ml-auto hidden sm:block">{scenario.description}</p>
        </div>
      </div>
    </div>
  );
}
export default RetirementPlanning

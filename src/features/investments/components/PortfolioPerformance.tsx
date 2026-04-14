import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const timeRanges: Record<string, { data: { date: string; portfolio: number; sp500: number }[] }> = {
  "1M": {
    data: [
      { date: "Feb 16", portfolio: 278.2, sp500: 276.8 },
      { date: "Feb 23", portfolio: 280.1, sp500: 278.3 },
      { date: "Mar 2", portfolio: 282.5, sp500: 279.9 },
      { date: "Mar 9", portfolio: 285.1, sp500: 282.4 },
      { date: "Mar 16", portfolio: 287.5, sp500: 284.1 },
    ],
  },
  "3M": {
    data: [
      { date: "Dec", portfolio: 265.3, sp500: 264.1 },
      { date: "Jan", portfolio: 272.8, sp500: 271.2 },
      { date: "Feb", portfolio: 278.2, sp500: 276.8 },
      { date: "Mar", portfolio: 287.5, sp500: 284.1 },
    ],
  },
  YTD: {
    data: [
      { date: "Jan", portfolio: 256.0, sp500: 255.2 },
      { date: "Feb", portfolio: 265.3, sp500: 264.1 },
      { date: "Mar", portfolio: 287.5, sp500: 284.1 },
    ],
  },
  "1Y": {
    data: [
      { date: "Mar '25", portfolio: 224.0, sp500: 226.3 },
      { date: "May", portfolio: 232.5, sp500: 233.8 },
      { date: "Jul", portfolio: 241.2, sp500: 240.5 },
      { date: "Sep", portfolio: 248.9, sp500: 247.2 },
      { date: "Nov", portfolio: 256.0, sp500: 253.8 },
      { date: "Jan '26", portfolio: 272.8, sp500: 271.2 },
      { date: "Mar", portfolio: 287.5, sp500: 284.1 },
    ],
  },
  "5Y": {
    data: [
      { date: "2021", portfolio: 118.0, sp500: 122.0 },
      { date: "2022", portfolio: 142.5, sp500: 138.0 },
      { date: "2023", portfolio: 178.0, sp500: 172.0 },
      { date: "2024", portfolio: 224.0, sp500: 226.3 },
      { date: "2025", portfolio: 256.0, sp500: 253.8 },
      { date: "2026", portfolio: 287.5, sp500: 284.1 },
    ],
  },
};

const tabs = Object.keys(timeRanges);

function PortfolioPerformance() {
  const [activeRange, setActiveRange] = useState("1Y");
  const currentData = timeRanges[activeRange].data;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h3 className="text-gray-900 dark:text-white">Portfolio Performance</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Growth over time vs S&P 500 benchmark</p>
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg self-start">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveRange(tab)}
              className={`px-3 py-1.5 rounded-md text-xs transition-all ${
                activeRange === tab
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
              style={{ fontWeight: activeRange === tab ? 500 : 400 }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", height: 260, minHeight: 260, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={currentData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--c-muted, #f3f4f6)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}k`}
              domain={["dataMin - 10", "dataMax + 5"]}
            />
            <Line
              key="line-portfolio"
              type="monotone"
              dataKey="portfolio"
              name="Your Portfolio"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, fill: "#fff", stroke: "#3b82f6" }}
            />
            <Line
              key="line-sp500"
              type="monotone"
              dataKey="sp500"
              name="S&P 500"
              stroke="#d1d5db"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#d1d5db" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend */}
      <div className="flex items-center gap-5 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-blue-500 rounded-full" />
          <span className="text-[11px] text-gray-600 dark:text-gray-400">Your Portfolio</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
          <span className="text-[11px] text-gray-500 dark:text-gray-400">S&amp;P 500</span>
        </div>
      </div>
    </div>
  );
}
export default PortfolioPerformance

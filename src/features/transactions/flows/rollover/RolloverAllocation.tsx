import { Card } from "../../components/ui/card";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useRolloverFlow } from "./RolloverFlowLayout";
import { motion } from "framer-motion";
import {
  Info,
  ChartBar,
  TrendingUp,
  Shield,
  Globe,
  Landmark } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip } from "recharts";

interface FundOption {
  id: string;
  name: string;
  category: string;
  risk: "Low" | "Moderate" | "High";
  ytdReturn: string;
  icon: React.ReactNode;
  color: string;
  percentage: number;
}

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899"];

function RolloverAllocation() {
  const navigate = useNavigate();
  const { rolloverData, updateRolloverData } = useRolloverFlow();

  const estimatedAmount = rolloverData.estimatedAmount || 15000;

  const [funds, setFunds] = useState<FundOption[]>([
    {
      id: "large_cap",
      name: "Large Cap Equity Fund",
      category: "US Equity",
      risk: "Moderate",
      ytdReturn: "+12.4%",
      icon: <TrendingUp className="w-4 h-4" />,
      color: COLORS[0],
      percentage: 40 },
    {
      id: "intl",
      name: "International Growth Fund",
      category: "International",
      risk: "High",
      ytdReturn: "+8.7%",
      icon: <Globe className="w-4 h-4" />,
      color: COLORS[1],
      percentage: 25 },
    {
      id: "bond",
      name: "Stable Value Bond Fund",
      category: "Fixed Income",
      risk: "Low",
      ytdReturn: "+3.2%",
      icon: <Shield className="w-4 h-4" />,
      color: COLORS[2],
      percentage: 20 },
    {
      id: "target",
      name: "Target Date 2050 Fund",
      category: "Balanced",
      risk: "Moderate",
      ytdReturn: "+9.1%",
      icon: <Landmark className="w-4 h-4" />,
      color: COLORS[3],
      percentage: 15 },
  ]);

  const totalPercentage = funds.reduce((sum, f) => sum + f.percentage, 0);
  const isValid = totalPercentage === 100;

  const handleSliderChange = (id: string, newValue: number) => {
    setFunds((prev) =>
      prev.map((f) => (f.id === id ? { ...f, percentage: newValue } : f))
    );
  };

  const chartData = funds
    .filter((f) => f.percentage > 0)
    .map((f) => ({
      name: f.name,
      value: f.percentage }));

  const handleContinue = () => {
    updateRolloverData({
      allocation: funds.map((f) => ({
        fundName: f.name,
        percentage: f.percentage })) });
    navigate("/transactions/rollover/documents");
  };

  const riskColors = {
    Low: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50",
    Moderate: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/50",
    High: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50" };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "inherit", letterSpacing: "-0.5px", lineHeight: "34px", marginBottom: 8 }}>
          Investment Allocation
        </h2>
        <p style={{ fontSize: 14, fontWeight: 500, color: "inherit", lineHeight: "22px" }}>
          Choose how to allocate your $
          {estimatedAmount.toLocaleString()} rollover across available
          investment funds.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Allocation Controls - 2 cols */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="lg:col-span-2"
        >
          <Card
            className="p-6 rounded-2xl border-gray-100 dark:border-gray-700/80"
            style={{
              boxShadow:
                "0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.05)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Investment Funds
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Adjust percentages to total 100%
                </p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  isValid
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                    : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                }`}
              >
                {totalPercentage}% / 100%
              </div>
            </div>

            <div className="space-y-5">
              {funds.map((fund, idx) => (
                <motion.div
                  key={fund.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.3 }}
                  className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-50/60 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: fund.color + "15",
                          color: fund.color }}
                      >
                        {fund.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {fund.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">
                            {fund.category}
                          </span>
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${riskColors[fund.risk]}`}
                          >
                            {fund.risk}
                          </span>
                          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                            {fund.ytdReturn} YTD
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {fund.percentage}%
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        $
                        {Math.round(
                          (fund.percentage / 100) * estimatedAmount
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Slider */}
                  <div className="relative">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={fund.percentage}
                      onChange={(e) =>
                        handleSliderChange(fund.id, parseInt(e.target.value))
                      }
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${fund.color} 0%, ${fund.color} ${fund.percentage}%, var(--c-border-color) ${fund.percentage}%, var(--c-border-color) 100%)` }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Chart - 1 col */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card
            className="p-6 rounded-2xl border-gray-100 dark:border-gray-700/80 sticky top-24"
            style={{
              boxShadow:
                "0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.05)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <ChartBar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Preview</h3>
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [String(v), ""] as [string, string]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid var(--c-border-color)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="space-y-2 mt-2">
              {funds
                .filter((f) => f.percentage > 0)
                .map((fund) => (
                  <div
                    key={fund.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: fund.color }}
                      />
                      <span className="text-[11px] text-gray-600 dark:text-gray-300 truncate max-w-[140px]">
                        {fund.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-900 dark:text-white">
                      {fund.percentage}%
                    </span>
                  </div>
                ))}
            </div>

            {/* Total */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Total Amount</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  ${estimatedAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Allocation Tip */}
      {!isValid && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-100/60 dark:border-amber-800/60"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Your allocation totals {totalPercentage}%. Adjust to exactly 100%
              to continue.
            </p>
          </div>
        </motion.div>
      )}

      <div className="flex justify-between items-center" style={{ paddingTop: 16 }}>
        <button
          onClick={() => navigate("/transactions/rollover/validation")}
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer"
          style={{ background: "transparent", border: "var(--c-border)", color: "inherit", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!isValid}
          className="btn-brand flex items-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Documents
        </button>
      </div>
    </div>
  );
}

export default RolloverAllocation

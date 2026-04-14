import { useNavigate } from "react-router-dom";
import { useRebalanceFlow } from "./RebalanceFlowLayout";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip } from "recharts";
import { ArrowRight, ArrowLeft, Info } from "lucide-react";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899"];

const defaultFunds = [
  {
    name: "Large Cap Equity Fund",
    ticker: "LCEF",
    currentAllocation: 40,
    targetAllocation: 40,
    currentValue: 12000 },
  {
    name: "International Growth Fund",
    ticker: "IGRF",
    currentAllocation: 25,
    targetAllocation: 25,
    currentValue: 7500 },
  {
    name: "Stable Value Bond Fund",
    ticker: "SVBF",
    currentAllocation: 20,
    targetAllocation: 20,
    currentValue: 6000 },
  {
    name: "Target Date 2050 Fund",
    ticker: "TD50",
    currentAllocation: 15,
    targetAllocation: 15,
    currentValue: 4500 },
];

function RebalanceCurrentAllocation() {
  const navigate = useNavigate();
  const { updateRebalanceData } = useRebalanceFlow();

  const totalBalance = defaultFunds.reduce((s, f) => s + f.currentValue, 0);

  const chartData = defaultFunds.map((f) => ({
    name: f.name,
    value: f.currentAllocation }));

  const handleContinue = () => {
    updateRebalanceData({ funds: defaultFunds });
    navigate("/transactions/rebalance/adjust");
  };

  // Determine portfolio drift
  const maxDrift = 3.2;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "inherit", letterSpacing: "-0.5px", lineHeight: "34px", marginBottom: 8 }}>
          Current Portfolio Allocation
        </h2>
        <p style={{ fontSize: 14, fontWeight: 500, color: "inherit", lineHeight: "22px" }}>
          Review your current investment allocation before making adjustments.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
          className="lg:col-span-1"
        >
          <div style={{ background: "transparent", borderRadius: 16, border: "1px solid var(--tx-border-light, #F1F5F9)", padding: "24px 28px" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "inherit", letterSpacing: "-0.3px", marginBottom: 16 }}>
              Portfolio Distribution
            </h3>
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
                  {chartData.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={COLORS[idx % COLORS.length]}
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

            <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--tx-border-light, #F1F5F9)" }}>
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 12, fontWeight: 500, color: "inherit" }}>Total Balance</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "inherit" }}>
                  ${totalBalance.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 12, fontWeight: 500, color: "inherit" }}>Risk Level</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "inherit" }}>
                  Moderate
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Fund List */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="lg:col-span-2"
        >
          <div style={{ background: "transparent", borderRadius: 16, border: "1px solid var(--tx-border-light, #F1F5F9)", padding: "24px 28px" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "inherit", letterSpacing: "-0.3px", marginBottom: 20 }}>
              Fund Breakdown
            </h3>

            <div className="space-y-4">
              {defaultFunds.map((fund, idx) => (
                <motion.div
                  key={fund.ticker}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.12 + idx * 0.06, duration: 0.3 }}
                  className="transition-all duration-200"
                  style={{ padding: "14px 16px", borderRadius: 12, border: "1px solid var(--tx-border-light, #F1F5F9)", background: "transparent" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full" style={{ width: 12, height: 12, backgroundColor: COLORS[idx] }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "inherit" }}>{fund.name}</p>
                        <span className="font-mono" style={{ fontSize: 10, color: "inherit", fontWeight: 500 }}>{fund.ticker}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p style={{ fontSize: 20, fontWeight: 800, color: "inherit", letterSpacing: "-0.3px" }}>{fund.currentAllocation}%</p>
                      <p style={{ fontSize: 10, color: "inherit", fontWeight: 500 }}>${fund.currentValue.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="overflow-hidden" style={{ height: 6, borderRadius: 3, background: "var(--tx-track, #E2E8F0)" }}>
                    <div className="h-full transition-all" style={{ width: `${fund.currentAllocation}%`, backgroundColor: COLORS[idx], borderRadius: 3 }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Drift Alert */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      >
        <div
          className="flex items-start gap-3.5"
          style={{ background: "rgba(245,158,11,0.1)", border: "1px solid var(--c-border-amber)", borderRadius: 14, padding: "16px 20px" }}
        >
          <div className="flex items-center justify-center flex-shrink-0" style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>
            <Info className="w-[14px] h-[14px]" />
          </div>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: "inherit", letterSpacing: "-0.3px", marginBottom: 4 }}>
              Portfolio Drift Detected
            </h4>
            <p style={{ fontSize: 12, fontWeight: 500, color: "inherit", lineHeight: "18px" }}>
              Your portfolio has drifted up to {maxDrift}% from your target
              allocation due to market movements. Rebalancing will realign
              your investments with your goals.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="flex justify-between items-center" style={{ paddingTop: 16 }}>
        <button
          onClick={() => navigate("/transactions")}
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer"
          style={{ background: "transparent", border: "var(--c-border)", color: "inherit", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Cancel
        </button>
        <button
          onClick={handleContinue}
          className="btn-brand flex items-center gap-2 transition-all duration-200 cursor-pointer"
        >
          Adjust Target Allocation
          <ArrowRight style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  );
}

export default RebalanceCurrentAllocation

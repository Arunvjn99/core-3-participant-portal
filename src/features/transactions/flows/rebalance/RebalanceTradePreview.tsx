import { Card } from "../../components/ui/card";
import { useNavigate } from "react-router-dom";
import { useRebalanceFlow } from "./RebalanceFlowLayout";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Clock } from "lucide-react";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"];

function RebalanceTradePreview() {
  const navigate = useNavigate();
  const { rebalanceData } = useRebalanceFlow();

  const funds = rebalanceData.funds || [];
  const totalValue = funds.reduce((s, f) => s + f.currentValue, 0);

  const trades = funds
    .map((fund, idx) => {
      const change = fund.targetAllocation - fund.currentAllocation;
      const tradeAmount = Math.round((Math.abs(change) / 100) * totalValue);
      return {
        ...fund,
        change,
        tradeAmount,
        action:
          change > 0
            ? ("Buy" as const)
            : change < 0
              ? ("Sell" as const)
              : ("Hold" as const),
        color: COLORS[idx] };
    })
    .filter((t) => t.change !== 0);

  const totalBuy = trades
    .filter((t) => t.action === "Buy")
    .reduce((s, t) => s + t.tradeAmount, 0);
  const totalSell = trades
    .filter((t) => t.action === "Sell")
    .reduce((s, t) => s + t.tradeAmount, 0);

  // Risk analysis
  const equityAlloc =
    (funds[0]?.targetAllocation || 0) + (funds[1]?.targetAllocation || 0);
  const currentEquity =
    (funds[0]?.currentAllocation || 0) + (funds[1]?.currentAllocation || 0);
  const riskChange =
    equityAlloc > currentEquity
      ? "slightly higher"
      : equityAlloc < currentEquity
        ? "slightly lower"
        : "unchanged";

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "inherit", letterSpacing: "-0.5px", lineHeight: "34px", marginBottom: 8 }}>
          Trade Preview
        </h2>
        <p style={{ fontSize: 14, fontWeight: 500, color: "inherit", lineHeight: "22px" }}>
          Review the buy and sell trades that will be executed to achieve your
          target allocation.
        </p>
      </motion.div>

      {/* Trade Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card
            className="p-5 rounded-2xl border-emerald-100/60 dark:border-emerald-800/40 bg-gradient-to-br from-emerald-50/50 dark:from-emerald-950/30 to-teal-50/30 dark:to-teal-950/20"
            style={{ boxShadow: "0 1px 3px rgba(16,185,129,0.06)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                Total Buys
              </span>
            </div>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              ${totalBuy.toLocaleString()}
            </p>
            <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-1">
              {trades.filter((t) => t.action === "Buy").length} fund
              {trades.filter((t) => t.action === "Buy").length !== 1
                ? "s"
                : ""}
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card
            className="p-5 rounded-2xl border-rose-100/60 dark:border-rose-800/40 bg-gradient-to-br from-rose-50/50 dark:from-rose-950/30 to-pink-50/30 dark:to-pink-950/20"
            style={{ boxShadow: "0 1px 3px rgba(244,63,94,0.06)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                Total Sells
              </span>
            </div>
            <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">
              ${totalSell.toLocaleString()}
            </p>
            <p className="text-[10px] text-rose-600/70 dark:text-rose-400/70 mt-1">
              {trades.filter((t) => t.action === "Sell").length} fund
              {trades.filter((t) => t.action === "Sell").length !== 1
                ? "s"
                : ""}
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Card
            className="p-5 rounded-2xl border-blue-100/60 dark:border-blue-800/40 bg-gradient-to-br from-blue-50/50 dark:from-blue-950/30 to-indigo-50/30 dark:to-indigo-950/20"
            style={{ boxShadow: "0 1px 3px rgba(59,130,246,0.06)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                Risk Impact
              </span>
            </div>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300 capitalize">
              {riskChange}
            </p>
            <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 mt-1">
              Equity: {currentEquity}% → {equityAlloc}%
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Trade Details */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card
          className="p-6 rounded-2xl border-gray-100 dark:border-gray-700/80"
          style={{
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.05)" }}
        >
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-5">
            Trade Details
          </h3>

          <div className="space-y-3">
            {trades.map((trade, idx) => (
              <motion.div
                key={trade.ticker}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.22 + idx * 0.06, duration: 0.3 }}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  trade.action === "Buy"
                    ? "bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-100/60 dark:border-emerald-800/40"
                    : "bg-rose-50/30 dark:bg-rose-950/20 border-rose-100/60 dark:border-rose-800/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      trade.action === "Buy"
                        ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {trade.action === "Buy" ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          trade.action === "Buy"
                            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                            : "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300"
                        }`}
                      >
                        {trade.action}
                      </span>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {trade.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                        {trade.ticker}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {trade.currentAllocation}% → {trade.targetAllocation}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${
                      trade.action === "Buy"
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-rose-700 dark:text-rose-300"
                    }`}
                  >
                    {trade.action === "Buy" ? "+" : "-"}$
                    {trade.tradeAmount.toLocaleString()}
                  </p>
                  <p
                    className={`text-[10px] font-medium ${
                      trade.change > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {trade.change > 0 ? "+" : ""}
                    {trade.change}%
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Processing Info */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60">
          <div className="flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium mb-1">
                Trade Execution
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                Trades will be executed at the next market close. No fees apply
                to portfolio rebalancing within your 401(k) plan. Your updated
                allocation will be reflected within 1-2 business days.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex justify-between items-center" style={{ paddingTop: 16 }}>
        <button
          onClick={() => navigate("/transactions/rebalance/adjust")}
          className="flex min-h-[2.75rem] items-center gap-2 transition-all duration-200 cursor-pointer"
          style={{ background: "transparent", border: "var(--c-border)", color: "inherit", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}
        >
          Back
        </button>
        <button
          onClick={() => navigate("/transactions/rebalance/review")}
          className="btn-brand flex items-center gap-2 transition-all duration-200 cursor-pointer"
        >
          Continue to Review
          <ArrowRight style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  );
}

export default RebalanceTradePreview

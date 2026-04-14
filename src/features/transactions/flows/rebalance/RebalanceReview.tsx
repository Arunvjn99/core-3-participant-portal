import { Card } from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useRebalanceFlow } from "./RebalanceFlowLayout";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ArrowRight,
  PieChart,
  Clock } from "lucide-react";
import RetirementImpactWidget from "../../components/RetirementImpactWidget";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"];

function RebalanceReview() {
  const navigate = useNavigate();
  const { rebalanceData } = useRebalanceFlow();
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const funds = rebalanceData.funds || [];
  const totalValue = funds.reduce((s, f) => s + f.currentValue, 0);

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => navigate("/transactions"), 2500);
    }, 1800);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center py-20"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center mb-6"
          style={{ boxShadow: "0 8px 32px rgba(20,184,166,0.3)" }}
        >
          <CheckCircle2 className="w-10 h-10 text-white" />
        </motion.div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "inherit", letterSpacing: "-0.5px", lineHeight: "34px", marginBottom: 8 }}>
          Rebalance Submitted
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-center max-w-md mb-3">
          Your portfolio rebalancing will be processed at the next market close.
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 mb-8">
          <Clock className="w-4 h-4" />
          <span>Expected completion: Next trading day</span>
        </div>

        <div className="w-full max-w-sm space-y-2">
          {["Submitted", "Trade Execution", "Portfolio Updated"].map(
            (step, idx) => (
              <div key={step} className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    idx === 0
                      ? "bg-gradient-to-br from-teal-500 to-emerald-600 text-white"
                      : "bg-gray-100 text-gray-300 border border-gray-200"
                  }`}
                  style={
                    idx === 0
                      ? { boxShadow: "0 0 0 3px rgba(20,184,166,0.15)" }
                      : undefined
                  }
                >
                  {idx === 0 ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <span className="text-[10px] font-medium">{idx + 1}</span>
                  )}
                </div>
                <span
                  className={`text-sm ${idx === 0 ? "text-gray-900 dark:text-white font-medium" : "text-gray-400"}`}
                >
                  {step}
                </span>
              </div>
            )
          )}
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-8">
          Redirecting to dashboard...
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "inherit", letterSpacing: "-0.5px", lineHeight: "34px", marginBottom: 8 }}>
          Review and Submit
        </h2>
        <p style={{ fontSize: 14, fontWeight: 500, color: "inherit", lineHeight: "22px" }}>
          Review your portfolio changes before submitting.
        </p>
      </motion.div>

      {/* Allocation Changes */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <Card
          className="p-6 rounded-2xl border-gray-100 dark:border-gray-700/80"
          style={{
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-center gap-2 mb-5">
            <PieChart className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Allocation Changes</h3>
          </div>

          <div className="space-y-4">
            {funds.map((fund, idx) => {
              const change = fund.targetAllocation - fund.currentAllocation;
              const tradeAmount = Math.round(
                (Math.abs(change) / 100) * totalValue
              );
              return (
                <div
                  key={fund.ticker}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[idx] }}
                    />
                    <div>
                      <span className="text-sm text-gray-900 dark:text-white">{fund.name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                          {fund.currentAllocation}%
                        </span>
                        <ArrowRight className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                        <span
                          className={`text-[10px] font-semibold ${change !== 0 ? "text-blue-600" : "text-gray-500 dark:text-gray-400"}`}
                        >
                          {fund.targetAllocation}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {change !== 0 ? (
                      <span
                        className={`text-xs font-semibold ${change > 0 ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        {change > 0 ? "+" : "-"}${tradeAmount.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">No change</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Visual bar */}
          <div className="flex rounded-full overflow-hidden h-2 mt-5">
            {funds.map((fund, idx) => (
              <div
                key={fund.ticker}
                style={{
                  width: `${fund.targetAllocation}%`,
                  backgroundColor: COLORS[idx] }}
              />
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Retirement Impact - Rebalancing optimizes growth */}
      <RetirementImpactWidget
        compact
        delay={0.12}
      />

      {/* Agreement */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Card
          className="p-6 rounded-2xl border-gray-100 dark:border-gray-700/80"
          style={{
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
            />
            <label
              htmlFor="terms"
              className="text-sm text-gray-700 dark:text-gray-200 cursor-pointer leading-relaxed"
            >
              I understand that this rebalancing will change my investment
              allocation and that past performance does not guarantee future
              results. I have reviewed the risk level and expected returns
              associated with my new allocation.
            </label>
          </div>
        </Card>
      </motion.div>

      <div className="flex justify-between items-center" style={{ paddingTop: 16 }}>
        <button
          onClick={() => navigate("/transactions/rebalance/trades")}
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer"
          style={{ background: "transparent", border: "var(--c-border)", color: "inherit", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!agreed || isSubmitting}
          className="btn-brand flex items-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Submitting..." : "Submit Rebalance"}
        </button>
      </div>
    </div>
  );
}

export default RebalanceReview

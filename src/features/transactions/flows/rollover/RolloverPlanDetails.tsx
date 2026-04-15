import { Card } from "../../components/ui/card";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useRolloverFlow } from "./RolloverFlowLayout";
import { motion } from "framer-motion";
import {
  Building2,
  ShieldCheck,
  Hash,
  DollarSign,
  Info,
  ArrowRight,
  CheckCircle2 } from "lucide-react";

function RolloverPlanDetails() {
  const navigate = useNavigate();
  const { updateRolloverData } = useRolloverFlow();

  const [previousEmployer, setPreviousEmployer] = useState("");
  const [planAdministrator, setPlanAdministrator] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [estimatedAmount, setEstimatedAmount] = useState("");
  const [rolloverType, setRolloverType] = useState<string>("");

  const rolloverTypes = [
    {
      id: "traditional",
      label: "Traditional 401(k)",
      description: "Pre-tax contributions from a previous employer plan",
      icon: <Building2 className="w-5 h-5" /> },
    {
      id: "roth",
      label: "Roth 401(k)",
      description: "After-tax contributions with tax-free growth",
      icon: <ShieldCheck className="w-5 h-5" /> },
    {
      id: "ira",
      label: "Traditional IRA",
      description: "Individual retirement account rollover",
      icon: <DollarSign className="w-5 h-5" /> },
  ];

  const isValid =
    previousEmployer.trim() !== "" &&
    planAdministrator.trim() !== "" &&
    accountNumber.trim() !== "" &&
    estimatedAmount.trim() !== "" &&
    rolloverType !== "";

  const handleContinue = () => {
    updateRolloverData({
      previousEmployer,
      planAdministrator,
      accountNumber,
      estimatedAmount: parseFloat(estimatedAmount.replace(/,/g, "")) || 0,
      rolloverType });
    navigate("/transactions/rollover/validation");
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "inherit", letterSpacing: "-0.5px", lineHeight: "34px", marginBottom: 8 }}>
          Previous Plan Details
        </h2>
        <p style={{ fontSize: 14, fontWeight: 500, color: "inherit", lineHeight: "22px" }}>
          Enter details about the retirement plan you'd like to roll over into
          your current 401(k).
        </p>
      </motion.div>

      {/* Rollover Type Selection */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
      >
        <div style={{ background: "transparent", borderRadius: 16, border: "1px solid var(--tx-border-light, var(--c-border-color))", padding: "24px 28px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "inherit", letterSpacing: "-0.3px", marginBottom: 4 }}>Rollover Type</h3>
          <p style={{ fontSize: 13, fontWeight: 500, color: "inherit", marginBottom: 20 }}>
            Select the type of account you're rolling over
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {rolloverTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setRolloverType(type.id)}
                className="relative text-left transition-all duration-200 cursor-pointer"
                style={{
                  padding: "16px 20px", borderRadius: 14,
                  border: rolloverType === type.id ? "1.5px solid #2563EB" : "1.5px solid var(--c-border-color)",
                  background: rolloverType === type.id ? "var(--c-blue-tint)" : "var(--c-card)" }}
              >
                {rolloverType === type.id && (
                  <CheckCircle2 className="absolute top-3 right-3" style={{ width: 16, height: 16, color: "var(--brand-primary)" }} />
                )}
                <div
                  className={`p-2 rounded-lg inline-flex mb-3 ${
                    rolloverType === type.id
                      ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                  }`}
                >
                  {type.icon}
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                  {type.label}
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  {type.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Plan Information */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card
          className="p-6 rounded-2xl border-gray-100 dark:border-gray-700/80"
          style={{
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.05)" }}
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Plan Information
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Provide details about your previous employer's retirement plan
          </p>

          <div className="space-y-5">
            {/* Previous Employer */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                <Building2 className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                Previous Employer Name
              </label>
              <input
                type="text"
                value={previousEmployer}
                onChange={(e) => setPreviousEmployer(e.target.value)}
                placeholder="e.g., Acme Corporation"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>

            {/* Plan Administrator */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                <ShieldCheck className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                Plan Administrator
              </label>
              <input
                type="text"
                value={planAdministrator}
                onChange={(e) => setPlanAdministrator(e.target.value)}
                placeholder="e.g., Fidelity Investments"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>

            {/* Account Number */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                <Hash className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                Account Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g., 1234-5678-90"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-mono"
              />
            </div>

            {/* Estimated Amount */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                <DollarSign className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                Estimated Rollover Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-medium">
                  $
                </span>
                <input
                  type="text"
                  value={estimatedAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.,]/g, "");
                    setEstimatedAmount(val);
                  }}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <div
          className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 dark:from-blue-950/30 to-indigo-50/50 dark:to-indigo-950/20 border border-blue-100/60 dark:border-blue-800/60"
          style={{
            boxShadow: "0 1px 3px rgba(59,130,246,0.04)" }}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100/70 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex-shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                What you'll need
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>
                    Your most recent statement from the previous plan
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>
                    Contact information for the previous plan administrator
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>
                    A check or transfer form from the previous plan (if
                    applicable)
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex justify-between items-center" style={{ paddingTop: 16 }}>
        <button
          onClick={() => navigate("/transactions")}
          className="flex min-h-[2.75rem] items-center gap-2 transition-all duration-200 cursor-pointer"
          style={{ background: "transparent", border: "var(--c-border)", color: "inherit", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}
        >
          Cancel
        </button>
        <button
          onClick={handleContinue}
          disabled={!isValid}
          className="btn-brand flex items-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <ArrowRight style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  );
}

export default RolloverPlanDetails

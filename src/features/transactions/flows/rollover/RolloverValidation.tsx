import { Card } from "../../components/ui/card";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useRolloverFlow } from "./RolloverFlowLayout";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Shield,
  Building2,
  Hash,
  DollarSign,
  AlertTriangle } from "lucide-react";

type ValidationStatus = "pending" | "checking" | "passed" | "failed";

interface ValidationCheck {
  id: string;
  label: string;
  description: string;
  status: ValidationStatus;
  icon: React.ReactNode;
}

function RolloverValidation() {
  const navigate = useNavigate();
  const { rolloverData, updateRolloverData } = useRolloverFlow();
  const [checks, setChecks] = useState<ValidationCheck[]>([
    {
      id: "plan_type",
      label: "Plan Type Compatibility",
      description: "Verifying the source plan type is eligible for rollover",
      status: "pending",
      icon: <Shield className="w-4 h-4" /> },
    {
      id: "account_verify",
      label: "Account Verification",
      description: "Confirming account number and plan administrator",
      status: "pending",
      icon: <Hash className="w-4 h-4" /> },
    {
      id: "employer_verify",
      label: "Employer Verification",
      description: "Validating previous employer's plan registration",
      status: "pending",
      icon: <Building2 className="w-4 h-4" /> },
    {
      id: "amount_check",
      label: "Amount Eligibility",
      description: "Checking rollover amount against plan limits",
      status: "pending",
      icon: <DollarSign className="w-4 h-4" /> },
    {
      id: "tax_status",
      label: "Tax Status Review",
      description: "Reviewing tax implications and withholding requirements",
      status: "pending",
      icon: <AlertTriangle className="w-4 h-4" /> },
  ]);

  const [validationComplete, setValidationComplete] = useState(false);

  useEffect(() => {
    // Simulate sequential validation checks
    const timers: ReturnType<typeof setTimeout>[] = [];

    checks.forEach((_, index) => {
      // Start checking
      timers.push(
        setTimeout(() => {
          setChecks((prev) =>
            prev.map((c, i) =>
              i === index ? { ...c, status: "checking" as ValidationStatus } : c
            )
          );
        }, index * 800)
      );

      // Complete check
      timers.push(
        setTimeout(() => {
          setChecks((prev) =>
            prev.map((c, i) =>
              i === index ? { ...c, status: "passed" as ValidationStatus } : c
            )
          );

          if (index === checks.length - 1) {
            setTimeout(() => {
              setValidationComplete(true);
              updateRolloverData({ isCompatible: true });
            }, 400);
          }
        }, index * 800 + 600)
      );
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  const allPassed = checks.every((c) => c.status === "passed");

  const handleContinue = () => {
    if (validationComplete && allPassed) {
      navigate("/transactions/rollover/allocation");
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "inherit", letterSpacing: "-0.5px", lineHeight: "34px", marginBottom: 8 }}>
          Plan Validation
        </h2>
        <p style={{ fontSize: 14, fontWeight: 500, color: "inherit", lineHeight: "22px" }}>
          We're verifying compatibility between your previous plan and your
          current 401(k).
        </p>
      </motion.div>

      {/* Plan Summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <Card
          className="p-5 rounded-2xl border-gray-100/80"
          style={{
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.05)" }}
        >
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Plan Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">Employer</p>
              <p className="text-sm font-medium text-gray-900">
                {rolloverData.previousEmployer || "Acme Corp"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">Administrator</p>
              <p className="text-sm font-medium text-gray-900">
                {rolloverData.planAdministrator || "Fidelity"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">Account</p>
              <p className="text-sm font-medium text-gray-900 font-mono">
                {rolloverData.accountNumber || "****-5678"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">Est. Amount</p>
              <p className="text-sm font-medium text-gray-900">
                $
                {(rolloverData.estimatedAmount || 15000).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Validation Checks */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card
          className="p-6 rounded-2xl border-gray-100/80"
          style={{
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.05)" }}
        >
          <h3 className="font-semibold text-gray-900 mb-1">
            Compatibility Checks
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Each check must pass before you can proceed
          </p>

          <div className="space-y-3">
            {checks.map((check, idx) => (
              <motion.div
                key={check.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.3 }}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                  check.status === "passed"
                    ? "bg-emerald-50/50 border-emerald-100"
                    : check.status === "checking"
                      ? "bg-blue-50/50 border-blue-100"
                      : check.status === "failed"
                        ? "bg-red-50/50 border-red-100"
                        : "bg-gray-50/30 border-gray-100"
                }`}
              >
                {/* Status Icon */}
                <div
                  className={`p-2 rounded-lg flex-shrink-0 ${
                    check.status === "passed"
                      ? "bg-emerald-100 text-emerald-600"
                      : check.status === "checking"
                        ? "bg-blue-100 text-blue-600"
                        : check.status === "failed"
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {check.icon}
                </div>

                {/* Check Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm">
                    {check.label}
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    {check.description}
                  </p>
                </div>

                {/* Status Indicator */}
                <div className="flex-shrink-0">
                  {check.status === "passed" && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 15 }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </motion.div>
                  )}
                  {check.status === "checking" && (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  )}
                  {check.status === "failed" && (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  {check.status === "pending" && (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Success Message */}
      {validationComplete && allPassed && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div
            className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/60 border border-emerald-100/80"
            style={{
              boxShadow: "0 1px 3px rgba(16,185,129,0.06)" }}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1">
                  All Checks Passed
                </h4>
                <p className="text-xs text-gray-600">
                  Your previous plan is fully compatible. You can proceed to
                  choose how you'd like to allocate the rollover funds.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex justify-between items-center" style={{ paddingTop: 16 }}>
        <button
          onClick={() => navigate("/transactions/rollover")}
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer"
          style={{ background: "transparent", border: "1px solid #E2E8F0", color: "inherit", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!validationComplete}
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "#2563EB", color: "#fff", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, border: "none", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}
        >
          Continue to Allocation
        </button>
      </div>
    </div>
  );
}

export default RolloverValidation

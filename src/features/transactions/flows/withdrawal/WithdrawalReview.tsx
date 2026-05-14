import { Checkbox } from "../../components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useWithdrawalFlow } from "./WithdrawalFlowLayout";
import { CheckCircle2, ArrowLeft, DollarSign, AlertTriangle, Shield, Banknote } from "lucide-react";
import { motion } from "framer-motion";

function WithdrawalReview() {
  const navigate = useNavigate();
  const { withdrawalData } = useWithdrawalFlow();
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const amount = withdrawalData.amount || 3000;
  const federalTax = Math.round(amount * 0.20);
  const stateTax = Math.round(amount * 0.05);
  const earlyPenalty = Math.round(amount * 0.10);
  const fees = 25;
  const finalPayout = amount - federalTax - stateTax - earlyPenalty - fees;

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        navigate("/transactions");
      }, 2000);
    }, 1500);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center justify-center py-16"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-status-success/30 bg-status-success-bg mb-5">
          <CheckCircle2 className="h-8 w-8 text-status-success" />
        </div>
        <h2 className="text-[26px] font-extrabold text-text-primary tracking-tight mb-2">
          Withdrawal Submitted
        </h2>
        <p className="text-[14px] text-text-secondary text-center max-w-md mb-6 leading-relaxed">
          Your withdrawal request has been submitted successfully. You'll receive confirmation shortly.
        </p>
        <p className="text-[12px] text-text-muted">Redirecting to dashboard...</p>
      </motion.div>
    );
  }

  const deductions = [
    { label: "Federal Tax Withholding (20%)", value: federalTax, isDeduction: true },
    { label: "State Tax Withholding (5%)", value: stateTax, isDeduction: true },
    { label: "Early Withdrawal Penalty (10%)", value: earlyPenalty, isDeduction: true },
    { label: "Processing Fee", value: fees, isDeduction: true },
  ];

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h2 className="text-[26px] font-extrabold text-text-primary tracking-tight leading-tight mb-2">
          Review and Submit
        </h2>
        <p className="text-[14px] text-text-secondary leading-relaxed">
          Review your withdrawal details carefully before submitting.
        </p>
      </motion.div>

      {/* Withdrawal Type & Source */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
        className="rounded-[16px] border border-border-default bg-surface-card p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-4 w-4 text-primary" />
          <h3 className="text-[15px] font-bold text-text-primary tracking-tight">Withdrawal Details</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-[10px] border border-border-default bg-surface-elevated p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary mb-1">Withdrawal Type</p>
            <p className="text-[14px] font-bold text-text-primary capitalize">
              {withdrawalData.type?.replace("-", " ") || "Hardship Withdrawal"}
            </p>
          </div>
          <div className="rounded-[10px] border border-border-default bg-surface-elevated p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary mb-1">Payment Method</p>
            <p className="text-[14px] font-bold text-text-primary">
              {withdrawalData.paymentMethod === "eft" ? "Electronic Funds Transfer" : "Mail Check"}
            </p>
          </div>
        </div>
        {withdrawalData.sources && withdrawalData.sources.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border-default">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary mb-3">Source Allocation</p>
            <div className="space-y-2">
              {withdrawalData.sources.map((source, index) => (
                <div key={index} className="flex items-center justify-between rounded-[8px] bg-surface-elevated px-3 py-2">
                  <p className="text-[13px] text-text-primary">{source.name}</p>
                  <p className="text-[13px] font-semibold text-text-primary">${source.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        className="rounded-[16px] border border-border-default bg-surface-card p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Banknote className="h-4 w-4 text-primary" />
          <h3 className="text-[15px] font-bold text-text-primary tracking-tight">Payout Breakdown</h3>
        </div>

        {/* Gross amount */}
        <div className="rounded-[10px] border border-primary/20 bg-primary/5 px-4 py-3 mb-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-text-secondary">Withdrawal Amount</p>
            <p className="text-[18px] font-extrabold text-primary">${amount.toLocaleString()}</p>
          </div>
        </div>

        {/* Deductions */}
        <div className="space-y-2 mb-3">
          {deductions.map((d) => (
            <div key={d.label} className="flex items-center justify-between px-1 py-1">
              <p className="text-[13px] text-text-secondary">{d.label}</p>
              <p className="text-[13px] font-semibold text-status-danger">-${d.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Final payout */}
        <div className="rounded-[10px] border border-status-success/20 bg-status-success-bg px-4 py-3 mt-3">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-bold text-text-primary">Final Payout</p>
            <p className="text-[24px] font-extrabold text-status-success">${finalPayout.toLocaleString()}</p>
          </div>
        </div>
      </motion.div>

      {/* Warning */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
        className="rounded-[16px] border border-status-warning/30 bg-status-warning-bg p-4 flex gap-3"
      >
        <AlertTriangle className="h-5 w-5 shrink-0 text-status-warning mt-0.5" />
        <p className="text-[12px] text-text-secondary leading-relaxed">
          This withdrawal will permanently reduce your retirement savings and cannot be reversed once processed. Additional taxes may apply at year-end.
        </p>
      </motion.div>

      {/* Agreement */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        className="rounded-[16px] border border-border-default bg-surface-card p-5"
      >
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 shrink-0 text-primary mt-0.5" />
          <div className="flex-1">
            <p className="text-[13px] font-bold text-text-primary mb-2">Withdrawal Agreement</p>
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked === true)}
              />
              <label
                htmlFor="terms"
                className="cursor-pointer text-[13px] text-text-secondary leading-relaxed"
              >
                I understand that this withdrawal will permanently reduce my retirement savings,
                may be subject to taxes and penalties, and cannot be reversed once processed.
                I have consulted with a financial advisor or understand the consequences of this withdrawal.
              </label>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex justify-between items-center pt-2">
        <button
          onClick={() => navigate("/transactions/withdrawal/payment")}
          className="flex items-center gap-2 rounded-[10px] border border-border-default bg-transparent px-4 py-2.5 text-[13px] font-semibold text-text-primary transition-colors hover:bg-surface-elevated"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!agreed || isSubmitting}
          className="btn-brand flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Submitting..." : "Submit Withdrawal Request"}
        </button>
      </div>
    </div>
  );
}

export default WithdrawalReview

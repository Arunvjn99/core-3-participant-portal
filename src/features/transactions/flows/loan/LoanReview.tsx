import { Checkbox } from "../../components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useLoanFlow } from "./LoanFlowLayout";
import { CheckCircle2, Clock, ArrowRight, ArrowLeft, DollarSign, Calendar, Percent, CreditCard, Shield } from "lucide-react";
import { motion } from "framer-motion";

function LoanReview() {
  const navigate = useNavigate();
  const { loanData } = useLoanFlow();
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loanAmount = loanData.amount || 5000;
  const tenure = loanData.tenure || 3;
  const interestRate = 8;

  const monthlyRate = interestRate / 100 / 12;
  const numPayments = tenure * 12;
  const monthlyPayment =
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);

  const totalFees = 100;
  const netAmount = loanAmount - totalFees;

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
          Loan Request Submitted
        </h2>
        <p className="text-[14px] font-medium text-text-secondary text-center max-w-md mb-6 leading-relaxed">
          Your loan request has been submitted successfully. You'll receive an email confirmation shortly.
        </p>
        <p className="text-[12px] text-text-muted">Redirecting to dashboard...</p>
      </motion.div>
    );
  }

  const statItems = [
    { icon: DollarSign, label: "Loan Amount", value: `$${loanAmount.toLocaleString()}`, highlight: true },
    { icon: DollarSign, label: "Net Disbursement", value: `$${netAmount.toLocaleString()}`, highlight: false },
    { icon: Calendar, label: "Monthly Payment", value: `$${Math.round(monthlyPayment).toLocaleString()}`, highlight: true },
    { icon: Percent, label: "Interest Rate", value: `${interestRate}%`, highlight: false },
    { icon: Clock, label: "Loan Tenure", value: `${tenure} ${tenure === 1 ? "year" : "years"}`, highlight: false },
    { icon: CreditCard, label: "Total Fees", value: `$${totalFees}`, highlight: false },
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
          Please review all details carefully before submitting your loan request.
        </p>
      </motion.div>

      {/* Loan Summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
        className="rounded-[16px] border border-border-default bg-surface-card p-6"
      >
        <h3 className="text-[15px] font-bold text-text-primary tracking-tight mb-5">
          Loan Summary
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {statItems.map((item) => (
            <div
              key={item.label}
              className={`rounded-[12px] border p-4 ${item.highlight ? 'border-primary/20 bg-primary/5' : 'border-border-default bg-surface-elevated'}`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <item.icon className={`h-3.5 w-3.5 ${item.highlight ? 'text-primary' : 'text-text-muted'}`} />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{item.label}</p>
              </div>
              <p className={`text-[20px] font-extrabold tracking-tight ${item.highlight ? 'text-primary' : 'text-text-primary'}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-5 border-t border-border-default pt-4 flex items-center justify-between">
          <p className="text-[12px] font-semibold text-text-secondary">Repayment Frequency</p>
          <p className="text-[14px] font-bold text-text-primary">Per Paycheck (Bi-weekly)</p>
        </div>
      </motion.div>

      {/* Repayment Schedule Preview */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        className="rounded-[16px] border border-border-default bg-surface-card p-6"
      >
        <h3 className="text-[15px] font-bold text-text-primary tracking-tight mb-4">
          Repayment Schedule
        </h3>
        <div className="space-y-2">
          {[
            { label: "First Payment", sub: "April 2026", value: `$${Math.round(monthlyPayment).toLocaleString()}` },
            { label: "Monthly Payment", sub: `${numPayments} payments total`, value: `$${Math.round(monthlyPayment).toLocaleString()}` },
            { label: "Per Paycheck (Bi-weekly)", sub: "Automatic deduction", value: `$${Math.round(monthlyPayment / 2).toLocaleString()}` },
            { label: "Final Payment", sub: new Date(2026 + tenure, 2, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), value: `$${Math.round(monthlyPayment).toLocaleString()}` },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-[10px] border border-border-default bg-surface-elevated px-4 py-3"
            >
              <div>
                <p className="text-[13px] font-semibold text-text-primary">{item.label}</p>
                <p className="text-[11px] text-text-muted mt-0.5">{item.sub}</p>
              </div>
              <p className="text-[15px] font-bold text-text-primary">{item.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Processing Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
        className="rounded-[16px] border border-primary/20 bg-primary/5 p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-primary" />
          <h4 className="text-[14px] font-bold text-text-primary tracking-tight">Processing Timeline</h4>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { step: "Submitted", time: "Day 1", desc: "Request logged" },
            { step: "Review", time: "Day 1–2", desc: "Documents verified" },
            { step: "Approved", time: "Day 2–3", desc: "Loan approved" },
            { step: "Funds Sent", time: "Day 3–5", desc: "EFT processed" },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary/30 bg-surface-card text-[11px] font-bold text-primary mb-2">
                {idx + 1}
              </div>
              <p className="text-[12px] font-bold text-text-primary">{item.step}</p>
              <p className="text-[10px] font-semibold text-primary">{item.time}</p>
              <p className="text-[10px] text-text-secondary mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
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
            <p className="text-[13px] font-bold text-text-primary mb-2">Loan Agreement</p>
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
                I understand and agree to the loan terms, including the interest rate,
                repayment schedule, and fees. I acknowledge that this loan will be repaid
                through automatic payroll deductions and that failure to make payments may
                result in taxes and penalties.
              </label>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex justify-between items-center pt-2">
        <button
          onClick={() => navigate("/transactions/loan/documents")}
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
          {isSubmitting ? "Submitting..." : "Submit Loan Request"}
          {!isSubmitting && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default LoanReview

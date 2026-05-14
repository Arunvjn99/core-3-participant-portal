import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import {
  ChevronDown,
  Landmark,
  Info,
  ArrowRight,
  ArrowLeft,
  Check,
  DollarSign,
  Calendar,
  BarChart3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLoanFlow } from "./LoanFlowLayout";
import { motion } from "framer-motion";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "../../components/ui/collapsible";

function LoanConfiguration() {
  const navigate = useNavigate();
  const { loanData, updateLoanData } = useLoanFlow();
  const [disbursementMethod, setDisbursementMethod] = useState("eft");
  const [bankAccount, setBankAccount] = useState("chase-1234");

  const [repaymentStartDate, setRepaymentStartDate] = useState("2026-05-30");
  const [repaymentMethod, setRepaymentMethod] = useState("payroll");
  const [periodicPayment, setPeriodicPayment] = useState("100.00");
  const [showAmortization, setShowAmortization] = useState(false);

  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountType, setAccountType] = useState("checking");

  const [bankDetailsOpen, setBankDetailsOpen] = useState(false);

  useEffect(() => {
    if (loanData.monthlyPayment != null) {
      setPeriodicPayment(loanData.monthlyPayment.toFixed(2));
    }
  }, [loanData.monthlyPayment]);

  const handleContinue = () => {
    updateLoanData({
      disbursementMethod,
      bankAccount,
      repaymentMethod,
      repaymentStartDate,
    });
    navigate("/transactions/loan/fees");
  };

  const canContinue = !(disbursementMethod === "eft" && !bankAccount);

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h2
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: "inherit",
            letterSpacing: "-0.5px",
            lineHeight: "34px",
            marginBottom: 8,
          }}
        >
          Loan Configuration
        </h2>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "inherit",
              lineHeight: "22px",
            }}
          >
            Set up disbursement and repayment for your loan request.
          </p>
          <span className="text-[12px] italic dark:text-gray-400" style={{ color: "var(--text-secondary)" }}>
            ⓘ Processing time: ~10 business days
          </span>
        </div>
      </motion.div>

      {/* Loan summary from simulator */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.03 }}
      >
        <div
          className="flex flex-wrap items-stretch gap-0 overflow-hidden rounded-[10px] border"
          style={{ background: "var(--color-primary-light)", padding: "10px 16px", borderColor: "var(--border-blue)" }}
        >
          {(
            [
              { label: "LOAN TYPE", value: loanData.selectedLoanType ?? "—" },
              { label: "PURPOSE", value: loanData.selectedLoanPurpose ?? "—" },
              {
                label: "AMOUNT",
                value:
                  loanData.amount != null ? `$${loanData.amount.toLocaleString()}` : "—",
              },
              {
                label: "TENURE",
                value: loanData.tenure != null ? `${loanData.tenure} Years` : "—",
              },
            ] as const
          ).map((cell, i) => (
            <div
              key={cell.label}
              className="flex min-w-[120px] flex-1 flex-col justify-center py-1 pl-4 pr-2 first:pl-0 dark:border-white/10"
              style={i > 0 ? { borderLeftWidth: 1, borderLeftColor: "var(--border-default)" } : undefined}
            >
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.05em]"
                style={{ color: "var(--text-secondary)" }}
              >
                {cell.label}
              </span>
              <span className="mt-0.5 text-[13px] font-bold dark:text-gray-100" style={{ color: "var(--text-primary)" }}>
                {cell.value}
              </span>
            </div>
          ))}
          <div className="flex flex-shrink-0 items-center justify-end self-center pl-2">
            <button
              type="button"
              onClick={() => navigate("/transactions/loan/simulator")}
              className="text-[12px] font-semibold hover:underline"
              style={{ color: "var(--color-primary)" }}
            >
              ✏ Edit
            </button>
          </div>
        </div>
      </motion.div>

      {/* Merged: Payment method + Repayment */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.06 }}
      >
        <div
          style={{
            background: "transparent",
            borderRadius: 16,
            border: "1px solid var(--tx-border-light, #F1F5F9)",
            padding: "22px 24px",
          }}
        >
          <div
            className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10"
            style={{ alignItems: "flex-start" }}
          >
            {/* LEFT — Payment method */}
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Payment method
              </p>
              <RadioGroup value={disbursementMethod} onValueChange={setDisbursementMethod}>
                <div className="space-y-2.5">
                  <label
                    htmlFor="eft"
                    className="flex cursor-pointer items-center gap-3 transition-all duration-200"
                    style={{
                      padding: "10px 14px",
                      borderRadius: 8,
                      border:
                        disbursementMethod === "eft"
                          ? "1px solid var(--border-blue)"
                          : "1px solid var(--border-default)",
                      background: disbursementMethod === "eft" ? "var(--color-primary-light)" : "var(--surface-card)",
                    }}
                  >
                    <RadioGroupItem value="eft" id="eft" style={{ borderColor: "var(--border-strong)", color: "var(--color-primary)" }} />
                    <div className="flex-1">
                      <span className="block text-[14px] font-bold text-inherit">
                        Electronic Funds Transfer (EFT)
                      </span>
                      <span className="mt-0.5 block text-[12px]" style={{ color: "var(--text-secondary)" }}>
                        Direct deposit to your bank account
                      </span>
                    </div>
                  </label>

                  <label
                    htmlFor="check"
                    className="flex cursor-pointer items-center gap-3 transition-all duration-200"
                    style={{
                      padding: "10px 14px",
                      borderRadius: 8,
                      border:
                        disbursementMethod === "check"
                          ? "1px solid var(--border-blue)"
                          : "1px solid var(--border-default)",
                      background: disbursementMethod === "check" ? "var(--color-primary-light)" : "var(--surface-card)",
                    }}
                  >
                    <RadioGroupItem value="check" id="check" />
                    <div className="flex-1">
                      <span className="block text-[14px] font-bold text-inherit">Mail check to address</span>
                      <span className="mt-0.5 block text-[12px]" style={{ color: "var(--text-secondary)" }}>
                        Physical check mailed to your address
                      </span>
                    </div>
                  </label>
                </div>
              </RadioGroup>

              {disbursementMethod === "eft" && (
                <div
                  className="mt-2 flex items-center gap-2 rounded-md border border-violet-200 px-2.5 py-1.5 text-[12px] font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300"
                  style={{ marginTop: 8, background: "var(--accent-purple-tint)" }}
                >
                  <span aria-hidden>⚡</span>
                  <span>EFT recommended — funds arrive in 2–3 days</span>
                </div>
              )}

              {disbursementMethod === "eft" && (
                <div style={{ marginTop: 14 }}>
                  <Select value={bankAccount || undefined} onValueChange={setBankAccount}>
                    <SelectTrigger
                      style={{
                        padding: "12px 36px 12px 16px",
                        borderRadius: 12,
                        border: "var(--c-border)",
                        background: "transparent",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "inherit",
                        height: 48,
                      }}
                    >
                      <SelectValue placeholder="Select bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chase-1234">Chase Bank - ****1234</SelectItem>
                      <SelectItem value="bofa-5678">Bank of America - ****5678</SelectItem>
                      <SelectItem value="wells-9012">Wells Fargo - ****9012</SelectItem>
                      <SelectItem value="add-new">+ Add New Bank Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* RIGHT — Repayment */}
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Repayment method
              </p>
              <RadioGroup value={repaymentMethod} onValueChange={setRepaymentMethod} className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "payroll", emoji: "💳", title: "Payroll Deduction", sub: "From paycheck" },
                    { id: "ach", emoji: "🏦", title: "ACH Auto-Debit", sub: "Bank transfer" },
                    { id: "manual", emoji: "↔", title: "Manual Payments", sub: "You initiate" },
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt.id}
                    htmlFor={`repay-${opt.id}`}
                    className="relative flex cursor-pointer flex-col items-center gap-1 rounded-lg border bg-white p-2 text-center transition-all dark:border-gray-600 dark:bg-gray-900/40"
                    style={{
                      borderWidth: repaymentMethod === opt.id ? 2 : 1,
                      borderColor: repaymentMethod === opt.id ? "var(--color-primary)" : "var(--border-default)",
                      background: repaymentMethod === opt.id ? "var(--color-primary-light)" : undefined,
                      padding: "10px 8px",
                    }}
                  >
                    {repaymentMethod === opt.id && (
                      <div
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-white"
                        style={{ fontSize: 10, background: "var(--color-primary)" }}
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </div>
                    )}
                    <span className="text-lg leading-none">{opt.emoji}</span>
                    <span className="text-[11px] font-bold leading-tight text-inherit">{opt.title}</span>
                    <span className="text-[9px] leading-tight" style={{ color: "var(--text-secondary)" }}>{opt.sub}</span>
                    <RadioGroupItem value={opt.id} id={`repay-${opt.id}`} className="sr-only" />
                  </label>
                ))}
              </RadioGroup>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold text-inherit">Periodic Payment</label>
                  <div
                    className="flex items-center overflow-hidden rounded-[10px] border"
                    style={{ borderColor: "var(--c-border-color)" }}
                  >
                    <div
                      className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center"
                      style={{ background: "var(--c-blue-tint)" }}
                    >
                      <DollarSign className="h-4 w-4" style={{ color: "var(--brand-primary)" }} />
                    </div>
                    <input
                      type="text"
                      value={periodicPayment}
                      onChange={(e) => setPeriodicPayment(e.target.value)}
                      className="flex-1 border-0 bg-transparent px-3 py-2 text-[14px] font-bold outline-none"
                      style={{ color: "inherit" }}
                    />
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    <Info className="h-3 w-3 opacity-70" />
                    <p className="text-[11px] font-medium opacity-80">Minimum: $0.80</p>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold text-inherit">First Repayment Date</label>
                  <div
                    className="flex items-center overflow-hidden rounded-[10px] border"
                    style={{ borderColor: "var(--c-border-color)" }}
                  >
                    <div
                      className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center"
                      style={{ background: "var(--c-blue-tint)" }}
                    >
                      <Calendar className="h-4 w-4" style={{ color: "var(--brand-primary)" }} />
                    </div>
                    <input
                      type="date"
                      value={repaymentStartDate}
                      onChange={(e) => setRepaymentStartDate(e.target.value)}
                      min="2026-04-01"
                      className="flex-1 border-0 bg-transparent px-3 py-2 text-[14px] font-bold outline-none"
                      style={{ color: "inherit" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Amortization (compact) */}
          <div className="mt-6 border-t border-[var(--tx-border-light,#F1F5F9)] pt-4 dark:border-white/10">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-bold text-inherit">Amortization</h3>
                <p className="text-[12px] opacity-80">Preview schedule and totals</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAmortization(!showAmortization)}
                className="flex items-center gap-1.5 rounded-full border border-blue-600 bg-transparent px-3.5 py-1.5 text-[12px] font-semibold text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/30"
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${showAmortization ? "rotate-180" : ""}`}
                />
                {showAmortization ? "Hide" : "Show"} preview
              </button>
            </div>
            {showAmortization && (
              <div
                className="mt-3 rounded-[10px] border p-3 dark:border-white/10"
                style={{ borderColor: "var(--tx-border, #E2E8F0)" }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5" style={{ color: "var(--brand-primary)" }} />
                  <span className="text-[12px] font-bold">Amortization preview</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { k: "Total repayment", v: `$${(loanData.totalPayback ?? 5200).toLocaleString()}` },
                      { k: "Total interest", v: `$${(loanData.totalInterest ?? 200).toLocaleString()}` },
                      { k: "Payments", v: String((loanData.tenure ?? 3) * 12) },
                    ] as const
                  ).map((row) => (
                    <div
                      key={row.k}
                      className="rounded-lg border p-2 dark:border-white/10"
                      style={{ borderColor: "var(--tx-border-light, #F1F5F9)" }}
                    >
                      <p className="mb-0.5 text-[10px] font-medium opacity-80">{row.k}</p>
                      <p
                        className="text-[14px] font-bold"
                        style={
                          row.k === "Total interest" ? { color: "var(--brand-primary)" } : undefined
                        }
                      >
                        {row.v}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {disbursementMethod === "eft" && bankAccount === "add-new" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.12 }}
        >
          <Collapsible open={bankDetailsOpen} onOpenChange={setBankDetailsOpen}>
            <div
              className="overflow-hidden rounded-2xl border"
              style={{ borderColor: "var(--tx-border-light, #F1F5F9)" }}
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between text-left transition-all duration-200 hover:bg-slate-50 dark:hover:bg-gray-800"
                  style={{ padding: "20px 24px" }}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className="flex items-center justify-center rounded-[10px] border border-[var(--c-border-green)]"
                      style={{
                        width: 36,
                        height: 36,
                        background: "var(--status-success-tint)",
                        color: "var(--status-success)",
                      }}
                    >
                      <Landmark className="h-[18px] w-[18px]" />
                    </div>
                    <div>
                      <span className="block text-[14px] font-bold tracking-tight text-inherit">
                        New Bank Account Details
                      </span>
                      <span className="mt-0.5 block text-[12px] font-medium opacity-80">
                        Account number, routing number, and type
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${bankDetailsOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-5 border-t px-6 pb-6 pt-5 dark:border-white/10" style={{ borderColor: "var(--tx-border-light, #F1F5F9)" }}>
                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-inherit">Bank Account Number</label>
                    <Input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="Enter account number"
                      className="font-mono"
                      style={{
                        padding: "9px 12px",
                        borderRadius: 9,
                        border: "1.5px solid var(--c-border-color)",
                        fontSize: 13,
                        color: "inherit",
                        background: "transparent",
                      }}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-inherit">Routing Number</label>
                    <Input
                      type="text"
                      value={routingNumber}
                      onChange={(e) => setRoutingNumber(e.target.value)}
                      placeholder="9-digit routing number"
                      maxLength={9}
                      className="font-mono"
                      style={{
                        padding: "9px 12px",
                        borderRadius: 9,
                        border: "1.5px solid var(--c-border-color)",
                        fontSize: 13,
                        color: "inherit",
                        background: "transparent",
                      }}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-inherit">Account Type</label>
                    <Select value={accountType} onValueChange={setAccountType}>
                      <SelectTrigger
                        style={{
                          padding: "9px 36px 9px 14px",
                          borderRadius: 10,
                          border: "var(--c-border)",
                          background: "transparent",
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checking">Checking</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </motion.div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => navigate("/transactions/loan/simulator")}
          className="flex min-h-[2.75rem] cursor-pointer items-center gap-2 border border-slate-200 bg-white text-slate-600 transition-all duration-200 hover:bg-slate-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          style={{ padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue}
          className="btn-brand flex min-h-[2.75rem] cursor-pointer items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue to Fees
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default LoanConfiguration;

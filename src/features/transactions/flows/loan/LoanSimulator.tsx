import { Slider } from "../../components/ui/slider";
import { useNavigate } from "react-router-dom";
import { useState, type ChangeEvent, type CSSProperties } from "react";
import { useLoanFlow } from "./LoanFlowLayout";
import { DollarSign, Calendar, ArrowRight, ArrowLeft, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

const LABEL = {
  general: "General Purpose",
  home: "Home Purchase",
  refinance: "Refinance",
} as const;

type LoanTypeId = keyof typeof LABEL;

const LOAN_TYPE_PILLS: { id: LoanTypeId; label: string }[] = [
  { id: "general", label: "💳 General Purpose" },
  { id: "home", label: "🏠 Home Purchase" },
  { id: "refinance", label: "🔄 Refinance" },
];

const capLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--text-secondary)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const PURPOSE_OPTIONS = [
  "Education",
  "Medical",
  "Travel",
  "Home Repair",
  "Other",
] as const;

const maxLoan = 10000;
const minLoan = 1000;

function parseAmountInput(raw: string): number {
  const n = Number.parseInt(raw.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function formatAmount(n: number): string {
  return n.toLocaleString("en-US");
}

function LoanSimulator() {
  const navigate = useNavigate();
  const { updateLoanData } = useLoanFlow();
  const [loanTypeId, setLoanTypeId] = useState<LoanTypeId>("general");
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [loanAmount, setLoanAmount] = useState(5000);
  const [amountInput, setAmountInput] = useState("5,000");
  const [amountTouched, setAmountTouched] = useState(false);
  const [amountWarnMax, setAmountWarnMax] = useState(false);
  const [tenure, setTenure] = useState(3);

  /** Amount used for amortization (clamped to product limits). */
  const amortPrincipal = Math.min(maxLoan, Math.max(minLoan, loanAmount));

  const interestRate = 0.08;
  const monthlyRate = interestRate / 12;
  const numPayments = tenure * 12;
  const monthlyPayment =
    (amortPrincipal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);

  const totalInterest = monthlyPayment * numPayments - amortPrincipal;
  const totalPayback = amortPrincipal + totalInterest;
  const loanPayoffDate = new Date(2026 + tenure, 2, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const amountBelowMin = loanAmount < minLoan;
  const showAmountError = amountTouched && amountBelowMin;

  const clampAndSetAmount = (n: number) => {
    let v = Math.round(n / 100) * 100;
    if (v > maxLoan) {
      v = maxLoan;
      setAmountWarnMax(true);
    } else {
      setAmountWarnMax(false);
    }
    if (v < minLoan && n <= maxLoan) {
      v = Math.max(minLoan, v);
    }
    setLoanAmount(v);
    setAmountInput(formatAmount(v));
  };

  const handleAmountInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setAmountInput(raw);
    const parsed = parseAmountInput(raw);
    if (parsed > maxLoan) {
      setAmountWarnMax(true);
      clampAndSetAmount(maxLoan);
      return;
    }
    setAmountWarnMax(false);
    if (parsed >= minLoan && parsed <= maxLoan) {
      setLoanAmount(parsed);
    } else if (parsed > 0 && parsed < minLoan) {
      setLoanAmount(parsed);
    }
  };

  const handleAmountBlur = () => {
    setAmountTouched(true);
    let v = parseAmountInput(amountInput);
    if (v > maxLoan) {
      v = maxLoan;
      setAmountWarnMax(true);
    } else {
      setAmountWarnMax(false);
    }
    if (v >= minLoan && v <= maxLoan) {
      v = Math.round(v / 100) * 100;
      setLoanAmount(v);
      setAmountInput(formatAmount(v));
    } else if (v > 0 && v < minLoan) {
      setLoanAmount(v);
      setAmountInput(formatAmount(v));
    } else {
      setAmountInput(formatAmount(loanAmount));
    }
  };

  const handleContinue = () => {
    if (!selectedPurpose) return;
    updateLoanData({
      selectedLoanType: LABEL[loanTypeId],
      selectedLoanTypeId: loanTypeId,
      selectedLoanPurpose: selectedPurpose,
      amount: amortPrincipal,
      tenure,
      loanType: loanTypeId,
      reason: selectedPurpose,
      monthlyPayment: Math.round(monthlyPayment),
      totalInterest: Math.round(totalInterest),
      totalPayback: Math.round(totalPayback),
      payoffDate: loanPayoffDate,
    });
    navigate("/transactions/loan/configuration");
  };

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "inherit",
            letterSpacing: "-0.5px",
            lineHeight: "28px",
            marginBottom: 4,
          }}
        >
          Loan Simulator
        </h2>
        <p style={{ fontSize: 13, fontWeight: 500, color: "inherit", lineHeight: "20px" }}>
          Adjust the loan amount and tenure to see how it affects your payments.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
        >
          <div
            style={{
              background: "transparent",
              borderRadius: 16,
              border: "1px solid var(--tx-border-light, #F1F5F9)",
              padding: 16,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: "linear-gradient(90deg, var(--chart-blue), var(--chart-sky))",
                borderRadius: "16px 16px 0 0",
              }}
            />

            <div className="flex flex-col">
              <div
                style={{
                  borderBottom: "1px solid var(--border-light)",
                  paddingBottom: 10,
                  marginBottom: 14,
                }}
              >
                <h3 style={{ ...capLabelStyle, margin: 0 }}>Loan details</h3>
              </div>

              <div className="flex flex-col" style={{ gap: 14 }}>
              {/* Loan type — pill toggle */}
              <div>
                <p style={{ ...capLabelStyle, marginBottom: 6 }}>Loan type</p>
                <div
                  className="flex w-full"
                  style={{
                    background: "var(--surface-elevated)",
                    borderRadius: 10,
                    padding: 4,
                  }}
                >
                  {LOAN_TYPE_PILLS.map(({ id, label }) => {
                    const selected = loanTypeId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setLoanTypeId(id)}
                        className="flex-1 text-center transition-all duration-200 ease-in-out"
                        style={{
                          padding: "7px 0",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: selected ? 600 : 500,
                          cursor: "pointer",
                          border: "none",
                          background: selected ? "var(--surface-card)" : "transparent",
                          color: selected ? "var(--color-primary)" : "var(--text-secondary)",
                          boxShadow: selected ? "var(--shadow-subtle)" : "none",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Purpose */}
              <div>
                <p style={{ ...capLabelStyle, marginBottom: 6 }}>Purpose</p>
                <div className="relative">
                  <select
                    value={selectedPurpose}
                    onChange={(e) => setSelectedPurpose(e.target.value)}
                    className="w-full appearance-none bg-white"
                    style={{
                      height: 36,
                      border: "1px solid var(--input-border)",
                      borderRadius: 8,
                      padding: "6px 32px 6px 10px",
                      fontSize: 13,
                      color: "var(--text-primary)",
                      outline: "none",
                    }}
                  >
                    <option value="">Select a reason...</option>
                    {PURPOSE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                    style={{ color: "var(--input-placeholder)" }}
                    aria-hidden
                  />
                </div>
              </div>

              {/* Loan Amount */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span style={capLabelStyle}>Loan amount</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-primary)" }}>
                    ${formatAmount(amortPrincipal)}
                  </span>
                </div>
                <div
                  className="flex items-center bg-white"
                  style={{
                    height: 38,
                    border: "1px solid var(--input-border)",
                    borderRadius: 8,
                    padding: "6px 10px",
                  }}
                >
                  <span className="mr-0.5 shrink-0 text-[15px] font-bold" style={{ color: "var(--input-placeholder)" }}>$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amountInput}
                    onChange={handleAmountInputChange}
                    onBlur={handleAmountBlur}
                    className="min-w-0 flex-1 border-0 bg-transparent p-0 outline-none"
                    style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}
                  />
                </div>
                {showAmountError && (
                  <p className="mt-1 text-[12px] font-medium text-red-600">Minimum loan amount is $1,000</p>
                )}
                {amountWarnMax && (
                  <p className="mt-1 text-[12px] font-medium text-amber-700">Maximum loan amount is $10,000 — value adjusted</p>
                )}
                <Slider
                  value={[amortPrincipal]}
                  onValueChange={(value) => {
                    setAmountWarnMax(false);
                    clampAndSetAmount(value[0]);
                  }}
                  min={minLoan}
                  max={maxLoan}
                  step={100}
                  className="mt-1.5"
                />
                <div className="mt-1 flex justify-between">
                  <span className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>$1,000</span>
                  <span className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>$10,000 max</span>
                </div>
              </div>

              {/* Loan Tenure */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span style={capLabelStyle}>Loan tenure</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-primary)" }}>
                    {tenure} {tenure === 1 ? "year" : "years"}
                  </span>
                </div>
                <Slider
                  value={[tenure]}
                  onValueChange={(value) => setTenure(value[0])}
                  min={1}
                  max={5}
                  step={1}
                  className="mt-0"
                />
                <div className="mt-1 flex justify-between">
                  <span className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>1 year</span>
                  <span className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>5 years max</span>
                </div>
              </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right — Payment Details */}
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          >
            <div
              style={{
                background: "transparent",
                borderRadius: 16,
                border: "1px solid var(--tx-border-light, #F1F5F9)",
                padding: "20px 22px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: "linear-gradient(90deg, var(--chart-blue), var(--chart-sky))",
                  borderRadius: "16px 16px 0 0",
                }}
              />

              <h3
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "inherit",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  marginBottom: 14,
                }}
              >
                Payment Details
              </h3>

              <div style={{ background: "var(--c-blue-tint)", borderRadius: 12, padding: "14px 18px", marginBottom: 12 }}>
                <div className="mb-1.5 flex items-center gap-2">
                  <div
                    className="flex items-center justify-center"
                    style={{ width: 28, height: 28, borderRadius: 8, background: "var(--brand-primary)", color: "var(--text-inverse)" }}
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--brand-primary)" }}>Monthly Payment</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span style={{ fontSize: 28, fontWeight: 800, color: "inherit", letterSpacing: "-1px", lineHeight: 1 }}>
                    ${Math.round(monthlyPayment).toLocaleString()}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: "inherit" }}>/mo</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  {
                    label: "Total Interest",
                    value: `$${Math.round(totalInterest).toLocaleString()}`,
                    bg: "var(--c-blue-tint)",
                    color: "var(--brand-purple-light)",
                    dotColor: "var(--brand-purple-light)",
                  },
                  {
                    label: "Total Payback",
                    value: `$${Math.round(totalPayback).toLocaleString()}`,
                    bg: "var(--status-success-tint)",
                    color: "var(--status-success)",
                    dotColor: "var(--status-success)",
                  },
                ].map((item, i) => (
                  <div key={i} style={{ background: item.bg, borderRadius: 10, padding: "10px 14px" }}>
                    <div className="mb-1 flex items-center gap-1.5">
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: item.dotColor }} />
                      <span style={{ fontSize: 10, fontWeight: 600, color: item.color }}>{item.label}</span>
                    </div>
                    <p style={{ fontSize: 17, fontWeight: 800, color: "inherit", letterSpacing: "-0.5px" }}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div
                className="mt-2 flex items-center justify-between"
                style={{
                  background: "transparent",
                  borderRadius: 10,
                  padding: "10px 14px",
                  border: "1px solid var(--tx-border-light, #F1F5F9)",
                }}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" style={{ color: "var(--brand-primary)" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "inherit" }}>Loan Payoff Date</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "inherit", letterSpacing: "-0.2px" }}>{loanPayoffDate}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex items-center justify-between" style={{ paddingTop: 8 }}>
        <button
          onClick={() => navigate("/transactions/loan")}
          className="flex min-h-[2.75rem] cursor-pointer items-center gap-2 transition-all duration-200"
          style={{ background: "transparent", border: "var(--c-border)", color: "inherit", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={amountBelowMin || !selectedPurpose}
          className="btn-brand flex cursor-pointer items-center gap-2 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue to Configuration
          <ArrowRight style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  );
}

export default LoanSimulator;

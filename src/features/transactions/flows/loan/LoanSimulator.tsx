import { Slider } from "../../components/ui/slider";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useLoanFlow } from "./LoanFlowLayout";
import { DollarSign, Calendar, ArrowRight, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import RetirementImpactWidget from "../../components/RetirementImpactWidget";

function LoanSimulator() {
  const navigate = useNavigate();
  const { updateLoanData } = useLoanFlow();
  const [loanAmount, setLoanAmount] = useState(5000);
  const [tenure, setTenure] = useState(3);

  const maxLoan = 10000;
  const interestRate = 0.08;

  const monthlyRate = interestRate / 12;
  const numPayments = tenure * 12;
  const monthlyPayment =
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);

  const totalInterest = (monthlyPayment * numPayments) - loanAmount;
  const totalPayback = loanAmount + totalInterest;

  const retirementImpact = Math.round(loanAmount * 1.64);
  const loanPayoffDate = new Date(2026 + tenure, 2, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleContinue = () => {
    updateLoanData({ amount: loanAmount, tenure });
    navigate("/transactions/loan/configuration");
  };

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "inherit", letterSpacing: "-0.5px", lineHeight: "28px", marginBottom: 4 }}>
          Loan Simulator
        </h2>
        <p style={{ fontSize: 13, fontWeight: 500, color: "inherit", lineHeight: "20px" }}>
          Adjust the loan amount and tenure to see how it affects your payments and retirement.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Input Controls */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
        >
          <div style={{ background: "transparent", borderRadius: 16, border: "1px solid var(--tx-border-light, #F1F5F9)", padding: "20px 22px", overflow: "hidden", position: "relative" }}>
            {/* Subtle top accent */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #2563EB, #0EA5E9)", borderRadius: "16px 16px 0 0" }} />

            <h3 style={{ fontSize: 11, fontWeight: 700, color: "inherit", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 16 }}>
              Loan Details
            </h3>

            <div className="space-y-3.5">
              {/* Loan Amount Slider */}
              <div>
                <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                  <div className="flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 8, background: "#2563EB", color: "#fff" }}>
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "inherit" }}>Loan Amount</span>
                </div>
                <div style={{ background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)", borderRadius: 14, padding: "10px 16px", marginBottom: 10 }}>
                  <div className="flex items-baseline gap-1.5">
                    <span style={{ fontSize: 26, fontWeight: 800, color: "inherit", letterSpacing: "-0.8px", lineHeight: 1 }}>
                      ${loanAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
                <Slider
                  value={[loanAmount]}
                  onValueChange={(value) => setLoanAmount(value[0])}
                  min={1000}
                  max={maxLoan}
                  step={100}
                  className="mb-1.5"
                />
                <div className="flex justify-between">
                  <span style={{ fontSize: 9, color: "inherit", fontWeight: 500 }}>$1,000</span>
                  <span style={{ fontSize: 9, color: "inherit", fontWeight: 500 }}>${maxLoan.toLocaleString()} max</span>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #E2E8F0, transparent)" }} />

              {/* Tenure Slider */}
              <div>
                <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                  <div className="flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 8, background: "#0EA5E9", color: "#fff" }}>
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "inherit" }}>Loan Tenure</span>
                </div>
                <div style={{ background: "linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)", borderRadius: 14, padding: "10px 16px", marginBottom: 10 }}>
                  <div className="flex items-baseline gap-1.5">
                    <span style={{ fontSize: 26, fontWeight: 800, color: "inherit", letterSpacing: "-0.8px", lineHeight: 1 }}>
                      {tenure}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "inherit" }}>
                      {tenure === 1 ? "year" : "years"}
                    </span>
                  </div>
                </div>
                <Slider
                  value={[tenure]}
                  onValueChange={(value) => setTenure(value[0])}
                  min={1}
                  max={5}
                  step={1}
                  className="mb-1.5"
                />
                <div className="flex justify-between">
                  <span style={{ fontSize: 9, color: "inherit", fontWeight: 500 }}>1 year</span>
                  <span style={{ fontSize: 9, color: "inherit", fontWeight: 500 }}>5 years max</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Live Calculations */}
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          >
            <div style={{ background: "transparent", borderRadius: 16, border: "1px solid var(--tx-border-light, #F1F5F9)", padding: "20px 22px", overflow: "hidden", position: "relative" }}>
              {/* Subtle top accent */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #2563EB, #0EA5E9)", borderRadius: "16px 16px 0 0" }} />

              <h3 style={{ fontSize: 11, fontWeight: 700, color: "inherit", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 14 }}>
                Payment Details
              </h3>

              {/* Hero Stat — Monthly Payment */}
              <div style={{ background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)", borderRadius: 12, padding: "14px 18px", marginBottom: 12 }}>
                <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                  <div className="flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 8, background: "#2563EB", color: "#fff" }}>
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#3B82F6" }}>Monthly Payment</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span style={{ fontSize: 28, fontWeight: 800, color: "inherit", letterSpacing: "-1px", lineHeight: 1 }}>
                    ${Math.round(monthlyPayment).toLocaleString()}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: "inherit" }}>/mo</span>
                </div>
              </div>

              {/* Secondary Stats Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "Total Interest", value: `$${Math.round(totalInterest).toLocaleString()}`, bg: "#F5F3FF", color: "#8B5CF6", dotColor: "#8B5CF6" },
                  { label: "Total Payback", value: `$${Math.round(totalPayback).toLocaleString()}`, bg: "#F0FDF4", color: "#10B981", dotColor: "#10B981" },
                ].map((item, i) => (
                  <div key={i} style={{ background: item.bg, borderRadius: 10, padding: "10px 14px" }}>
                    <div className="flex items-center gap-1.5" style={{ marginBottom: 4 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: item.dotColor }} />
                      <span style={{ fontSize: 10, fontWeight: 600, color: item.color }}>{item.label}</span>
                    </div>
                    <p style={{ fontSize: 17, fontWeight: 800, color: "inherit", letterSpacing: "-0.5px" }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Payoff Date — Full Width */}
              <div className="flex items-center justify-between" style={{ marginTop: 8, background: "transparent", borderRadius: 10, padding: "10px 14px", border: "1px solid var(--tx-border-light, #F1F5F9)" }}>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" style={{ color: "#2563EB" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "inherit" }}>Loan Payoff Date</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "inherit", letterSpacing: "-0.2px" }}>
                  {loanPayoffDate}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Remaining Balance After Loan */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
          >
            
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          >
            <RetirementImpactWidget
              compact
              impactAmount={-retirementImpact}
              impactLabel={`−$${retirementImpact.toLocaleString()} projected impact from loan`}
              estimatedValue={38420}
              onTrack={loanAmount <= 5000}
            />
          </motion.div>
        </div>
      </div>

      <div className="flex justify-between items-center" style={{ paddingTop: 8 }}>
        <button
          onClick={() => navigate("/transactions/loan")}
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer"
          style={{ background: "transparent", border: "1.5px solid #E2E8F0", color: "inherit", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Back
        </button>
        <button
          onClick={handleContinue}
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer"
          style={{ background: "#2563EB", color: "#fff", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, border: "none", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}
        >
          Continue to Configuration
          <ArrowRight style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  );
}

export default LoanSimulator

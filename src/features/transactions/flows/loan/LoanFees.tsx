import { useNavigate } from "react-router-dom";
import { useLoanFlow } from "./LoanFlowLayout";
import { motion } from "framer-motion";
import { Info, ArrowRight, ArrowLeft } from "lucide-react";

function LoanFees() {
  const navigate = useNavigate();
  const { loanData } = useLoanFlow();

  const loanAmount = loanData.amount || 5000;
  const transactionFee = 50;
  const tpaFee = 25;
  const eftFee = 10;
  const redemptionFee = 15;

  const totalFees = transactionFee + tpaFee + eftFee + redemptionFee;
  const netLoanAmount = loanAmount - totalFees;

  const fees = [
    { label: "Transaction Fee", desc: "One-time processing fee", amount: transactionFee },
    { label: "TPA Fee", desc: "Third-party administrator fee", amount: tpaFee },
    { label: "EFT Fee", desc: "Electronic funds transfer fee", amount: eftFee },
    { label: "Redemption Fee", desc: "Investment liquidation fee", amount: redemptionFee },
  ];

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "inherit", letterSpacing: "-0.5px", lineHeight: "34px", marginBottom: 8 }}>
          Fees and Charges
        </h2>
        <p style={{ fontSize: 14, fontWeight: 500, color: "inherit", lineHeight: "22px" }}>
          Review all fees associated with your loan request. Fees are deducted from the gross loan amount.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
      >
        <div style={{ background: "transparent", borderRadius: 16, border: "1px solid var(--tx-border-light, #F1F5F9)", padding: "24px 28px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "inherit", letterSpacing: "-0.3px", marginBottom: 24 }}>
            Fee Breakdown
          </h3>

          <div className="space-y-0">
            {/* Gross Loan Amount */}
            <div className="flex items-center justify-between" style={{ padding: "14px 0", borderBottom: "1px solid var(--tx-border-light, #F1F5F9)" }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "inherit" }}>Gross Loan Amount</p>
                <p style={{ fontSize: 12, fontWeight: 500, color: "inherit" }}>Total amount requested</p>
              </div>
              <p style={{ fontSize: 20, fontWeight: 800, color: "inherit", letterSpacing: "-0.3px" }}>
                ${loanAmount.toLocaleString()}
              </p>
            </div>

            {/* Individual Fees */}
            {fees.map((fee, i) => (
              <div key={i} className="flex items-center justify-between" style={{ padding: "12px 0", borderBottom: "1px solid var(--tx-border-light, #F1F5F9)" }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "inherit" }}>{fee.label}</p>
                  <p style={{ fontSize: 11, fontWeight: 500, color: "inherit" }}>{fee.desc}</p>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "inherit" }}>-${fee.amount}</p>
              </div>
            ))}

            {/* Total Fees */}
            <div className="flex items-center justify-between" style={{ padding: "14px 0", borderBottom: "var(--c-border)" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "inherit" }}>Total Fees</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#EF4444" }}>-${totalFees}</p>
            </div>

            {/* Net Amount */}
            <div
              className="flex items-center justify-between -mx-7 px-7"
              style={{
                padding: "16px 28px",
                marginTop: 8,
                background: "var(--c-blue-tint)",
                borderRadius: 12,
              }}
            >
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "inherit", letterSpacing: "-0.3px" }}>Net Loan Amount</p>
                <p style={{ fontSize: 12, fontWeight: 500, color: "inherit" }}>Amount you will receive</p>
              </div>
              <p style={{ fontSize: 28, fontWeight: 800, color: "var(--brand-primary)", letterSpacing: "-0.5px" }}>
                ${netLoanAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
      >
        <div
          className="flex items-start gap-3"
          style={{ background: "var(--c-blue-tint)", border: "1px solid #BFDBFE", borderRadius: 14, padding: "16px 20px" }}
        >
          <Info className="flex-shrink-0 mt-0.5" style={{ width: 16, height: 16, color: "var(--brand-primary)" }} />
          <p className="leading-relaxed" style={{ fontSize: 13, fontWeight: 500, color: "var(--brand-primary)" }}>
            <span style={{ fontWeight: 700 }}>Note:</span> All fees will be deducted from your loan amount.
            Your monthly payments will be based on the gross loan amount of ${loanAmount.toLocaleString()},
            but you will receive ${netLoanAmount.toLocaleString()}. Interest rate of 8% applies to the gross amount.
          </p>
        </div>
      </motion.div>

      <div className="flex justify-between items-center" style={{ paddingTop: 16 }}>
        <button
          onClick={() => navigate("/transactions/loan/configuration")}
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer"
          style={{ background: "transparent", border: "var(--c-border)", color: "inherit", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Back
        </button>
        <button
          onClick={() => navigate("/transactions/loan/documents")}
          className="btn-brand flex items-center gap-2 transition-all duration-200 cursor-pointer"
        >
          Continue to Documents
          <ArrowRight style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  );
}

export default LoanFees

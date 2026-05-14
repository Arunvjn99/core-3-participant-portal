import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  DollarSign,
  AlertTriangle,
  Percent,
  Shield,
  CheckCircle2,
  XCircle } from "lucide-react";
import { FlowPageHeader, FlowCard, FlowCardTitle, FlowNavButtons, FlowInfoBanner } from "../../components/FlowUI";

function WithdrawalEligibility() {
  const navigate = useNavigate();

  const eligibilityChecks = [
    { label: "Hardship Withdrawal", eligible: true, note: "Available with documentation" },
    { label: "In-Service Withdrawal", eligible: false, note: "Requires age 59½ (current: 42)" },
    { label: "Required Minimum Distribution", eligible: false, note: "Requires age 73" },
    { label: "Termination Withdrawal", eligible: false, note: "Active employment detected" },
  ];

  const metrics = [
    { icon: <DollarSign className="w-5 h-5" />, label: "Available to Withdraw", value: "$5,000", bg: "var(--color-primary-light)", color: "var(--color-primary)" },
    { icon: <Percent className="w-5 h-5" />, label: "Estimated Tax Withholding", value: "20–35%", bg: "var(--status-warning-tint)", color: "var(--status-warning)" },
    { icon: <Shield className="w-5 h-5" />, label: "Vested Balance", value: "$25,000", bg: "var(--color-primary-light)", color: "var(--color-primary)" },
  ];

  return (
    <div className="space-y-6">
      <FlowPageHeader title="Withdrawal Eligibility" description="Review your withdrawal eligibility and understand the tax implications." />

      {/* Key Metrics */}
      <FlowCard delay={0.05}>
        <FlowCardTitle>Withdrawal Details</FlowCardTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metrics.map((m, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="flex items-center justify-center flex-shrink-0" style={{ width: 44, height: 44, borderRadius: 12, background: m.bg, color: m.color }}>
                {m.icon}
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, color: "inherit", marginBottom: 4 }}>{m.label}</p>
                <p style={{ fontSize: 24, fontWeight: 800, color: "inherit", letterSpacing: "-0.5px" }}>{m.value}</p>
              </div>
            </div>
          ))}
        </div>
      </FlowCard>

      {/* Eligibility Checks */}
      <FlowCard delay={0.1}>
        <FlowCardTitle>Withdrawal Type Eligibility</FlowCardTitle>
        <div className="space-y-3">
          {eligibilityChecks.map((check, idx) => (
            <motion.div
              key={check.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 + idx * 0.05, duration: 0.3 }}
              className="flex items-center justify-between transition-all duration-200"
              style={{
                padding: "14px 16px", borderRadius: 12,
                border: check.eligible ? "1px solid var(--border-green)" : "1px solid var(--border-light)",
                background: check.eligible ? "var(--status-success-tint)" : "var(--input-bg)" }}
            >
              <div className="flex items-center gap-3">
                {check.eligible ? (
                  <CheckCircle2 className="flex-shrink-0" style={{ width: 18, height: 18, color: "var(--status-success)" }} />
                ) : (
                  <XCircle className="flex-shrink-0" style={{ width: 18, height: 18, color: "var(--text-muted)" }} />
                )}
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: check.eligible ? "var(--text-primary)" : "var(--text-muted)" }}>
                    {check.label}
                  </p>
                  <p style={{ fontSize: 11, fontWeight: 500, color: "inherit" }}>{check.note}</p>
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                background: check.eligible ? "var(--status-success-tint)" : "var(--input-bg)",
                color: check.eligible ? "var(--status-success-text)" : "var(--text-muted)" }}>
                {check.eligible ? "Eligible" : "Not Eligible"}
              </span>
            </motion.div>
          ))}
        </div>
      </FlowCard>

      {/* Restrictions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}>
        <FlowInfoBanner variant="warning">
          <div className="flex items-start gap-3">
            <AlertTriangle className="flex-shrink-0 mt-0.5" style={{ width: 20, height: 20, color: "var(--status-warning)" }} />
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "inherit", letterSpacing: "-0.3px", marginBottom: 8 }}>
                Important Restrictions
              </h4>
              <ul className="space-y-2">
                {[
                  "Hardship withdrawals require documentation of financial need",
                  "Taxes and a 10% early withdrawal penalty apply if you are under age 59½",
                  "Withdrawn funds cannot be returned to your account",
                  "Employer match contributions may have vesting restrictions",
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="rounded-full mt-1.5 flex-shrink-0" style={{ width: 6, height: 6, background: "var(--status-warning)" }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: "inherit", lineHeight: "20px" }}>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </FlowInfoBanner>
      </motion.div>

      <FlowNavButtons
        backLabel="Cancel"
        onBack={() => navigate("/transactions")}
        onNext={() => navigate("/transactions/withdrawal/type")}
        nextLabel="Continue"
      />
    </div>
  );
}

export default WithdrawalEligibility

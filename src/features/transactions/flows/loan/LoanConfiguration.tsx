import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import {
  ChevronDown,
  Landmark,
  Info,
  ArrowRight,
  ArrowLeft,
  Wallet,
  Building2,
  RefreshCw,
  Check,
  Clock,
  DollarSign,
  Calendar,
  CreditCard,
  Building,
  ArrowLeftRight,
  BarChart3,
  Sparkles,
  X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useLoanFlow } from "./LoanFlowLayout";
import { motion } from "framer-motion";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "../../components/ui/collapsible";

const loanTypes = [
  {
    id: "general",
    label: "General Purpose Loan",
    description: "For personal expenses like education, travel, or medical",
    icon: Wallet,
    iconBg: "#EFF6FF",
    iconColor: "#2563EB" },
  {
    id: "residential",
    label: "Home Purchase",
    description: "Primary residence loan from your retirement plan",
    icon: Building2,
    iconBg: "#F0FDF4",
    iconColor: "#10B981" },
  {
    id: "refinance",
    label: "Refinance",
    description: "Refinance an existing plan loan at current rates",
    icon: RefreshCw,
    iconBg: "#F5F3FF",
    iconColor: "#7C3AED" },
];

function LoanConfiguration() {
  const navigate = useNavigate();
  const { loanData: _loanData, updateLoanData } = useLoanFlow();
  const [loanType, setLoanType] = useState("general");
  const [reason, setReason] = useState("");
  const [disbursementMethod, setDisbursementMethod] = useState("eft");
  const [bankAccount, setBankAccount] = useState("");

  // Repayment settings (advanced)
  const [_repaymentFrequency, _setRepaymentFrequency] = useState("biweekly");
  const [repaymentStartDate, setRepaymentStartDate] = useState("2026-05-30");
  const [repaymentMethod, setRepaymentMethod] = useState("payroll");
  const [periodicPayment, setPeriodicPayment] = useState("100.00");
  const [showAmortization, setShowAmortization] = useState(false);

  // Bank details (advanced)
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountType, setAccountType] = useState("checking");

  // Expandable sections
  const [_repaymentOpen, _setRepaymentOpen] = useState(true);
  const [bankDetailsOpen, setBankDetailsOpen] = useState(false);
  const [showEftTip, setShowEftTip] = useState(true);

  const handleContinue = () => {
    updateLoanData({
      loanType,
      reason,
      disbursementMethod,
      bankAccount });
    navigate("/transactions/loan/fees");
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
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
            marginBottom: 8 }}
        >
          Loan Configuration
        </h2>
        <p
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "inherit",
            lineHeight: "22px" }}
        >
          Provide additional details about your loan request. Expand advanced
          sections for more options.
        </p>
      </motion.div>

      {/* Loan Type + Reason Card */}
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
            padding: "28px 32px" }}
        >
          {/* Loan Type Section */}
          <h3
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "inherit",
              letterSpacing: "-0.3px",
              marginBottom: 4 }}
          >
            What type of loan do you need?
          </h3>
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "inherit",
              marginBottom: 16 }}
          >
            Select the loan type that best fits your situation
          </p>

          {/* 3-Column Card Selector */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              marginBottom: 24 }}
          >
            {loanTypes.map((type) => {
              const isSelected = loanType === type.id;
              const IconComponent = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setLoanType(type.id)}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "bg-blue-50/60 dark:bg-blue-950/30 border-2 border-blue-600"
                      : "bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 hover:border-slate-300 dark:hover:border-gray-500 hover:shadow-sm"
                  }`}
                  style={{
                    position: "relative",
                    borderRadius: 12,
                    padding: "16px 14px",
                    textAlign: "left",
                    minHeight: 130,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    gap: 0 }}
                >
                  {/* Checkmark Badge */}
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: "#2563EB",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}
                    >
                      <Check
                        style={{ width: 14, height: 14, color: "#fff" }}
                        strokeWidth={3}
                      />
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: type.iconBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16 }}
                  >
                    <IconComponent
                      style={{
                        width: 20,
                        height: 20,
                        color: type.iconColor }}
                    />
                  </div>

                  {/* Label */}
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "inherit",
                      display: "block",
                      marginBottom: 6,
                      letterSpacing: "-0.2px" }}
                  >
                    {type.label}
                  </span>

                  {/* Description */}
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "inherit",
                      lineHeight: "19px",
                      display: "block" }}
                  >
                    {type.description}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Reason for Loan */}
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "inherit",
              letterSpacing: "-0.3px",
              marginBottom: 10 }}
          >
            What's the loan for?
          </h3>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger
              style={{
                padding: "12px 36px 12px 16px",
                borderRadius: 12,
                border: "1.5px solid #E2E8F0",
                background: "transparent",
                fontSize: 14,
                fontWeight: 500,
                color: reason ? "#1E293B" : "#94A3B8",
                height: 48,
                cursor: "pointer",
                outline: "none" }}
            >
              <SelectValue placeholder="Select a reason for your loan..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="home-purchase">Home Purchase</SelectItem>
              <SelectItem value="home-repair">
                Home Repair/Renovation
              </SelectItem>
              <SelectItem value="education">Education Expenses</SelectItem>
              <SelectItem value="medical">Medical Expenses</SelectItem>
              <SelectItem value="debt-consolidation">
                Debt Consolidation
              </SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Processing Time Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #EFF6FF 0%, #E8F0FE 100%)",
            borderRadius: 14,
            border: "1px solid #DBEAFE",
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            gap: 16 }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: "rgba(37,99,235,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0 }}
          >
            <Clock
              style={{ width: 20, height: 20, color: "#2563EB" }}
            />
          </div>
          <div>
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "inherit",
                marginBottom: 2 }}
            >
              Processing time: 10 business days
            </p>
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#2563EB" }}
            >
              You'll receive email updates at each stage of review
            </p>
          </div>
        </div>
      </motion.div>

      {/* Disbursement Method */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
      >
        <div
          style={{
            background: "transparent",
            borderRadius: 16,
            border: "1px solid var(--tx-border-light, #F1F5F9)",
            padding: "28px 32px" }}
        >
          {/* Card Header */}
          <div className="flex items-center gap-3" style={{ marginBottom: 18 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "#EFF6FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center" }}
            >
              <CreditCard style={{ width: 20, height: 20, color: "#2563EB" }} />
            </div>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "inherit",
                letterSpacing: "-0.3px" }}
            >
              Payment Details
            </h3>
          </div>

          {/* PAYMENT METHOD label */}
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "inherit",
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: 10 }}
          >
            Payment Method
          </p>

          <RadioGroup
            value={disbursementMethod}
            onValueChange={setDisbursementMethod}
          >
            <div className="space-y-2.5">
              {/* EFT Option */}
              <label
                htmlFor="eft"
                className="flex items-center gap-4 cursor-pointer transition-all duration-200"
                style={{
                  padding: "14px 18px",
                  borderRadius: 14,
                  border:
                    disbursementMethod === "eft"
                      ? "2px solid #2563EB"
                      : "1.5px solid #E2E8F0",
                  background:
                    disbursementMethod === "eft" ? "#FAFCFF" : "#fff" }}
              >
                <RadioGroupItem value="eft" id="eft" />
                <div className="flex-1">
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "inherit",
                      display: "block" }}
                  >
                    Electronic Funds Transfer (EFT)
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "inherit",
                      display: "block",
                      marginTop: 3 }}
                  >
                    Direct deposit to your bank account
                  </span>
                </div>
              </label>

              {/* Check Option */}
              <label
                htmlFor="check"
                className="flex items-center gap-4 cursor-pointer transition-all duration-200"
                style={{
                  padding: "14px 18px",
                  borderRadius: 14,
                  border:
                    disbursementMethod === "check"
                      ? "2px solid #2563EB"
                      : "1.5px solid #E2E8F0",
                  background:
                    disbursementMethod === "check" ? "#FAFCFF" : "#fff" }}
              >
                <RadioGroupItem value="check" id="check" />
                <div className="flex-1">
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "inherit",
                      display: "block" }}
                  >
                    Mail check to address
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "inherit",
                      display: "block",
                      marginTop: 3 }}
                  >
                    Physical check mailed to your address
                  </span>
                </div>
              </label>
            </div>
          </RadioGroup>

          {/* EFT Recommended Tip */}
          {disbursementMethod === "eft" && showEftTip && (
            <div
              style={{
                marginTop: 16,
                background: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)",
                borderRadius: 12,
                border: "1px solid #DDD6FE",
                padding: "14px 18px",
                position: "relative" }}
            >
              <button
                onClick={() => setShowEftTip(false)}
                className="cursor-pointer transition-all duration-150"
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  background: "transparent",
                  border: "none",
                  color: "#A78BFA",
                  padding: 2 }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
              <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: "#7C3AED",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center" }}
                >
                  <Sparkles style={{ width: 14, height: 14, color: "#fff" }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#7C3AED", letterSpacing: "0.3px" }}>
                  <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.7, marginRight: 6 }}>AI</span>
                  EFT Recommended
                </span>
              </div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "inherit",
                  lineHeight: "21px",
                  paddingRight: 20 }}
              >
                EFT is the <strong style={{ color: "#7C3AED" }}>fastest disbursement method</strong> — funds typically arrive in 2-3 business days. It also reduces the risk of lost or delayed checks and has a lower processing fee.
              </p>
            </div>
          )}

          {/* SELECT BANK section */}
          {disbursementMethod === "eft" && (
            <div style={{ marginTop: 18 }}>
              

              {bankAccount && bankAccount !== "add-new" ? (
                <Select value={bankAccount} onValueChange={setBankAccount}>
                  <SelectTrigger
                    style={{
                      padding: "12px 36px 12px 16px",
                      borderRadius: 12,
                      border: "1.5px solid #E2E8F0",
                      background: "transparent",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "inherit",
                      height: 48 }}
                  >
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chase-1234">
                      Chase Bank - ****1234
                    </SelectItem>
                    <SelectItem value="bofa-5678">
                      Bank of America - ****5678
                    </SelectItem>
                    <SelectItem value="wells-9012">
                      Wells Fargo - ****9012
                    </SelectItem>
                    <SelectItem value="add-new">
                      + Add New Bank Account
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                null
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Advanced: Repayment Settings (Expandable) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      >
        <div
          style={{
            background: "transparent",
            borderRadius: 16,
            border: "1px solid var(--tx-border-light, #F1F5F9)",
            padding: "22px 28px" }}
        >
          {/* Header with Amortization toggle */}
          <div
            className="flex items-start justify-between"
            style={{ marginBottom: 16 }}
          >
            <div>
              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "inherit",
                  letterSpacing: "-0.3px",
                  marginBottom: 2 }}
              >
                Repayment Settings
              </h3>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "inherit" }}
              >
                Configure how you want to repay your loan
              </p>
            </div>
            <button
              onClick={() => setShowAmortization(!showAmortization)}
              className="flex items-center gap-1.5 cursor-pointer transition-all duration-200 border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 bg-transparent"
              style={{
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: "nowrap" }}
            >
              <ChevronDown
                style={{
                  width: 13,
                  height: 13,
                  transform: showAmortization ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s" }}
              />
              Amortization
            </button>
          </div>

          {/* Amortization Schedule (collapsible) */}
          {showAmortization && (
            <div
              style={{
                background: "transparent",
                borderRadius: 10,
                border: "1px solid var(--tx-border, #E2E8F0)",
                padding: "12px 16px",
                marginBottom: 16 }}
            >
              <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                <BarChart3 style={{ width: 14, height: 14, color: "#2563EB" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "inherit" }}>
                  Amortization Preview
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <div style={{ background: "transparent", borderRadius: 8, padding: "8px 10px", border: "1px solid var(--tx-border-light, #F1F5F9)" }}>
                  <p style={{ fontSize: 10, fontWeight: 500, color: "inherit", marginBottom: 2 }}>Total Repayment</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "inherit" }}>$5,200.00</p>
                </div>
                <div style={{ background: "transparent", borderRadius: 8, padding: "8px 10px", border: "1px solid var(--tx-border-light, #F1F5F9)" }}>
                  <p style={{ fontSize: 10, fontWeight: 500, color: "inherit", marginBottom: 2 }}>Total Interest</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#2563EB" }}>$200.00</p>
                </div>
                <div style={{ background: "transparent", borderRadius: 8, padding: "8px 10px", border: "1px solid var(--tx-border-light, #F1F5F9)" }}>
                  <p style={{ fontSize: 10, fontWeight: 500, color: "inherit", marginBottom: 2 }}>Number of Payments</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "inherit" }}>52</p>
                </div>
              </div>
            </div>
          )}

          {/* Repayment Method */}
          <label
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "inherit",
              display: "block",
              marginBottom: 10 }}
          >
            Repayment Method
          </label>

          <div style={{ marginBottom: 18 }}>
            <RadioGroup value={repaymentMethod} onValueChange={setRepaymentMethod} className="grid grid-cols-3 gap-2.5">
            {/* Payroll Deduction */}
            <label
              htmlFor="payroll"
              className="flex flex-col items-center gap-2 cursor-pointer transition-all duration-200"
              style={{
                padding: "14px 10px",
                borderRadius: 12,
                border:
                  repaymentMethod === "payroll"
                    ? "2px solid #2563EB"
                    : "1.5px solid #E2E8F0",
                background:
                  repaymentMethod === "payroll"
                    ? "#F0F7FF"
                    : "#fff",
                textAlign: "center",
                position: "relative" }}
            >
              {repaymentMethod === "payroll" && (
                <div style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check style={{ width: 12, height: 12, color: "#fff" }} strokeWidth={3} />
                </div>
              )}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: repaymentMethod === "payroll" ? "#DBEAFE" : "#F1F5F9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center" }}
              >
                <CreditCard
                  style={{
                    width: 18,
                    height: 18,
                    color: repaymentMethod === "payroll" ? "#2563EB" : "#94A3B8" }}
                />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "inherit" }}>
                Payroll Deduction
              </span>
              <span style={{ fontSize: 11, fontWeight: 500, color: "inherit", lineHeight: "15px" }}>
                Auto-deducted from paycheck
              </span>
              <RadioGroupItem value="payroll" id="payroll" className="sr-only" />
            </label>

            {/* ACH / Direct Payment */}
            <label
              htmlFor="ach-repay"
              className="flex flex-col items-center gap-2 cursor-pointer transition-all duration-200"
              style={{
                padding: "14px 10px",
                borderRadius: 12,
                border:
                  repaymentMethod === "ach"
                    ? "2px solid #2563EB"
                    : "1.5px solid #E2E8F0",
                background:
                  repaymentMethod === "ach"
                    ? "#F0F7FF"
                    : "#fff",
                textAlign: "center",
                position: "relative" }}
            >
              {repaymentMethod === "ach" && (
                <div style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check style={{ width: 12, height: 12, color: "#fff" }} strokeWidth={3} />
                </div>
              )}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: repaymentMethod === "ach" ? "#DBEAFE" : "#F1F5F9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center" }}
              >
                <Building
                  style={{
                    width: 18,
                    height: 18,
                    color: repaymentMethod === "ach" ? "#2563EB" : "#94A3B8" }}
                />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "inherit" }}>
                ACH Auto-Debit
              </span>
              <span style={{ fontSize: 11, fontWeight: 500, color: "inherit", lineHeight: "15px" }}>
                Pay directly via bank transfer
              </span>
              <RadioGroupItem value="ach" id="ach-repay" className="sr-only" />
            </label>

            {/* Manual / Both Methods */}
            <label
              htmlFor="manual"
              className="flex flex-col items-center gap-2 cursor-pointer transition-all duration-200"
              style={{
                padding: "14px 10px",
                borderRadius: 12,
                border:
                  repaymentMethod === "manual"
                    ? "2px solid #2563EB"
                    : "1.5px solid #E2E8F0",
                background:
                  repaymentMethod === "manual"
                    ? "#F0F7FF"
                    : "#fff",
                textAlign: "center",
                position: "relative" }}
            >
              {repaymentMethod === "manual" && (
                <div style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check style={{ width: 12, height: 12, color: "#fff" }} strokeWidth={3} />
                </div>
              )}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: repaymentMethod === "manual" ? "#DBEAFE" : "#F1F5F9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center" }}
              >
                <ArrowLeftRight
                  style={{
                    width: 18,
                    height: 18,
                    color: repaymentMethod === "manual" ? "#2563EB" : "#94A3B8" }}
                />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "inherit" }}>
                Manual Payments
              </span>
              <span style={{ fontSize: 11, fontWeight: 500, color: "inherit", lineHeight: "15px" }}>
                Split between payroll &amp; direct
              </span>
              <RadioGroupItem value="manual" id="manual" className="sr-only" />
            </label>
            </RadioGroup>
          </div>

          {/* Periodic Payment + First Repayment Date side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "inherit",
                  display: "block",
                  marginBottom: 8 }}
              >
                Periodic Payment
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 10,
                  border: "1.5px solid #E2E8F0",
                  background: "transparent",
                  overflow: "hidden",
                  marginBottom: 6 }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    background: "#EFF6FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0 }}
                >
                  <DollarSign
                    style={{ width: 16, height: 16, color: "#2563EB" }}
                  />
                </div>
                <input
                  type="text"
                  value={periodicPayment}
                  onChange={(e) => setPeriodicPayment(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    border: "none",
                    outline: "none",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "inherit",
                    background: "transparent" }}
                />
              </div>
              <div className="flex items-center gap-1">
                <Info style={{ width: 12, height: 12, color: "inherit" }} />
                <p style={{ fontSize: 11, color: "inherit", fontWeight: 500 }}>
                  Minimum: $0.80
                </p>
              </div>
            </div>

            <div>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "inherit",
                  display: "block",
                  marginBottom: 8 }}
              >
                First Repayment Date
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 10,
                  border: "1.5px solid #E2E8F0",
                  background: "transparent",
                  overflow: "hidden" }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    background: "#EFF6FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0 }}
                >
                  <Calendar
                    style={{ width: 16, height: 16, color: "#2563EB" }}
                  />
                </div>
                <input
                  type="date"
                  value={repaymentStartDate}
                  onChange={(e) => setRepaymentStartDate(e.target.value)}
                  min="2026-04-01"
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    border: "none",
                    outline: "none",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "inherit",
                    background: "transparent" }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Advanced: Bank Information (Expandable) */}
      {disbursementMethod === "eft" && bankAccount === "add-new" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.25 }}
        >
          <Collapsible
            open={bankDetailsOpen}
            onOpenChange={setBankDetailsOpen}
          >
            <div
              className="overflow-hidden"
              style={{
                background: "transparent",
                borderRadius: 16,
                border: "1px solid var(--tx-border-light, #F1F5F9)" }}
            >
              <CollapsibleTrigger asChild>
                <button
                  className="w-full flex items-center justify-between text-left cursor-pointer transition-all duration-200 hover:bg-slate-50 dark:hover:bg-gray-800"
                  style={{ padding: "20px 24px" }}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background:
                          "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
                        border: "1px solid #BBF7D0",
                        color: "#10B981" }}
                    >
                      <Landmark className="w-[18px] h-[18px]" />
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "inherit",
                          display: "block",
                          letterSpacing: "-0.3px" }}
                      >
                        New Bank Account Details
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "inherit",
                          marginTop: 2,
                          display: "block" }}
                      >
                        Account number, routing number, and type
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`transition-transform duration-200 ${
                      bankDetailsOpen ? "rotate-180" : ""
                    }`}
                    style={{ width: 16, height: 16, color: "inherit" }}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div
                  className="space-y-5"
                  style={{
                    padding: "0 24px 24px",
                    borderTop: "1px solid var(--tx-border-light, #F1F5F9)" }}
                >
                  <div style={{ paddingTop: 20 }}>
                    <div style={{ marginBottom: 20 }}>
                      <label
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "inherit",
                          display: "block",
                          marginBottom: 8 }}
                      >
                        Bank Account Number
                      </label>
                      <Input
                        type="text"
                        value={bankAccountNumber}
                        onChange={(e) =>
                          setBankAccountNumber(e.target.value)
                        }
                        placeholder="Enter account number"
                        className="font-mono"
                        style={{
                          padding: "9px 12px",
                          borderRadius: 9,
                          border: "1.5px solid #E8ECF1",
                          fontSize: 13,
                          color: "inherit",
                          background: "transparent" }}
                      />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <label
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "inherit",
                          display: "block",
                          marginBottom: 8 }}
                      >
                        Routing Number
                      </label>
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
                          border: "1.5px solid #E8ECF1",
                          fontSize: 13,
                          color: "inherit",
                          background: "transparent" }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "inherit",
                          display: "block",
                          marginBottom: 8 }}
                      >
                        Account Type
                      </label>
                      <Select
                        value={accountType}
                        onValueChange={setAccountType}
                      >
                        <SelectTrigger
                          style={{
                            padding: "9px 36px 9px 14px",
                            borderRadius: 10,
                            border: "1.5px solid #E2E8F0",
                            background: "transparent",
                            fontSize: 13,
                            fontWeight: 600 }}
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
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </motion.div>
      )}

      {/* Navigation Buttons */}
      <div
        className="flex justify-between items-center"
        style={{ paddingTop: 10 }}
      >
        <button
          onClick={() => navigate("/transactions/loan/simulator")}
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer bg-white dark:bg-gray-900 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-800 hover:border-slate-300 dark:hover:border-gray-500"
          style={{ padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={
            !reason || (disbursementMethod === "eft" && !bankAccount)
          }
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0"
          style={{
            background: "#2563EB",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}
        >
          Continue to Fees
          <ArrowRight style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  );
}

export default LoanConfiguration

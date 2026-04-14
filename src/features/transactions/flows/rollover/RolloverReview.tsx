import { Card } from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import { Separator } from "../../components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useRolloverFlow } from "./RolloverFlowLayout";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Building2,
  DollarSign,
  PieChart,
  FileText,
  Clock,
  PartyPopper } from "lucide-react";
import RetirementImpactWidget from "../../components/RetirementImpactWidget";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"];

function RolloverReview() {
  const navigate = useNavigate();
  const { rolloverData } = useRolloverFlow();
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const estimatedAmount = rolloverData.estimatedAmount || 15000;
  const allocation = rolloverData.allocation || [
    { fundName: "Large Cap Equity Fund", percentage: 40 },
    { fundName: "International Growth Fund", percentage: 25 },
    { fundName: "Stable Value Bond Fund", percentage: 20 },
    { fundName: "Target Date 2050 Fund", percentage: 15 },
  ];

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        navigate("/transactions");
      }, 3000);
    }, 2000);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center justify-center py-20"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-6"
          style={{ boxShadow: "0 8px 32px rgba(16,185,129,0.3)" }}
        >
          <PartyPopper className="w-10 h-10 text-white" />
        </motion.div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "inherit", letterSpacing: "-0.5px", lineHeight: "34px", marginBottom: 8 }}>
          Rollover Submitted
        </h2>
        <p className="text-gray-600 text-center max-w-md mb-3">
          Your rollover of ${estimatedAmount.toLocaleString()} from{" "}
          {rolloverData.previousEmployer || "your previous plan"} has been
          submitted successfully.
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Clock className="w-4 h-4" />
          <span>Typical processing time: 5-10 business days</span>
        </div>

        {/* Processing Timeline */}
        <div className="w-full max-w-md">
          <div className="space-y-3">
            {[
              {
                label: "Submitted",
                desc: "Your request is being reviewed",
                active: true },
              {
                label: "Admin Review",
                desc: "Plan administrator verifies documents",
                active: false },
              {
                label: "Funds Received",
                desc: "Transfer from previous plan",
                active: false },
              {
                label: "Allocation Completed",
                desc: "Funds invested per your selections",
                active: false },
            ].map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.active
                      ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white"
                      : "bg-gray-100 text-gray-300 border border-gray-200"
                  }`}
                  style={
                    step.active
                      ? {
                          boxShadow: "0 0 0 3px rgba(99,102,241,0.15)" }
                      : undefined
                  }
                >
                  {step.active ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-medium">{idx + 1}</span>
                  )}
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${step.active ? "text-gray-900" : "text-gray-400"}`}
                  >
                    {step.label}
                  </p>
                  <p className="text-[10px] text-gray-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-8">
          Redirecting to dashboard...
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "inherit", letterSpacing: "-0.5px", lineHeight: "34px", marginBottom: 8 }}>
          Review and Submit
        </h2>
        <p style={{ fontSize: 14, fontWeight: 500, color: "inherit", lineHeight: "22px" }}>
          Please review all details carefully before submitting your rollover
          request.
        </p>
      </motion.div>

      {/* Plan Details Summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <Card
          className="p-6 rounded-2xl border-gray-100/80"
          style={{
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Building2 className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900">
              Previous Plan Details
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider">
                Employer
              </p>
              <p className="text-sm font-medium text-gray-900">
                {rolloverData.previousEmployer || "Acme Corporation"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider">
                Administrator
              </p>
              <p className="text-sm font-medium text-gray-900">
                {rolloverData.planAdministrator || "Fidelity Investments"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider">
                Account Number
              </p>
              <p className="text-sm font-medium text-gray-900 font-mono">
                {rolloverData.accountNumber || "1234-5678-90"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider">
                Rollover Type
              </p>
              <p className="text-sm font-medium text-gray-900 capitalize">
                {rolloverData.rolloverType || "Traditional"} 401(k)
              </p>
            </div>
          </div>

          <Separator className="my-5" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Estimated Rollover Amount
              </span>
            </div>
            <p className="text-xl font-semibold text-gray-900">
              ${estimatedAmount.toLocaleString()}
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Allocation Summary */}
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
          <div className="flex items-center gap-2 mb-5">
            <PieChart className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900">
              Investment Allocation
            </h3>
          </div>

          <div className="space-y-3">
            {allocation.map((fund, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50/60"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-sm text-gray-900">
                    {fund.fundName}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-500">
                    $
                    {Math.round(
                      (fund.percentage / 100) * estimatedAmount
                    ).toLocaleString()}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                    {fund.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Allocation bar */}
          <div className="flex rounded-full overflow-hidden h-2 mt-4">
            {allocation.map((fund, idx) => (
              <div
                key={idx}
                style={{
                  width: `${fund.percentage}%`,
                  backgroundColor: COLORS[idx % COLORS.length] }}
              />
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Documents Summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Card
          className="p-6 rounded-2xl border-gray-100/80"
          style={{
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-center gap-2 mb-5">
            <FileText className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Documents</h3>
          </div>

          <div className="space-y-2">
            {[
              { name: "Rollover Check", status: "Uploaded" },
              { name: "Account Statement", status: "Uploaded" },
              { name: "Distribution Form", status: "Optional - Not uploaded" },
            ].map((doc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50/60"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{doc.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {doc.status === "Uploaded" ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs text-emerald-600 font-medium">
                        {doc.status}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {doc.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Processing Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card
          className="p-6 rounded-2xl border-gray-100/80 bg-gradient-to-br from-indigo-50/30 to-blue-50/20"
          style={{
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900">
              Estimated Processing Timeline
            </h3>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { step: "Submitted", time: "Day 1", desc: "Request logged" },
              {
                step: "Admin Review",
                time: "Day 2-3",
                desc: "Documents verified" },
              {
                step: "Funds Received",
                time: "Day 5-7",
                desc: "Transfer processed" },
              {
                step: "Allocation Done",
                time: "Day 7-10",
                desc: "Funds invested" },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-indigo-200 flex items-center justify-center mx-auto mb-2 text-xs font-semibold text-indigo-600">
                  {idx + 1}
                </div>
                <p className="text-xs font-semibold text-gray-900 mb-0.5">
                  {item.step}
                </p>
                <p className="text-[10px] text-indigo-600 font-medium">
                  {item.time}
                </p>
                <p className="text-[10px] text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Retirement Impact - Rollover adds to retirement savings (positive) */}
      <RetirementImpactWidget
        compact
        impactAmount={estimatedAmount}
        impactLabel={`+$${estimatedAmount.toLocaleString()} added to your retirement savings`}
        estimatedValue={38420}
        onTrack={true}
        delay={0.22}
      />

      {/* Agreement */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        <Card
          className="p-6 rounded-2xl border-gray-100/80"
          style={{
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
            />
            <label
              htmlFor="terms"
              className="text-sm text-gray-700 cursor-pointer leading-relaxed"
            >
              I confirm that the information provided is accurate. I understand
              that this rollover will be processed according to plan rules and
              that the funds will be invested per my allocation selections. I
              acknowledge that processing times may vary and that I will be
              notified of any issues requiring my attention.
            </label>
          </div>
        </Card>
      </motion.div>

      <div className="flex justify-between items-center" style={{ paddingTop: 16 }}>
        <button
          onClick={() => navigate("/transactions/rollover/documents")}
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer"
          style={{ background: "transparent", border: "var(--c-border)", color: "inherit", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!agreed || isSubmitting}
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "#2563EB", color: "#fff", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, border: "none", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}
        >
          {isSubmitting ? "Submitting..." : "Submit Rollover Request"}
        </button>
      </div>
    </div>
  );
}

export default RolloverReview

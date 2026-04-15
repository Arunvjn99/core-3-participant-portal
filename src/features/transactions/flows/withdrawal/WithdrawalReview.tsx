import { Card } from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useWithdrawalFlow } from "./WithdrawalFlowLayout";
import { Separator } from "../../components/ui/separator";
import { CheckCircle2 } from "lucide-react";
import RetirementImpactWidget from "../../components/RetirementImpactWidget";

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
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "inherit", letterSpacing: "-0.5px", lineHeight: "34px", marginBottom: 8 }}>
          Withdrawal Submitted
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-center max-w-md mb-6">
          Your withdrawal request has been submitted successfully. You'll receive confirmation shortly.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "inherit", letterSpacing: "-0.5px", lineHeight: "34px", marginBottom: 8 }}>
          Review and Submit
        </h2>
        <p style={{ fontSize: 14, fontWeight: 500, color: "inherit", lineHeight: "22px" }}>
          Review your withdrawal details before submitting.
        </p>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-6">Withdrawal Summary</h3>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Withdrawal Type</p>
            <p className="font-medium text-gray-900 dark:text-white capitalize">
              {withdrawalData.type?.replace("-", " ") || "Hardship Withdrawal"}
            </p>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Source Allocation</p>
            {withdrawalData.sources?.map((source, index) => (
              <div key={index} className="flex items-center justify-between py-1">
                <p className="text-gray-900 dark:text-white">{source.name}</p>
                <p className="font-medium text-gray-900 dark:text-white">${source.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-gray-900 dark:text-white">Withdrawal Amount</p>
              <p className="font-semibold text-gray-900 dark:text-white">${amount.toLocaleString()}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-gray-900 dark:text-white">Federal Tax Withholding (20%)</p>
              <p className="font-semibold text-red-600 dark:text-red-400">-${federalTax.toLocaleString()}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-gray-900 dark:text-white">State Tax Withholding (5%)</p>
              <p className="font-semibold text-red-600 dark:text-red-400">-${stateTax.toLocaleString()}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-gray-900 dark:text-white">Early Withdrawal Penalty (10%)</p>
              <p className="font-semibold text-red-600 dark:text-red-400">-${earlyPenalty.toLocaleString()}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-gray-900 dark:text-white">Fees</p>
              <p className="font-semibold text-red-600 dark:text-red-400">-${fees}</p>
            </div>
          </div>

          <Separator className="border-gray-300 dark:border-gray-600" />

          <div className="flex items-center justify-between py-2">
            <p className="font-semibold text-gray-900 dark:text-white text-lg">Final Payout</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${finalPayout.toLocaleString()}
            </p>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Payment Method</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {withdrawalData.paymentMethod === "eft" 
                ? "Electronic Funds Transfer" 
                : "Mail Check"}
            </p>
            {withdrawalData.paymentMethod === "check" && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{withdrawalData.address}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Retirement Impact - Withdrawal permanently reduces savings */}
      <RetirementImpactWidget
        compact
        impactAmount={-Math.round(amount * 2.1)}
        impactLabel={`−$${Math.round(amount * 2.1).toLocaleString()} projected retirement impact`}
        estimatedValue={38420}
        onTrack={false}
      />

      <Card className="p-6">
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked === true)}
          />
          <div className="flex-1">
            <label
              htmlFor="terms"
              className="text-sm text-gray-900 dark:text-white cursor-pointer leading-relaxed"
            >
              I understand that this withdrawal will permanently reduce my retirement savings, 
              may be subject to taxes and penalties, and cannot be reversed once processed. 
              I have consulted with a financial advisor or understand the consequences of this withdrawal.
            </label>
          </div>
        </div>
      </Card>

      <div className="flex justify-between items-center" style={{ paddingTop: 16 }}>
        <button
          onClick={() => navigate("/transactions/withdrawal/payment")}
          className="flex min-h-[2.75rem] items-center gap-2 transition-all duration-200 cursor-pointer"
          style={{ background: "transparent", border: "var(--c-border)", color: "inherit", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!agreed || isSubmitting}
          className="btn-brand flex items-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Submitting..." : "Submit Withdrawal Request"}
        </button>
      </div>
    </div>
  );
}

export default WithdrawalReview

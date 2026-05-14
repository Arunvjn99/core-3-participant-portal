import { Checkbox } from "../../components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTransferFlow } from "./TransferFlowLayout";
import { ArrowRight } from "lucide-react";
import { FlowPageHeader, FlowCard, FlowCardTitle, FlowInfoBanner, FlowNavButtons, FlowSuccessState } from "../../components/FlowUI";

const COLORS = ["var(--chart-blue)", "var(--chart-purple, #8b5cf6)", "var(--chart-green)"];

function TransferReview() {
  const navigate = useNavigate();
  const { transferData } = useTransferFlow();
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const funds = transferData.funds || [];

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => { navigate("/transactions"); }, 2000);
    }, 1500);
  };

  if (submitted) {
    return <FlowSuccessState title="Transfer Request Submitted" description="Your fund transfer will be processed on the next trading day." />;
  }

  return (
    <div className="space-y-6">
      <FlowPageHeader title="Review and Submit" description="Review your portfolio changes before submitting." />

      <FlowCard delay={0.05}>
        <FlowCardTitle>Allocation Changes</FlowCardTitle>
        <div className="space-y-6">
          {funds.map((fund, index) => {
            const hasChanged = fund.newAllocation !== fund.currentAllocation;
            const change = fund.newAllocation - fund.currentAllocation;
            return (
              <div key={index}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="rounded-full" style={{ width: 12, height: 12, backgroundColor: COLORS[index] }} />
                  <p style={{ fontSize: 13, fontWeight: 600, color: "inherit" }}>{fund.name}</p>
                </div>
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex-1 flex items-center gap-2">
                    <span style={{ fontSize: 12, fontWeight: 500, color: "inherit" }}>Current</span>
                    <div className="flex-1 overflow-hidden" style={{ height: 6, borderRadius: 3, background: "var(--slider-track)" }}>
                      <div className="h-full" style={{ width: `${fund.currentAllocation}%`, backgroundColor: COLORS[index], opacity: 0.5, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "inherit", minWidth: 40 }}>{fund.currentAllocation}%</span>
                  </div>
                  <ArrowRight style={{ width: 16, height: 16, color: "inherit" }} />
                  <div className="flex-1 flex items-center gap-2">
                    <span style={{ fontSize: 12, fontWeight: 500, color: "inherit" }}>New</span>
                    <div className="flex-1 overflow-hidden" style={{ height: 6, borderRadius: 3, background: "var(--slider-track)" }}>
                      <div className="h-full" style={{ width: `${fund.newAllocation}%`, backgroundColor: COLORS[index], borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: hasChanged ? 700 : 600, color: hasChanged ? "var(--color-primary)" : "var(--text-primary)", minWidth: 40 }}>
                      {fund.newAllocation}%
                    </span>
                  </div>
                </div>
                {hasChanged && (
                  <p style={{ fontSize: 12, fontWeight: 700, color: change > 0 ? "var(--status-success)" : "var(--status-danger)" }}>
                    {change > 0 ? "+" : ""}{change}% change
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </FlowCard>

      <FlowInfoBanner variant="info">
        <h4 style={{ fontSize: 14, fontWeight: 700, color: "inherit", letterSpacing: "-0.3px", marginBottom: 8 }}>Processing Details</h4>
        <ul className="space-y-2">
          {[
            "Your rebalancing will be processed on the next trading day",
            "No fees or charges apply to portfolio rebalancing",
            "You will receive a confirmation email once processing is complete",
            "This change applies to future contributions and existing balance",
          ].map((text, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="rounded-full mt-1.5 flex-shrink-0" style={{ width: 6, height: 6, background: "var(--color-primary)" }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-primary)" }}>{text}</span>
            </li>
          ))}
        </ul>
      </FlowInfoBanner>

      <FlowCard delay={0.15}>
        <div className="flex items-start gap-3">
          <Checkbox id="terms" checked={agreed} onCheckedChange={(checked) => setAgreed(checked === true)} />
          <label htmlFor="terms" className="cursor-pointer leading-relaxed" style={{ fontSize: 13, fontWeight: 500, color: "inherit" }}>
            I understand that this rebalancing will change my investment allocation and
            that past performance does not guarantee future results. I have reviewed the
            risk level and expected returns associated with my new allocation.
          </label>
        </div>
      </FlowCard>

      <FlowNavButtons
        onBack={() => navigate("/transactions/transfer/impact")}
        onNext={handleSubmit}
        nextLabel="Submit Transfer Request"
        disabled={!agreed}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

export default TransferReview

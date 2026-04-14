import { useNavigate } from "react-router-dom";
import { useTransferFlow } from "./TransferFlowLayout";
import { TrendingUp, Shield, AlertTriangle } from "lucide-react";
import { FlowPageHeader, FlowCard, FlowCardTitle, FlowLabel, FlowValue, FlowInfoBanner, FlowNavButtons } from "../../components/FlowUI";
import RetirementImpactWidget from "../../components/RetirementImpactWidget";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981"];

function TransferImpact() {
  const navigate = useNavigate();
  const { transferData } = useTransferFlow();

  const funds = transferData.funds || [];

  const equityAllocation = (funds[0]?.newAllocation || 0) + (funds[1]?.newAllocation || 0);
  const currentRiskLevel = "Moderate";
  const newRiskLevel = equityAllocation > 70 ? "Moderate–High" : equityAllocation > 50 ? "Moderate" : "Conservative";

  return (
    <div className="space-y-6">
      <FlowPageHeader title="Portfolio Impact" description="Review how your new allocation affects your portfolio risk and expected returns." />

      {/* Risk Level Change */}
      <FlowCard delay={0.05}>
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center flex-shrink-0" style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)", color: "var(--brand-primary)" }}>
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <FlowCardTitle>Risk Level Analysis</FlowCardTitle>
            <div className="grid grid-cols-2 gap-4">
              <div><FlowLabel>Current Risk Level</FlowLabel><FlowValue>{currentRiskLevel}</FlowValue></div>
              <div>
                <FlowLabel>New Risk Level</FlowLabel>
                <p style={{ fontSize: 20, fontWeight: 800, color: newRiskLevel === currentRiskLevel ? "#1E293B" : "#2563EB", letterSpacing: "-0.3px" }}>
                  {newRiskLevel}
                </p>
              </div>
            </div>
            {newRiskLevel !== currentRiskLevel && (
              <div className="mt-4" style={{ padding: "12px 16px", background: "#EFF6FF", borderRadius: 10, border: "1px solid #BFDBFE" }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--brand-primary)" }}>
                  Your portfolio risk level will change from <span style={{ fontWeight: 700 }}>{currentRiskLevel}</span> to{" "}
                  <span style={{ fontWeight: 700 }}>{newRiskLevel}</span> based on your new allocation.
                </p>
              </div>
            )}
          </div>
        </div>
      </FlowCard>

      {/* Allocation Comparison */}
      <FlowCard delay={0.1}>
        <FlowCardTitle>Before vs After Comparison</FlowCardTitle>
        <div className="space-y-4">
          {funds.map((fund, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-full" style={{ width: 12, height: 12, backgroundColor: COLORS[index] }} />
                  <p style={{ fontSize: 13, fontWeight: 600, color: "inherit" }}>{fund.name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span style={{ fontSize: 13, fontWeight: 500, color: "inherit" }}>{fund.currentAllocation}%</span>
                  <span style={{ fontSize: 12, color: "inherit" }}>→</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: fund.newAllocation !== fund.currentAllocation ? "#2563EB" : "#1E293B" }}>
                    {fund.newAllocation}%
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 overflow-hidden" style={{ height: 6, borderRadius: 3, background: "var(--tx-track, #E2E8F0)" }}>
                  <div className="h-full" style={{ width: `${fund.currentAllocation}%`, backgroundColor: COLORS[index], opacity: 0.5, borderRadius: 3 }} />
                </div>
                <div className="flex-1 overflow-hidden" style={{ height: 6, borderRadius: 3, background: "var(--tx-track, #E2E8F0)" }}>
                  <div className="h-full" style={{ width: `${fund.newAllocation}%`, backgroundColor: COLORS[index], borderRadius: 3 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </FlowCard>

      {/* Expected Returns */}
      <FlowCard delay={0.15}>
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center flex-shrink-0" style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #F0FDF4, #DCFCE7)", color: "#10B981" }}>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <FlowCardTitle>Expected Returns</FlowCardTitle>
            <p className="leading-relaxed" style={{ fontSize: 13, fontWeight: 500, color: "inherit", marginBottom: 16 }}>
              Based on historical performance, your new allocation may result in:
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div><FlowLabel>Expected Annual Return</FlowLabel><FlowValue>7.2 - 9.5%</FlowValue></div>
              <div>
                <FlowLabel>Expected Volatility</FlowLabel>
                <FlowValue>{newRiskLevel === "Conservative" ? "Low" : newRiskLevel === "Moderate" ? "Medium" : "Medium-High"}</FlowValue>
              </div>
            </div>
          </div>
        </div>
      </FlowCard>

      {newRiskLevel === "Moderate–High" && (
        <FlowInfoBanner variant="warning">
          <div className="flex items-start gap-3">
            <AlertTriangle className="flex-shrink-0 mt-0.5" style={{ width: 20, height: 20, color: "#F59E0B" }} />
            <p className="leading-relaxed" style={{ fontSize: 13, fontWeight: 500, color: "#92400E" }}>
              <span style={{ fontWeight: 700 }}>Higher Risk Notice:</span> Your new allocation
              has a higher risk profile. While this may offer greater return potential, it
              also means increased volatility and potential for losses.
            </p>
          </div>
        </FlowInfoBanner>
      )}

      {/* Retirement Impact - Transfer reallocation effect */}
      <RetirementImpactWidget
        compact
        delay={0.2}
      />

      <FlowNavButtons
        onBack={() => navigate("/transactions/transfer/amount")}
        onNext={() => navigate("/transactions/transfer/review")}
        nextLabel="Continue to Review"
      />
    </div>
  );
}

export default TransferImpact

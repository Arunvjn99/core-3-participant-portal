import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useWithdrawalFlow } from "./WithdrawalFlowLayout";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { motion } from "framer-motion";
import { AlertTriangle, Info } from "lucide-react";
import { FlowPageHeader, FlowNavButtons, FlowInfoBanner } from "../../components/FlowUI";

function WithdrawalType() {
  const navigate = useNavigate();
  const { updateWithdrawalData } = useWithdrawalFlow();
  const [selectedType, setSelectedType] = useState("");

  const handleContinue = () => {
    updateWithdrawalData({ type: selectedType });
    navigate("/transactions/withdrawal/source");
  };

  const types = [
    { id: "hardship", label: "Hardship Withdrawal", description: "For immediate and heavy financial needs such as medical expenses, preventing eviction, or funeral expenses. Documentation required.", warning: "May be subject to 10% early withdrawal penalty if under age 59½", warningColor: "#B45309" },
    { id: "in-service", label: "In-Service Withdrawal", description: "Available for participants who have reached age 59½ while still employed. No early withdrawal penalty applies.", warning: "Only available if you are age 59½ or older", warningColor: "#1E40AF" },
    { id: "termination", label: "Termination Withdrawal", description: "Full or partial distribution available after separation from service. You may also choose to roll over funds to another plan or IRA.", warning: "Requires proof of separation from employment", warningColor: "#475569" },
    { id: "rmd", label: "Required Minimum Distribution (RMD)", description: "Mandatory distribution required by law beginning at age 73. Failure to take RMDs may result in a 25% excise tax on the shortfall.", warning: "Calculated based on your account balance and life expectancy", warningColor: "#059669" },
    { id: "one-time", label: "One-Time Withdrawal", description: "Standard withdrawal for any purpose. Taxes and penalties may apply depending on your age and account type.", warning: undefined, warningColor: "" },
    { id: "full-balance", label: "Full Balance Withdrawal", description: "Withdraw your entire vested account balance. This will close your retirement account with this plan.", warning: "Warning: This action cannot be undone", warningColor: "#B91C1C" },
  ];

  return (
    <div className="space-y-6">
      <FlowPageHeader title="Select Withdrawal Type" description="Select the type of withdrawal you want to make. Each type has different eligibility requirements and tax implications." />

      <RadioGroup value={selectedType} onValueChange={setSelectedType}>
        <div className="space-y-3">
          {types.map((type, idx) => {
            const isSelected = selectedType === type.id;
            return (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + idx * 0.04, duration: 0.3 }}
              >
                <label
                  htmlFor={type.id}
                  className="block transition-all duration-200 cursor-pointer"
                  style={{
                    padding: "20px 24px", borderRadius: 16,
                    border: isSelected ? "1.5px solid #2563EB" : "1.5px solid #E2E8F0",
                    background: isSelected ? "#EFF6FF" : "#fff",
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value={type.id} id={type.id} className="mt-0.5" />
                    <div className="flex-1">
                      <span style={{ fontSize: 14, fontWeight: 700, color: "inherit", display: "block" }}>
                        {type.label}
                      </span>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "inherit", marginTop: 6, lineHeight: "20px" }}>
                        {type.description}
                      </p>
                      {type.warning && (
                        <p className="flex items-center gap-1.5 mt-2" style={{ fontSize: 12, fontWeight: 600, color: type.warningColor }}>
                          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                          {type.warning}
                        </p>
                      )}
                    </div>
                  </div>
                </label>
              </motion.div>
            );
          })}
        </div>
      </RadioGroup>

      {selectedType === "rmd" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <FlowInfoBanner variant="success">
            <div className="flex items-start gap-2.5">
              <Info className="flex-shrink-0 mt-0.5" style={{ width: 16, height: 16, color: "#10B981" }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 4 }}>RMD Calculation</p>
                <p className="leading-relaxed" style={{ fontSize: 12, fontWeight: 500, color: "#166534" }}>
                  Your estimated RMD for 2026 is{" "}
                  <span style={{ fontWeight: 700 }}>$1,125</span> based on your
                  current account balance of $30,000 and the IRS Uniform
                  Lifetime Table. This amount must be distributed by December
                  31, 2026.
                </p>
              </div>
            </div>
          </FlowInfoBanner>
        </motion.div>
      )}

      <FlowNavButtons
        onBack={() => navigate("/transactions/withdrawal")}
        onNext={handleContinue}
        nextLabel="Continue to Source Selection"
        disabled={!selectedType}
      />
    </div>
  );
}

export default WithdrawalType

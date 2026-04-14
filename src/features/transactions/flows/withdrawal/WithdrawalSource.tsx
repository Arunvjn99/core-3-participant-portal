import { Card } from "../../components/ui/card";
import { Slider } from "../../components/ui/slider";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useWithdrawalFlow } from "./WithdrawalFlowLayout";
import { motion } from "framer-motion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger } from "../../components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Label } from "../../components/ui/label";
import { ChevronDown, Info, Settings2 } from "lucide-react";

function WithdrawalSource() {
  const navigate = useNavigate();
  const { updateWithdrawalData } = useWithdrawalFlow();

  // Contribution sources
  const [pretax, setPretax] = useState(2000);
  const [roth, setRoth] = useState(500);
  const [employer, setEmployer] = useState(0);
  const [aftertax, setAftertax] = useState(500);

  // Gross/Net election
  const [grossNetElection, setGrossNetElection] = useState("gross");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const maxPretax = 3500;
  const maxRoth = 1200;
  const maxEmployer = 2000;
  const maxAftertax = 800;

  const totalAmount = pretax + roth + employer + aftertax;

  const sources = [
    {
      label: "Pre-Tax Contributions",
      sublabel: "Traditional 401(k) deferrals",
      value: pretax,
      setValue: setPretax,
      max: maxPretax,
      color: "brand-bg",
      bgColor: "bg-blue-200",
      taxNote: "Subject to ordinary income tax" },
    {
      label: "Roth Contributions",
      sublabel: "After-tax Roth 401(k) deferrals",
      value: roth,
      setValue: setRoth,
      max: maxRoth,
      color: "bg-violet-600",
      bgColor: "bg-violet-200",
      taxNote: "Tax-free if qualified distribution" },
    {
      label: "Employer Contributions",
      sublabel: "Matching and profit sharing",
      value: employer,
      setValue: setEmployer,
      max: maxEmployer,
      color: "bg-emerald-600",
      bgColor: "bg-emerald-200",
      taxNote: "Subject to ordinary income tax" },
    {
      label: "After-Tax Contributions",
      sublabel: "Non-Roth after-tax deferrals",
      value: aftertax,
      setValue: setAftertax,
      max: maxAftertax,
      color: "bg-amber-600",
      bgColor: "bg-amber-200",
      taxNote: "Only earnings portion is taxable" },
  ];

  const handleContinue = () => {
    updateWithdrawalData({
      amount: totalAmount,
      sources: [
        { name: "Pre-Tax Contributions", amount: pretax },
        { name: "Roth Contributions", amount: roth },
        { name: "Employer Contributions", amount: employer },
        { name: "After-Tax Contributions", amount: aftertax },
      ].filter((s) => s.amount > 0) });
    navigate("/transactions/withdrawal/fees");
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "inherit", letterSpacing: "-0.5px", lineHeight: "34px", marginBottom: 8 }}>
          Select Withdrawal Source
        </h2>
        <p style={{ fontSize: 14, fontWeight: 500, color: "inherit", lineHeight: "22px" }}>
          Choose where your withdrawal funds should come from. Different sources
          have different tax implications.
        </p>
      </motion.div>

      {/* Total Summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
      >
        <div
          className="text-center"
          style={{ background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)", border: "1px solid #BFDBFE", borderRadius: 16, padding: "20px 24px" }}
        >
          <p style={{ fontSize: 12, fontWeight: 500, color: "inherit", marginBottom: 4 }}>
              Total Withdrawal Amount
            </p>
            <p style={{ fontSize: 32, fontWeight: 800, color: "inherit", letterSpacing: "-0.5px" }}>
              ${totalAmount.toLocaleString()}
            </p>
            <p style={{ fontSize: 11, fontWeight: 500, color: "inherit", marginTop: 4 }}>
              {grossNetElection === "gross" ? "Gross" : "Net"} amount
            </p>
        </div>
      </motion.div>

      {/* Contribution Sources */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
      >
        <div style={{ background: "transparent", borderRadius: 16, border: "1px solid var(--tx-border-light, #F1F5F9)", padding: "24px 28px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "inherit", letterSpacing: "-0.3px", marginBottom: 24 }}>
            Contribution Sources
          </h3>

          <div className="space-y-7">
            {sources.map((source, idx) => (
              <motion.div
                key={source.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 + idx * 0.05, duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {source.label}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {source.sublabel}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-gray-900">
                      ${source.value.toLocaleString()}
                    </span>
                    <p className="text-[10px] text-gray-400">
                      of ${source.max.toLocaleString()} available
                    </p>
                  </div>
                </div>
                <Slider
                  value={[source.value]}
                  onValueChange={(value) => source.setValue(value[0])}
                  min={0}
                  max={source.max}
                  step={100}
                  className="mb-2"
                />
                <div
                  className={`h-1.5 ${source.bgColor} rounded-full overflow-hidden`}
                >
                  <div
                    className={`h-full ${source.color} transition-all`}
                    style={{
                      width: `${(source.value / source.max) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  <Info className="w-2.5 h-2.5" />
                  {source.taxNote}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Advanced: Gross/Net Election (Expandable) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <Card className="rounded-2xl border-gray-100/80 overflow-hidden">
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <Settings2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Advanced Settings
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Gross vs Net election and other options
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    advancedOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-5 pb-5 border-t border-gray-100">
                <div className="pt-4">
                  <Label className="text-sm text-gray-700 mb-3 block">
                    Gross vs Net Election
                  </Label>
                  <RadioGroup
                    value={grossNetElection}
                    onValueChange={setGrossNetElection}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start space-x-3 p-3.5 border border-gray-200 rounded-xl hover:border-blue-200 transition-colors">
                        <RadioGroupItem value="gross" id="gross" />
                        <div className="flex-1">
                          <Label
                            htmlFor="gross"
                            className="text-sm cursor-pointer"
                          >
                            Gross Amount
                          </Label>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            The total amount withdrawn before taxes and fees
                            are deducted. You'll receive less than this
                            amount.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3.5 border border-gray-200 rounded-xl hover:border-blue-200 transition-colors">
                        <RadioGroupItem value="net" id="net" />
                        <div className="flex-1">
                          <Label
                            htmlFor="net"
                            className="text-sm cursor-pointer"
                          >
                            Net Amount
                          </Label>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            The amount you want to receive after taxes and
                            fees. A larger gross amount will be withdrawn to
                            cover deductions.
                          </p>
                        </div>
                      </div>
                    </div>
                  </RadioGroup>

                  {grossNetElection === "net" && (
                    <div className="mt-3 p-3 bg-blue-50/60 rounded-xl border border-blue-100/60">
                      <div className="flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-[11px] text-blue-700 leading-relaxed">
                          When choosing Net, a larger gross amount will be
                          withdrawn to ensure you receive exactly $
                          {totalAmount.toLocaleString()} after taxes and
                          fees are applied. Estimated gross:{" "}
                          <span className="font-semibold">
                            ${Math.round(totalAmount / 0.85).toLocaleString()}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </motion.div>

      <div className="flex justify-between items-center" style={{ paddingTop: 16 }}>
        <button
          onClick={() => navigate("/transactions/withdrawal/type")}
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer"
          style={{ background: "transparent", border: "var(--c-border)", color: "inherit", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={totalAmount === 0}
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "#2563EB", color: "#fff", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, border: "none", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}
        >
          Continue to Fees
        </button>
      </div>
    </div>
  );
}

export default WithdrawalSource

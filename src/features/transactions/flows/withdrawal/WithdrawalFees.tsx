import { Card } from "../../components/ui/card";
import { Slider } from "../../components/ui/slider";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useWithdrawalFlow } from "./WithdrawalFlowLayout";
import { Separator } from "../../components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger } from "../../components/ui/collapsible";
import { motion } from "framer-motion";
import {
  ChevronDown,
  Settings2,
  AlertTriangle,
  TrendingDown } from "lucide-react";

function WithdrawalFees() {
  const navigate = useNavigate();
  const { withdrawalData } = useWithdrawalFlow();

  const withdrawalAmount = withdrawalData.amount || 3000;
  const isEarlyWithdrawal = true; // Simplified: would check age

  // Tax settings
  const [federalWithholding, setFederalWithholding] = useState(20);
  const [stateWithholding, setStateWithholding] = useState(5);
  const [taxSettingsOpen, setTaxSettingsOpen] = useState(false);

  const federalTax = Math.round(withdrawalAmount * (federalWithholding / 100));
  const stateTax = Math.round(withdrawalAmount * (stateWithholding / 100));
  const earlyPenalty = isEarlyWithdrawal
    ? Math.round(withdrawalAmount * 0.1)
    : 0;
  const redemptionFee = 25;
  const totalDeductions = federalTax + stateTax + earlyPenalty + redemptionFee;
  const finalPayout = withdrawalAmount - totalDeductions;

  // Remaining retirement balance
  const currentBalance = 30000;
  const remainingBalance = currentBalance - withdrawalAmount;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "inherit", letterSpacing: "-0.5px", lineHeight: "34px", marginBottom: 8 }}>
          Tax Impact & Fees
        </h2>
        <p style={{ fontSize: 14, fontWeight: 500, color: "inherit", lineHeight: "22px" }}>
          Review the taxes, penalties, and fees that will be applied to your
          withdrawal.
        </p>
      </motion.div>

      {/* Fee Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
      >
        <div style={{ background: "transparent", borderRadius: 16, border: "1px solid var(--c-border-color)", padding: "24px 28px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "inherit", letterSpacing: "-0.3px", marginBottom: 24 }}>
            Withdrawal Breakdown
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Withdrawal Amount</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Total from selected sources
                </p>
              </div>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                ${withdrawalAmount.toLocaleString()}
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-900 dark:text-white">
                    Federal Tax Withholding ({federalWithholding}%)
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Mandatory minimum withholding
                  </p>
                </div>
                <p className="font-medium text-red-600 dark:text-red-400">
                  -${federalTax.toLocaleString()}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-900 dark:text-white">
                    State Tax Withholding ({stateWithholding}%)
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Based on your state of residence
                  </p>
                </div>
                <p className="font-medium text-red-600 dark:text-red-400">
                  -${stateTax.toLocaleString()}
                </p>
              </div>

              {isEarlyWithdrawal && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="text-gray-900 dark:text-white">
                        Early Withdrawal Penalty (10%)
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Under age 59½ penalty
                      </p>
                    </div>
                  </div>
                  <p className="font-medium text-red-600 dark:text-red-400">
                    -${earlyPenalty.toLocaleString()}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-900 dark:text-white">Redemption Fee</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Investment liquidation fee
                  </p>
                </div>
                <p className="font-medium text-red-600 dark:text-red-400">-${redemptionFee}</p>
              </div>
            </div>

            <Separator className="border-gray-300 dark:border-gray-600" />

            <div className="flex items-center justify-between py-3 bg-green-50 dark:bg-green-950/30 -mx-6 px-6 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-lg">
                  Final Payout
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Amount you will receive
                </p>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${finalPayout.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Impact Preview */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="p-5 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <TrendingDown className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Remaining Retirement Balance
              </h4>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-2xl font-semibold text-gray-900 dark:text-white">
                  ${remainingBalance.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  after withdrawal
                </span>
              </div>
              <div className="h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                <div
                  className="brand-progress h-full transition-all"
                  style={{
                    width: `${(remainingBalance / currentBalance) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                <span>$0</span>
                <span>
                  ${currentBalance.toLocaleString()} (current balance)
                </span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Advanced: Tax Withholding Settings (Expandable) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Collapsible open={taxSettingsOpen} onOpenChange={setTaxSettingsOpen}>
          <Card className="rounded-2xl border-gray-100 dark:border-gray-700/80 overflow-hidden">
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/30 text-violet-600">
                    <Settings2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      Tax Withholding Settings
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Adjust federal and state withholding percentages
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    taxSettingsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700 space-y-6">
                <div className="pt-4">
                  {/* Federal Withholding */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          Federal Withholding
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          Minimum 10% required
                        </p>
                      </div>
                      <span className="text-xl font-semibold text-gray-900 dark:text-white">
                        {federalWithholding}%
                      </span>
                    </div>
                    <Slider
                      value={[federalWithholding]}
                      onValueChange={(v) => setFederalWithholding(v[0])}
                      min={10}
                      max={37}
                      step={1}
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                      <span>10% min</span>
                      <span>37% max</span>
                    </div>
                  </div>

                  {/* State Withholding */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          State Withholding
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          Varies by state (NY shown)
                        </p>
                      </div>
                      <span className="text-xl font-semibold text-gray-900 dark:text-white">
                        {stateWithholding}%
                      </span>
                    </div>
                    <Slider
                      value={[stateWithholding]}
                      onValueChange={(v) => setStateWithholding(v[0])}
                      min={0}
                      max={13}
                      step={1}
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                      <span>0%</span>
                      <span>13% max</span>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </motion.div>

      {/* Tax Notice */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-200">
                <span className="font-semibold">Tax Notice:</span> This
                withholding may not cover all tax liabilities. You may owe
                additional taxes when you file your return. The early withdrawal
                penalty may be waived for certain qualifying hardship
                circumstances. Consult with a tax professional for personalized
                advice.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="flex justify-between items-center" style={{ paddingTop: 16 }}>
        <button
          onClick={() => navigate("/transactions/withdrawal/source")}
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer"
          style={{ background: "transparent", border: "var(--c-border)", color: "inherit", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}
        >
          Back
        </button>
        <button
          onClick={() => navigate("/transactions/withdrawal/payment")}
          className="btn-brand flex items-center gap-2 transition-all duration-200 cursor-pointer"
        >
          Continue to Payment Method
        </button>
      </div>
    </div>
  );
}

export default WithdrawalFees

import { Card } from "../../components/ui/card";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger } from "../../components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from "../../components/ui/select";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useWithdrawalFlow } from "./WithdrawalFlowLayout";
import { motion } from "framer-motion";
import { ChevronDown, Landmark, Info } from "lucide-react";

function WithdrawalPayment() {
  const navigate = useNavigate();
  const { updateWithdrawalData } = useWithdrawalFlow();
  const [paymentMethod, setPaymentMethod] = useState("eft");
  const [addressType, setAddressType] = useState("employee");
  const [customAddress, setCustomAddress] = useState("");

  // Bank account selection
  const [bankAccount, setBankAccount] = useState("chase-1234");
  const [bankDetailsOpen, setBankDetailsOpen] = useState(false);
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [newRoutingNumber, setNewRoutingNumber] = useState("");
  const [newAccountType, setNewAccountType] = useState("checking");

  const handleContinue = () => {
    updateWithdrawalData({
      paymentMethod,
      address:
        addressType === "custom"
          ? customAddress
          : "Employee Address on File" });
    navigate("/transactions/withdrawal/review");
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "inherit", letterSpacing: "-0.5px", lineHeight: "34px", marginBottom: 8 }}>
          Payment Method
        </h2>
        <p style={{ fontSize: 14, fontWeight: 500, color: "inherit", lineHeight: "22px" }}>
          Choose how you want to receive your withdrawal funds.
        </p>
      </motion.div>

      {/* Disbursement Method */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Disbursement Method
          </h3>

          <RadioGroup
            value={paymentMethod}
            onValueChange={setPaymentMethod}
          >
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <RadioGroupItem value="eft" id="eft" />
                <div className="flex-1">
                  <Label htmlFor="eft" className="font-medium cursor-pointer">
                    Electronic Funds Transfer (EFT)
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Funds typically arrive in 2-3 business days
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <RadioGroupItem value="check" id="check" />
                <div className="flex-1">
                  <Label
                    htmlFor="check"
                    className="font-medium cursor-pointer"
                  >
                    Mail Check
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Check will be mailed to your address (7-10 business days)
                  </p>
                </div>
              </div>
            </div>
          </RadioGroup>
        </Card>
      </motion.div>

      {/* Bank Account Selection (for EFT) */}
      {paymentMethod === "eft" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Bank Account</h3>
            <Select value={bankAccount} onValueChange={setBankAccount}>
              <SelectTrigger>
                <SelectValue placeholder="Select bank account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chase-1234">
                  Chase Bank - ****1234 (Checking)
                </SelectItem>
                <SelectItem value="bofa-5678">
                  Bank of America - ****5678 (Savings)
                </SelectItem>
                <SelectItem value="add-new">
                  + Add New Bank Account
                </SelectItem>
              </SelectContent>
            </Select>
          </Card>
        </motion.div>
      )}

      {/* New Bank Account (Expandable) */}
      {paymentMethod === "eft" && bankAccount === "add-new" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Collapsible
            open={bankDetailsOpen}
            onOpenChange={setBankDetailsOpen}
            defaultOpen={true}
          >
            <Card className="rounded-2xl border-gray-100/80 overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">
                        New Bank Account Details
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Account number, routing number, and type
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                      bankDetailsOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-5 pb-5 border-t border-gray-100 space-y-4">
                  <div className="pt-4">
                    <Label className="text-sm text-gray-700 mb-2 block">
                      Bank Account Number
                    </Label>
                    <Input
                      value={newAccountNumber}
                      onChange={(e) => setNewAccountNumber(e.target.value)}
                      placeholder="Enter account number"
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-700 mb-2 block">
                      Routing Number
                    </Label>
                    <Input
                      value={newRoutingNumber}
                      onChange={(e) => setNewRoutingNumber(e.target.value)}
                      placeholder="9-digit routing number"
                      maxLength={9}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-700 mb-2 block">
                      Account Type
                    </Label>
                    <Select
                      value={newAccountType}
                      onValueChange={setNewAccountType}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checking">Checking</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100/60">
                    <div className="flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-blue-700 leading-relaxed">
                        A micro-deposit verification may be required. Two
                        small deposits will be sent to your account within 1-2
                        business days for verification.
                      </p>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </motion.div>
      )}

      {/* Mailing Address (for Check) */}
      {paymentMethod === "check" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Mailing Address
            </h3>

            <RadioGroup
              value={addressType}
              onValueChange={setAddressType}
            >
              <div className="space-y-3 mb-4">
                <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <RadioGroupItem value="employee" id="employee" />
                  <div className="flex-1">
                    <Label
                      htmlFor="employee"
                      className="font-medium cursor-pointer"
                    >
                      Use Employee Address on File
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      123 Main Street, Apt 4B
                      <br />
                      New York, NY 10001
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label
                    htmlFor="custom"
                    className="font-medium cursor-pointer"
                  >
                    Use Custom Address
                  </Label>
                </div>
              </div>

              {addressType === "custom" && (
                <div className="space-y-3 pl-7">
                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      placeholder="Enter street address"
                      value={customAddress}
                      onChange={(e) => setCustomAddress(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input id="city" placeholder="City" />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input id="state" placeholder="State" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input id="zip" placeholder="ZIP Code" />
                  </div>
                </div>
              )}
            </RadioGroup>
          </Card>
        </motion.div>
      )}

      <div className="flex justify-between items-center" style={{ paddingTop: 16 }}>
        <button
          onClick={() => navigate("/transactions/withdrawal/fees")}
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer"
          style={{ background: "transparent", border: "1.5px solid #E2E8F0", color: "inherit", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={paymentMethod === "check" && addressType === "custom" && !customAddress}
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "#2563EB", color: "#fff", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, border: "none", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}
        >
          Continue to Review
        </button>
      </div>
    </div>
  );
}

export default WithdrawalPayment

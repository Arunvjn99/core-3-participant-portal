import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTransferFlow } from "./TransferFlowLayout";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  Shield,
  Globe,
  Landmark,
  Target } from "lucide-react";

interface DestinationFund {
  id: string;
  name: string;
  ticker: string;
  category: string;
  risk: "Low" | "Moderate" | "High";
  expenseRatio: string;
  ytdReturn: string;
  icon: React.ReactNode;
  selected: boolean;
}

function TransferDestination() {
  const navigate = useNavigate();
  const { updateTransferData: _updateTransferData } = useTransferFlow();

  const [funds, setFunds] = useState<DestinationFund[]>([
    {
      id: "lcef",
      name: "Large Cap Equity Fund",
      ticker: "LCEF",
      category: "US Equity",
      risk: "Moderate",
      expenseRatio: "0.04%",
      ytdReturn: "+12.4%",
      icon: <TrendingUp className="w-4 h-4" />,
      selected: false },
    {
      id: "igrf",
      name: "International Growth Fund",
      ticker: "IGRF",
      category: "International",
      risk: "High",
      expenseRatio: "0.12%",
      ytdReturn: "+8.7%",
      icon: <Globe className="w-4 h-4" />,
      selected: false },
    {
      id: "svbf",
      name: "Stable Value Bond Fund",
      ticker: "SVBF",
      category: "Fixed Income",
      risk: "Low",
      expenseRatio: "0.03%",
      ytdReturn: "+3.2%",
      icon: <Shield className="w-4 h-4" />,
      selected: false },
    {
      id: "td50",
      name: "Target Date 2050 Fund",
      ticker: "TD50",
      category: "Balanced",
      risk: "Moderate",
      expenseRatio: "0.08%",
      ytdReturn: "+9.1%",
      icon: <Target className="w-4 h-4" />,
      selected: false },
    {
      id: "scgf",
      name: "Small Cap Growth Fund",
      ticker: "SCGF",
      category: "US Equity",
      risk: "High",
      expenseRatio: "0.15%",
      ytdReturn: "+14.2%",
      icon: <TrendingUp className="w-4 h-4" />,
      selected: false },
    {
      id: "mmkt",
      name: "Money Market Fund",
      ticker: "MMKT",
      category: "Cash",
      risk: "Low",
      expenseRatio: "0.01%",
      ytdReturn: "+4.8%",
      icon: <Landmark className="w-4 h-4" />,
      selected: false },
  ]);

  const selectedFunds = funds.filter((f) => f.selected);

  const toggleFund = (id: string) => {
    setFunds((prev) =>
      prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f))
    );
  };

  const riskColors: Record<string, { bg: string; color: string; border: string }> =
    {
      Low: { bg: "#ECFDF5", color: "#059669", border: "#BBF7D0" },
      Moderate: { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
      High: { bg: "#FFFBEB", color: "#B45309", border: "#FED7AA" } };

  const handleContinue = () => {
    navigate("/transactions/transfer/amount");
  };

  return (
    <div className="space-y-6">
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
          Select Destination Funds
        </h2>
        <p
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "inherit",
            lineHeight: "22px" }}
        >
          Choose which investment funds you'd like to transfer money into.
        </p>
      </motion.div>

      {/* Selected Count */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
      >
        <div className="flex items-center justify-between px-1">
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "inherit" }}
          >
            {selectedFunds.length} fund
            {selectedFunds.length !== 1 ? "s" : ""} selected
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "inherit" }}
          >
            {funds.length} available
          </span>
        </div>
      </motion.div>

      {/* Fund Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {funds.map((fund, idx) => {
          const risk = riskColors[fund.risk];
          return (
            <motion.div
              key={fund.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + idx * 0.04, duration: 0.3 }}
            >
              <button
                onClick={() => toggleFund(fund.id)}
                className="relative w-full text-left transition-all duration-200 cursor-pointer"
                style={{
                  padding: "16px 20px",
                  borderRadius: 14,
                  border: fund.selected ? "1.5px solid #2563EB" : "1.5px solid #E2E8F0",
                  background: fund.selected ? "#EFF6FF" : "#fff" }}
              >
                {fund.selected && (
                  <CheckCircle2
                    className="absolute top-3 right-3"
                    style={{ width: 16, height: 16, color: "#2563EB" }}
                  />
                )}

                <div className="flex items-start gap-3">
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: fund.selected
                        ? "linear-gradient(135deg, #DBEAFE, #BFDBFE)"
                        : "#F8FAFC",
                      color: fund.selected ? "#2563EB" : "#64748B" }}
                  >
                    {fund.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "inherit",
                        marginBottom: 2 }}
                    >
                      {fund.name}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="font-mono"
                        style={{
                          fontSize: 10,
                          color: "inherit",
                          fontWeight: 500 }}
                      >
                        {fund.ticker}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: "inherit",
                          fontWeight: 500 }}
                      >
                        {fund.category}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: risk.bg,
                          color: risk.color,
                          border: `1px solid ${risk.border}` }}
                      >
                        {fund.risk}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#10B981" }}
                      >
                        {fund.ytdReturn} YTD
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: "inherit" }}
                      >
                        ER: {fund.expenseRatio}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      <div className="flex justify-between items-center" style={{ paddingTop: 16 }}>
        <button
          onClick={() => navigate("/transactions/transfer/source")}
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer"
          style={{
            background: "transparent",
            border: "1px solid #E2E8F0",
            color: "inherit",
            padding: "10px 16px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600 }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={selectedFunds.length === 0}
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
          Enter Amount
          <ArrowRight style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  );
}

export default TransferDestination

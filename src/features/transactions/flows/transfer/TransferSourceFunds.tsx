import { Checkbox } from "../../components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTransferFlow } from "./TransferFlowLayout";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"];

interface SourceFund {
  id: string;
  name: string;
  ticker: string;
  balance: number;
  allocation: number;
  ytdReturn: number;
  selected: boolean;
}

const availableFunds: SourceFund[] = [
  {
    id: "lcef",
    name: "Large Cap Equity Fund",
    ticker: "LCEF",
    balance: 12000,
    allocation: 40,
    ytdReturn: 12.4,
    selected: false },
  {
    id: "igrf",
    name: "International Growth Fund",
    ticker: "IGRF",
    balance: 7500,
    allocation: 25,
    ytdReturn: 8.7,
    selected: false },
  {
    id: "svbf",
    name: "Stable Value Bond Fund",
    ticker: "SVBF",
    balance: 6000,
    allocation: 20,
    ytdReturn: 3.2,
    selected: false },
  {
    id: "td50",
    name: "Target Date 2050 Fund",
    ticker: "TD50",
    balance: 4500,
    allocation: 15,
    ytdReturn: 9.1,
    selected: false },
];

function TransferSourceFunds() {
  const navigate = useNavigate();
  const { updateTransferData } = useTransferFlow();
  const [funds, setFunds] = useState(availableFunds);

  const selectedFunds = funds.filter((f) => f.selected);
  const totalSelected = selectedFunds.reduce((s, f) => s + f.balance, 0);

  const toggleFund = (id: string) => {
    setFunds((prev) =>
      prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f))
    );
  };

  const handleContinue = () => {
    const transferFunds = selectedFunds.map((f) => ({
      name: f.name,
      currentAllocation: f.allocation,
      newAllocation: f.allocation }));
    updateTransferData({ funds: transferFunds });
    navigate("/transactions/transfer/destination");
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "inherit", letterSpacing: "-0.5px", lineHeight: "34px", marginBottom: 8 }}>
          Select Source Funds
        </h2>
        <p style={{ fontSize: 14, fontWeight: 500, color: "inherit", lineHeight: "22px" }}>
          Choose which investment funds you'd like to transfer money from.
        </p>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
      >
        <div style={{ background: "transparent", borderRadius: 16, border: "1px solid var(--tx-border-light, #F1F5F9)", padding: "20px 24px" }}>
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: "inherit", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>Selected for Transfer</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: "inherit", letterSpacing: "-0.3px" }}>
                {selectedFunds.length} fund{selectedFunds.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="text-right">
              <p style={{ fontSize: 11, fontWeight: 600, color: "inherit", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>Available Balance</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: "inherit", letterSpacing: "-0.3px" }}>
                ${totalSelected.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Fund List */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
      >
        <div style={{ background: "transparent", borderRadius: 16, border: "1px solid var(--tx-border-light, #F1F5F9)", padding: "24px 28px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "inherit", letterSpacing: "-0.3px", marginBottom: 20 }}>
            Your Investment Funds
          </h3>

          <div className="space-y-3">
            {funds.map((fund, idx) => (
              <motion.div
                key={fund.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 + idx * 0.06, duration: 0.3 }}
                onClick={() => toggleFund(fund.id)}
                className="flex items-center gap-4 transition-all duration-200 cursor-pointer"
                style={{
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: fund.selected ? "1.5px solid #2563EB" : "1.5px solid #E2E8F0",
                  background: fund.selected ? "#EFF6FF" : "#fff" }}
              >
                <Checkbox
                  checked={fund.selected}
                  onCheckedChange={() => toggleFund(fund.id)}
                />

                <div
                  className="rounded-full flex-shrink-0"
                  style={{ width: 12, height: 12, backgroundColor: COLORS[idx] }}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p style={{ fontSize: 13, fontWeight: 600, color: "inherit" }}>
                      {fund.name}
                    </p>
                    <span className="font-mono" style={{ fontSize: 10, color: "inherit", fontWeight: 500 }}>
                      {fund.ticker}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span style={{ fontSize: 11, fontWeight: 500, color: "inherit" }}>
                      {fund.allocation}% of portfolio
                    </span>
                    <span className="flex items-center gap-0.5" style={{ fontSize: 11, fontWeight: 700, color: "#10B981" }}>
                      {fund.ytdReturn > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : fund.ytdReturn < 0 ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      )}
                      {fund.ytdReturn > 0 ? "+" : ""}
                      {fund.ytdReturn}% YTD
                    </span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p style={{ fontSize: 14, fontWeight: 700, color: "inherit" }}>
                    ${fund.balance.toLocaleString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="flex justify-between items-center" style={{ paddingTop: 16 }}>
        <button
          onClick={() => navigate("/transactions/transfer")}
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer"
          style={{ background: "transparent", border: "1.5px solid #E2E8F0", color: "inherit", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={selectedFunds.length === 0}
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "#2563EB", color: "#fff", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, border: "none", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}
        >
          Select Destination
          <ArrowRight style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  );
}

export default TransferSourceFunds

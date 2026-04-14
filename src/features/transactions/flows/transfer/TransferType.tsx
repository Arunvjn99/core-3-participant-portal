import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTransferFlow } from "./TransferFlowLayout";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  CalendarClock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Info } from "lucide-react";

function TransferType() {
  const navigate = useNavigate();
  const { updateTransferData } = useTransferFlow();
  const [transferType, setTransferType] = useState<string>("");

  const types = [
    {
      id: "existing",
      icon: <ArrowLeftRight className="w-6 h-6" />,
      title: "Transfer Existing Balance",
      description:
        "Move money between your current investment funds. Trades execute at market close.",
      details: [
        "Reallocate existing investments",
        "No fees or penalties",
        "Executed at next market close",
      ],
      color: "blue" },
    {
      id: "future",
      icon: <CalendarClock className="w-6 h-6" />,
      title: "Transfer Future Contributions",
      description:
        "Change how your future paycheck contributions are invested across funds.",
      details: [
        "Applies to all future contributions",
        "Takes effect next pay period",
        "Doesn't affect existing balance",
      ],
      color: "indigo" },
  ];

  const handleContinue = () => {
    updateTransferData({ transferType } as any);
    navigate("/transactions/transfer/source");
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "inherit", letterSpacing: "-0.5px", lineHeight: "34px", marginBottom: 8 }}>
          Select Transfer Type
        </h2>
        <p style={{ fontSize: 14, fontWeight: 500, color: "inherit", lineHeight: "22px" }}>
          Choose whether to transfer existing investments or redirect future
          contributions.
        </p>
      </motion.div>

      <div className="space-y-4">
        {types.map((type, idx) => {
          const isSelected = transferType === type.id;

          return (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + idx * 0.06, duration: 0.3 }}
            >
              <button
                onClick={() => setTransferType(type.id)}
                className="relative w-full text-left transition-all duration-200 cursor-pointer"
                style={{
                  padding: "24px 28px",
                  borderRadius: 16,
                  border: isSelected ? "1.5px solid #2563EB" : "1.5px solid #E2E8F0",
                  background: isSelected ? "#EFF6FF" : "#fff" }}
              >
                {isSelected && (
                  <CheckCircle2 className="absolute top-5 right-5" style={{ width: 20, height: 20, color: "var(--brand-primary)" }} />
                )}

                <div className="flex items-start gap-4">
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: isSelected ? "linear-gradient(135deg, #DBEAFE, #BFDBFE)" : "#F8FAFC",
                      color: isSelected ? "#2563EB" : "#64748B" }}
                  >
                    {type.icon}
                  </div>

                  <div className="flex-1">
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "inherit", letterSpacing: "-0.3px", marginBottom: 4 }}>
                      {type.title}
                    </h3>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "inherit", marginBottom: 12, lineHeight: "20px" }}>
                      {type.description}
                    </p>

                    <div className="space-y-1.5">
                      {type.details.map((detail, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span
                            className="rounded-full flex-shrink-0"
                            style={{ width: 6, height: 6, background: isSelected ? "var(--brand-primary)" : "var(--c-text-faint)" }}
                          />
                          <span style={{ fontSize: 12, fontWeight: 500, color: "inherit" }}>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      >
        <div
          className="flex items-start gap-3"
          style={{ background: "var(--c-blue-tint)", border: "1px solid var(--c-border-blue)", borderRadius: 14, padding: "14px 16px" }}
        >
          <Info className="flex-shrink-0 mt-0.5" style={{ width: 16, height: 16, color: "var(--brand-primary)" }} />
          <p className="leading-relaxed" style={{ fontSize: 12, fontWeight: 500, color: "var(--brand-primary)" }}>
            Transfers within your 401(k) plan are tax-free and have no
            impact on your contribution limits. If you want to change both
            existing balance and future contributions, you'll need to
            initiate two separate transfers.
          </p>
        </div>
      </motion.div>

      <div className="flex justify-between items-center" style={{ paddingTop: 16 }}>
        <button
          onClick={() => navigate("/transactions")}
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer"
          style={{ background: "transparent", border: "var(--c-border)", color: "inherit", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Cancel
        </button>
        <button
          onClick={handleContinue}
          disabled={!transferType}
          className="btn-brand flex items-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <ArrowRight style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  );
}

export default TransferType

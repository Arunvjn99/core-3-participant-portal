import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import React from "react";

/* Reusable design-token styled components for flow pages */

function FlowPageHeader({ title, description }: { title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <h2 className="text-slate-900 dark:text-white" style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", lineHeight: "34px", marginBottom: 8 }}>
        {title}
      </h2>
      <p className="text-slate-600 dark:text-gray-300" style={{ fontSize: 14, fontWeight: 500, lineHeight: "22px" }}>
        {description}
      </p>
    </motion.div>
  );
}

function FlowCard({ children, padding = "24px 28px", delay = 0 }: { children: React.ReactNode; padding?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
    >
      <div className="bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-700" style={{ borderRadius: 16, padding }}>
        {children}
      </div>
    </motion.div>
  );
}

function FlowCardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-slate-900 dark:text-white" style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.3px", marginBottom: 20 }}>
      {children}
    </h3>
  );
}

function FlowLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-slate-500 dark:text-gray-400" style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{children}</p>
  );
}

function FlowValue({ children, size = 20 }: { children: React.ReactNode; size?: number }) {
  return (
    <p className="text-slate-900 dark:text-white" style={{ fontSize: size, fontWeight: 800, letterSpacing: "-0.3px" }}>{children}</p>
  );
}

function FlowInfoBanner({ children, variant = "info" }: { children: React.ReactNode; variant?: "info" | "warning" | "error" | "success" }) {
  const cls = {
    info:    "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-blue-900 dark:text-blue-200",
    warning: "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200",
    error:   "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-red-900 dark:text-red-200",
    success: "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/40 text-green-900 dark:text-green-200",
  }[variant];
  return (
    <div className={`rounded-xl p-4 ${cls}`}>
      {children}
    </div>
  );
}

function FlowNavButtons({
  backLabel = "Back",
  nextLabel,
  onBack,
  onNext,
  disabled = false,
  isSubmitting = false,
}: {
  backLabel?: string;
  nextLabel: string;
  onBack: () => void;
  onNext: () => void;
  disabled?: boolean;
  isSubmitting?: boolean;
}) {
  return (
    <div className="flex justify-between items-center" style={{ paddingTop: 16 }}>
      <button
        onClick={onBack}
        className="flex items-center gap-2 transition-all duration-200 cursor-pointer bg-white dark:bg-gray-900 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-800"
        style={{ padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}
      >
        <ArrowLeft style={{ width: 16, height: 16 }} />
        {backLabel}
      </button>
      <button
        onClick={onNext}
        disabled={disabled || isSubmitting}
        className="btn-brand flex items-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, border: "none", boxShadow: "0 4px 12px var(--brand-primary-ring)" }}
      >
        {isSubmitting ? "Submitting..." : nextLabel}
        {!isSubmitting && <ArrowRight style={{ width: 16, height: 16 }} />}
      </button>
    </div>
  );
}

function FlowSuccessState({ title, description }: { title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-16"
    >
      <div className="flex items-center justify-center mb-5 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/40 rounded-full"
           style={{ width: 64, height: 64 }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h2 className="text-slate-900 dark:text-white" style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 8 }}>
        {title}
      </h2>
      <p className="text-slate-600 dark:text-gray-300" style={{ fontSize: 14, fontWeight: 500, textAlign: "center", maxWidth: 400, marginBottom: 24, lineHeight: "22px" }}>
        {description}
      </p>
      <p className="text-slate-400 dark:text-gray-500" style={{ fontSize: 12, fontWeight: 500 }}>Redirecting to dashboard...</p>
    </motion.div>
  );
}
export { FlowPageHeader, FlowCard, FlowCardTitle, FlowLabel, FlowValue, FlowInfoBanner, FlowNavButtons, FlowSuccessState }

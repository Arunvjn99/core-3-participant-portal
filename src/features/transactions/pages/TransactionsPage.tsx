import {
  DollarSign,
  HandCoins,
  ArrowLeftRight,
  PieChart,
  RefreshCcw,
  AlertTriangle,
  ChartBar,
  Sparkles,
  FilePen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AttentionRequiredTimeline from "../components/AttentionRequiredTimeline";
import QuickActionButton from "../components/QuickActionButton";
import FinancialGuidanceCompact from "../components/FinancialGuidanceCompact";
import RecentTransactionsCompact from "../components/RecentTransactionsCompact";
import DraftTransactions from "../components/DraftTransactions";
import RetirementImpactWidget from "../components/RetirementImpactWidget";
import svgPaths from "../svgPaths";
import { motion } from "framer-motion";
function SectionHeader({
  icon,
  title,
  subtitle,
  badge,
  variant = "default" }: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: { text: string; color: string };
  variant?: "default" | "ai";
}) {
  return (
    <div className="flex items-center gap-2.5 mb-5 sm:mb-6">
      <div
        className={
          variant === "ai"
            ? "text-purple-600 dark:text-purple-400"
            : "brand-text"
        }
      >
        {icon}
      </div>
      <div className="flex items-center gap-2.5 flex-wrap">
        <h2 className="text-[15px] sm:text-[16px] font-bold text-slate-900 dark:text-white tracking-[-0.3px]">
          {title}
        </h2>
        {badge && (
          <span
            className={`text-[11px] font-bold px-2.5 py-[3px] rounded-[6px] ${badge.color}`}
          >
            {badge.text}
          </span>
        )}
      </div>
      {subtitle && (
        <span className="text-[12px] text-slate-400 dark:text-gray-500 ml-auto hidden sm:block font-medium">
          {subtitle}
        </span>
      )}
    </div>
  );
}

/* Inline SVG icons matching the Figma import */
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className || "w-5 h-5"}
      fill="none"
      viewBox="0 0 15 18.34"
    >
      <path
        d={svgPaths.p30439e00}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.667"
      />
    </svg>
  );
}

function ChartBarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className || "w-5 h-5"}
      fill="none"
      viewBox="0 0 20 20"
    >
      <path
        d={svgPaths.p284f7580}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.667"
      />
      <path
        d="M7.833 14.167H15"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.667"
      />
      <path
        d="M7.833 10.833H18.333"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.667"
      />
      <path
        d="M7.833 7.5H10.833"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.667"
      />
    </svg>
  );
}

function TransactionsPage() {
  const navigate = useNavigate();

  const handleResolveIssue = () => {
    navigate("/transactions/loan/documents");
  };

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-gray-950 dark:bg-gray-950 transactions-page"
      data-page="transactions"
    >

      {/* Main Container */}
      <div
        className="max-w-[1200px] mx-auto px-6 sm:px-12 pt-8 pb-[100px]"
      >
        {/* ROW 1 - PLAN OVERVIEW */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-5 sm:mb-6"
        >
          <div
            className="overflow-hidden"
            style={{
              background: "var(--c-blue-tint)",
              border: "1px solid var(--c-border-blue)",
              borderRadius: 16,
              padding: "24px 28px" }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-0">
              {/* Plan Name + Balance */}
              <div className="flex items-center gap-4">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "var(--c-card)",
                    border: "1px solid var(--c-border-blue)" }}
                >
                  <ShieldIcon className="w-5 h-5 brand-text" />
                </div>
                <div>
                  <p
                    className="uppercase"
                    style={{
                      fontSize: 10.5,
                      color: "var(--c-text-muted)",
                      letterSpacing: "0.5px",
                      fontWeight: 700,
                      lineHeight: "14px" }}
                  >
                    Plan Name
                  </p>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: "var(--c-text-primary)",
                      letterSpacing: "-0.3px",
                      lineHeight: "22px",
                      marginTop: 2 }}
                  >
                    401(k) Retirement Plan
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span
                      className="uppercase"
                      style={{
                        fontSize: 10,
                        color: "var(--c-text-faint)",
                        letterSpacing: "0.5px",
                        fontWeight: 600 }}
                    >
                      Plan Balance :
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "var(--brand-primary)",
                        letterSpacing: "-0.3px" }}
                    >
                      $30,000
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div
                className="hidden sm:block mx-10 lg:mx-14"
                style={{ width: 1, height: 56, background: "color-mix(in srgb, var(--brand-primary) 30%, transparent)" }}
              />
              <div
                className="sm:hidden"
                style={{ height: 1, background: "color-mix(in srgb, var(--brand-primary) 30%, transparent)" }}
              />

              {/* Vested Balance */}
              <div className="flex items-center gap-4">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "var(--c-card)",
                    border: "1px solid var(--c-border-blue)" }}
                >
                  <ChartBarIcon className="w-5 h-5 brand-text" />
                </div>
                <div>
                  <p
                    className="uppercase"
                    style={{
                      fontSize: 10.5,
                      color: "var(--c-text-muted)",
                      letterSpacing: "0.5px",
                      fontWeight: 700,
                      lineHeight: "14px" }}
                  >
                    Vested Balance
                  </p>
                  <div className="flex items-baseline gap-2.5" style={{ marginTop: 2 }}>
                    <span
                      style={{
                        fontSize: 28,
                        fontWeight: 800,
                        color: "var(--c-text-primary)",
                        letterSpacing: "-0.5px",
                        lineHeight: "36px" }}
                    >
                      $25,000
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--c-text-muted)",
                        fontWeight: 600 }}
                    >
                      83.3% vested
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ROW 2 - QUICK ACTIONS */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.08 }}
          className="mb-5 sm:mb-6"
        >
          <SectionHeader
            icon={<Sparkles className="w-4 h-4" />}
            title="Quick Actions"
            subtitle="Start a new transaction"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2">
            <QuickActionButton
              icon={<HandCoins className="w-4 h-4" />}
              title="Take a Loan"
              contextInfo="Borrow up to $10,000"
              additionalInfo="Typical approval: 1-3 days"
              onClick={() => navigate("/transactions/loan")}
            />
            <QuickActionButton
              icon={<DollarSign className="w-4 h-4" />}
              title="Withdraw Money"
              contextInfo="Available: $5,000"
              additionalInfo="Tax impact: 10-20%"
              onClick={() => navigate("/transactions/withdrawal")}
            />
            <QuickActionButton
              icon={<ArrowLeftRight className="w-4 h-4" />}
              title="Transfer Funds"
              contextInfo="Reallocate balance"
              additionalInfo="No fees or penalties"
              onClick={() => navigate("/transactions/transfer")}
            />
            <QuickActionButton
              icon={<PieChart className="w-4 h-4" />}
              title="Rebalance"
              contextInfo="Current: Moderate risk"
              additionalInfo="Last: 6 months ago"
              onClick={() => navigate("/transactions/rebalance")}
            />
            <QuickActionButton
              icon={<RefreshCcw className="w-4 h-4" />}
              title="Roll Over"
              contextInfo="Consolidate savings"
              additionalInfo="No tax penalty"
              onClick={() => navigate("/transactions/rollover")}
            />
          </div>
        </motion.div>

        {/* ROW 3 - ATTENTION REQUIRED + DRAFT TRANSACTIONS (side by side) */}
        <div className="flex flex-col md:flex-row gap-5 sm:gap-6 mb-5 sm:mb-6">
          {/* Left: Attention Required (60%) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.16 }}
            className="w-full md:w-[60%]"
          >
            <SectionHeader
              icon={<AlertTriangle className="w-4 h-4" />}
              title="Attention Required"
              badge={{
                text: "4 items",
                color: "bg-[#FFFBEB] text-[#B45309]" }}
            />
            <AttentionRequiredTimeline onResolve={handleResolveIssue} />
          </motion.div>

          {/* Right: Draft Transactions (40%) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.24 }}
            className="w-full md:w-[40%]"
          >
            <SectionHeader
              icon={<FilePen className="w-4 h-4" />}
              title="Draft Transactions"
              badge={{
                text: "2 drafts",
                color: "bg-[#EFF6FF] brand-text" }}
              subtitle="Resume where you left off"
            />
            <div
              style={{
                background: "var(--c-card)",
                borderRadius: 16,
                border: "var(--c-border-subtle)",
                padding: "20px 24px" }}
            >
              <DraftTransactions />
            </div>
          </motion.div>
        </div>

        {/* ROW 5 - RECENT TRANSACTIONS + RETIREMENT IMPACT */}
        <div className="flex flex-col md:flex-row gap-5 sm:gap-6 mb-5 sm:mb-6">
          {/* Left: Recent Transactions (60%) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.32 }}
            className="w-full md:w-[60%]"
          >
            <SectionHeader
              icon={<ChartBar className="w-4 h-4" />}
              title="Recent Transactions"
              subtitle="Last 90 days"
            />
            <div
              style={{
                background: "var(--c-card)",
                borderRadius: 16,
                border: "var(--c-border-subtle)",
                padding: "24px 28px" }}
            >
              <RecentTransactionsCompact maxItems={4} />
            </div>
          </motion.div>

          {/* Right: Retirement Impact Widget (40%) */}
          <div className="w-full md:w-[40%]">
            <SectionHeader
              icon={<ChartBar className="w-4 h-4" />}
              title="Retirement Outlook"
              subtitle="Projected growth"
            />
            <RetirementImpactWidget delay={0.36} />
          </div>
        </div>

        {/* ROW 6 - FINANCIAL GUIDANCE (AI Insights - Purple) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
          className="mb-6 sm:mb-8"
        >
          <SectionHeader
            icon={<Sparkles className="w-4 h-4" />}
            title="Financial Guidance"
            subtitle="Personalized insights"
            variant="ai"
            badge={{
              text: "AI Insights",
              color: "bg-[#F5F3FF] text-purple-600 dark:text-purple-400" }}
          />
          <FinancialGuidanceCompact />
        </motion.div>
      </div>
    </div>
  );
}

export default TransactionsPage

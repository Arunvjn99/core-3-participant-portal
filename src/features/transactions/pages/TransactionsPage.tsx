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
import svgPaths from "../svgPaths";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

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
        <h2 className="text-[17px] sm:text-[18px] font-bold text-slate-900 dark:text-white tracking-[-0.3px]">
          {title}
        </h2>
        {badge && (
          <span
            className={`text-[12px] font-bold px-2.5 py-[3px] rounded-[6px] ${badge.color}`}
          >
            {badge.text}
          </span>
        )}
      </div>
      {subtitle && (
        <span className="text-[13px] text-slate-400 dark:text-gray-500 ml-auto hidden sm:block font-medium">
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
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleResolveIssue = () => {
    navigate("/transactions/loan/documents");
  };

  return (
    <div className="min-h-screen transactions-page" data-page="transactions">

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
            className="w-full overflow-hidden rounded-[14px] border border-[var(--border-blue)] bg-[var(--status-info-bg)] px-6 py-5 shadow-[var(--shadow-subtle)]"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-0">
              {/* Left: plan info */}
              <div className="min-w-0 flex-1 sm:pr-6">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)] dark:text-[var(--text-muted)]">
                  {t("transactions.plan_name_label")}
                </p>
                <div className="flex items-center gap-2">
                  <ShieldIcon className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                  <p className="text-[16px] font-bold leading-snug text-[var(--text-primary)]">
                    {t("transactions.plan_default_name")}
                  </p>
                </div>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)] dark:text-[var(--text-muted)]">
                  {t("transactions.plan_balance_label")}
                </p>
                <p className="mt-0.5 text-[24px] font-bold leading-tight tracking-tight text-[var(--color-primary)]">
                  $30,000
                </p>
              </div>

              <div
                className="hidden w-px shrink-0 self-stretch bg-[var(--border-blue)] sm:mx-6 sm:block"
                aria-hidden
              />
              <div
                className="h-px w-full shrink-0 bg-[var(--border-blue)] sm:hidden"
                aria-hidden
              />

              {/* Right: vested */}
              <div className="min-w-0 flex-1 sm:pl-0">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)] dark:text-[var(--text-muted)]">
                  {t("transactions.vested_balance_label")}
                </p>
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                  <p className="text-[24px] font-bold leading-tight tracking-tight text-[var(--text-primary)]">
                    $25,000
                  </p>
                </div>
                <div
                  className="mt-2 h-[5px] w-full overflow-hidden rounded-[3px] bg-[var(--border-blue)]"
                  role="presentation"
                >
                  <div
                    className="h-full rounded-[3px] bg-[var(--color-primary)]"
                    style={{ width: "83.3%" }}
                  />
                </div>
                <p className="mt-[5px] text-[13px] font-medium leading-snug text-[var(--text-secondary)] dark:text-[var(--text-muted)]">
                  {t("transactions.vested_percent", { pct: "83.3" })}
                </p>
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
            title={t("transactions.quick_actions")}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2">
            <QuickActionButton
              icon={<HandCoins className="w-4 h-4" />}
              title={t("dashboard.takeLoan")}
              contextInfo={t("transactions.qa_loan_sub")}
              additionalInfo={t("transactions.qa_loan_hint")}
              onClick={() => navigate("/transactions/loan")}
            />
            <QuickActionButton
              icon={<DollarSign className="w-4 h-4" />}
              title={t("dashboard.withdrawMoney")}
              contextInfo={t("transactions.qa_withdraw_sub")}
              additionalInfo={t("transactions.qa_withdraw_hint")}
              onClick={() => navigate("/transactions/withdrawal")}
            />
            <QuickActionButton
              icon={<ArrowLeftRight className="w-4 h-4" />}
              title={t("dashboard.transferFunds")}
              contextInfo={t("transactions.qa_transfer_sub")}
              additionalInfo={t("transactions.qa_transfer_hint")}
              onClick={() => navigate("/transactions/transfer")}
            />
            <QuickActionButton
              icon={<PieChart className="w-4 h-4" />}
              title={t("transactions.rebalance")}
              contextInfo={t("transactions.qa_rebalance_sub")}
              additionalInfo={t("transactions.qa_rebalance_hint")}
              onClick={() => navigate("/transactions/rebalance")}
            />
            <QuickActionButton
              icon={<RefreshCcw className="w-4 h-4" />}
              title={t("dashboard.rollOver")}
              contextInfo={t("transactions.qa_rollover_sub")}
              additionalInfo={t("transactions.qa_rollover_hint")}
              onClick={() => navigate("/transactions/rollover")}
            />
          </div>
        </motion.div>

        {/* ROW 3 - DRAFT TRANSACTIONS (left) + ATTENTION REQUIRED (right) */}
        <div className="flex flex-col md:flex-row gap-5 sm:gap-6 mb-5 sm:mb-6">
          {/* Left: Draft Transactions (60%) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.16 }}
            className="w-full md:w-[60%]"
          >
            <SectionHeader
              icon={<FilePen className="w-4 h-4" />}
              title={t("transactions.draft_transactions")}
              badge={{
                text: t("transactions.drafts_badge", { count: 2 }),
                color: "bg-[var(--status-info-bg)] dark:bg-blue-950/30 brand-text" }}
              subtitle={t("transactions.resume_subtitle")}
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

          {/* Right: Attention Required (40%) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.24 }}
            className="w-full md:w-[40%]"
          >
            <SectionHeader
              icon={<AlertTriangle className="w-4 h-4" />}
              title={t("transactions.attention_required")}
              badge={{
                text: t("transactions.items_badge", { count: 2 }),
                color: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300" }}
            />
            <AttentionRequiredTimeline onResolve={handleResolveIssue} />
          </motion.div>
        </div>

        {/* ROW 5 - RECENT TRANSACTIONS */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.32 }}
          className="mb-5 sm:mb-6"
        >
          <SectionHeader
            icon={<ChartBar className="w-4 h-4" />}
            title={t("transactions.recent_transactions")}
            subtitle={t("transactions.last_90_days")}
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

        {/* ROW 6 - FINANCIAL GUIDANCE (AI Insights - Purple) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
          className="mb-6 sm:mb-8"
        >
          <SectionHeader
            icon={<Sparkles className="w-4 h-4" />}
            title={t("transactions.financial_guidance")}
            subtitle={t("transactions.personalized_insights")}
            variant="ai"
            badge={{
              text: t("transactions.ai_insights"),
              color: "bg-[var(--color-primary-light)] dark:bg-violet-950/30 text-purple-600 dark:text-purple-400" }}
          />
          <FinancialGuidanceCompact />
        </motion.div>
      </div>
    </div>
  );
}

export default TransactionsPage

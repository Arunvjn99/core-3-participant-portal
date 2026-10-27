import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useRebalanceFlow } from "./RebalanceFlowLayout";
import { FlowPageHeader, FlowCard, FlowCardTitle, FlowNavButtons } from "../../components/FlowUI";
import { SOURCE_MIX, sourceBalances, type SourceId } from "@/features/portfolio/portfolioData";
import { useTranslation } from "react-i18next";

/** First step: choose which contribution sources to rebalance. */
function RebalanceSourceSelection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { rebalanceData, updateRebalanceData } = useRebalanceFlow();
  const balances = sourceBalances();
  const [selected, setSelected] = useState<SourceId[]>(rebalanceData.sources ?? []);

  const all = selected.length === SOURCE_MIX.length;
  const toggle = (id: SourceId) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const money = (v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const total = selected.reduce((sum, id) => sum + balances[id], 0);

  return (
    <div className="space-y-6">
      <FlowPageHeader title="Select Sources to Rebalance" description="Choose the contribution sources you want to bring back to your target percentages. Each source can be rebalanced on its own." />

      <FlowCard>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <FlowCardTitle>Sources</FlowCardTitle>
          <button type="button" onClick={() => setSelected(all ? [] : SOURCE_MIX.map((s) => s.id))} className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
            {all ? "Clear all" : "Select all"}
          </button>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {SOURCE_MIX.map((s) => {
            const on = selected.includes(s.id);
            return (
              <li key={s.id}>
                <label
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors"
                  style={{ borderColor: on ? "var(--color-primary)" : "var(--border-default)", background: on ? "var(--c-blue-tint)" : undefined }}
                >
                  <span className="flex items-center gap-3">
                    <input type="checkbox" checked={on} onChange={() => toggle(s.id)} className="h-4 w-4 rounded accent-blue-600" />
                    <span className="text-sm font-medium">{t(`portfolio.src.${s.id}`)}</span>
                  </span>
                  <span className="text-sm tabular-nums">{money(balances[s.id])}</span>
                </label>
              </li>
            );
          })}
        </ul>
        <p role="status" className="mt-4 text-sm" style={{ color: selected.length ? "inherit" : "var(--status-warning-text)" }}>
          {selected.length ? `${selected.length} selected · ${money(total)} will be rebalanced.` : "Select at least one source to choose how it should be allocated."}
        </p>
      </FlowCard>

      <FlowNavButtons
        onBack={() => navigate("/transactions")}
        onNext={() => {
          updateRebalanceData({ sources: selected });
          navigate("/transactions/rebalance/current");
        }}
        nextLabel="Continue"
        disabled={selected.length === 0}
      />
    </div>
  );
}

export default RebalanceSourceSelection

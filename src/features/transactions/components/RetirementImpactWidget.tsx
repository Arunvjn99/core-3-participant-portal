import { motion } from "framer-motion";
import { TrendingUp, CheckCircle2, AlertTriangle, Target } from "lucide-react";
import { useId } from "react";

interface RetirementImpactWidgetProps {
  estimatedValue?: number;
  ytdChange?: number;
  contributionsThisYear?: number;
  contributionLimit?: number;
  growthRate?: number;
  yearsToRetire?: number;
  targetAge?: number;
  retirementGoal?: number;
  onTrack?: boolean;
  impactAmount?: number;
  impactLabel?: string;
  compact?: boolean;
  delay?: number;
}

function MiniChart({ positive = true, compact = false }: { positive?: boolean; compact?: boolean }) {
  const uid = useId();
  const h = compact ? 48 : 64;
  const w = compact ? 200 : 260;
  const points = positive
    ? [
        [0, h * 0.75], [w * 0.15, h * 0.7], [w * 0.3, h * 0.62],
        [w * 0.45, h * 0.55], [w * 0.6, h * 0.42], [w * 0.75, h * 0.28],
        [w * 0.9, h * 0.18], [w, h * 0.12],
      ]
    : [
        [0, h * 0.75], [w * 0.15, h * 0.7], [w * 0.3, h * 0.6],
        [w * 0.45, h * 0.5], [w * 0.6, h * 0.45], [w * 0.75, h * 0.5],
        [w * 0.9, h * 0.55], [w, h * 0.58],
      ];

  const linePoints = points.map((p) => `${p[0]},${p[1]}`).join(" ");
  const areaPoints = `0,${h} ${linePoints} ${w},${h}`;
  const gradientId = `${uid}-${positive ? "pos" : "neg"}`;
  const lineColor = positive ? "var(--color-primary)" : "var(--status-danger)";
  const fillColor = positive ? "var(--color-primary)" : "var(--status-danger)";
  const years = ["2020", "2022", "2024", "2026"];

  return (
    <div style={{ padding: compact ? "8px 0" : "12px 0" }}>
      <svg width="100%" viewBox={`0 0 ${w} ${h + 16}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity="0.12" />
            <stop offset="100%" stopColor={fillColor} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill={`url(#${gradientId})`} />
        <polyline points={linePoints} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="4" fill={lineColor} stroke="#fff" strokeWidth="2" />
        {years.map((year, i) => (
          <text
            key={year}
            x={i * (w / (years.length - 1))}
            y={h + 14}
            textAnchor={i === 0 ? "start" : i === years.length - 1 ? "end" : "middle"}
            fill="var(--c-text-faint)"
            fontSize="9"
            fontWeight="500"
            fontFamily="inherit"
          >
            {year}
          </text>
        ))}
      </svg>
    </div>
  );
}

function RetirementImpactWidget({
  estimatedValue = 38420,
  ytdChange: _ytdChange = 12.4,
  contributionsThisYear = 5538,
  contributionLimit = 23500,
  growthRate = 7.2,
  yearsToRetire = 28,
  targetAge = 65,
  retirementGoal = 450000,
  onTrack = true,
  impactAmount,
  impactLabel,
  compact = false,
  delay = 0,
}: RetirementImpactWidgetProps) {
  const contributionPercent = Math.round((contributionsThisYear / contributionLimit) * 1000) / 10;
  const showImpact = impactAmount !== undefined && impactAmount !== 0;

  const currentAge = targetAge - yearsToRetire;
  const projectedBalance = Math.round(estimatedValue * Math.pow(1 + growthRate / 100, yearsToRetire));
  const goalProgress = Math.min(100, Math.round((projectedBalance / retirementGoal) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
    >
      <div
        className="bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800"
        style={{ borderRadius: 16, overflow: "hidden", position: "relative" }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: showImpact && impactAmount! < 0
              ? "linear-gradient(90deg, var(--status-danger), var(--status-warning))"
              : "linear-gradient(90deg, var(--color-primary), var(--chart-sky))",
            borderRadius: "16px 16px 0 0",
          }}
        />

        <div style={{ padding: compact ? "14px 18px" : "16px 20px" }}>
          {/* Projected Balance */}
          <div style={{ marginBottom: 10 }}>
            <div
              className="text-slate-500 dark:text-gray-400"
              style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}
            >
              Projected at Age {targetAge}
            </div>
            <div
              className="text-slate-900 dark:text-white"
              style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1 }}
            >
              ${projectedBalance.toLocaleString()}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <TrendingUp style={{ width: 13, height: 13, color: "var(--status-success)" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--status-success-text)" }}>
                {growthRate}% avg. annual growth
              </span>
            </div>
          </div>

          <MiniChart positive={!showImpact || impactAmount! >= 0} compact={compact} />

          {/* Progress toward goal */}
          <div style={{ marginTop: 10, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <span
                className="text-slate-500 dark:text-gray-400"
                style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}
              >
                Goal Progress
              </span>
              <span
                className="text-slate-900 dark:text-white"
                style={{ fontSize: 13, fontWeight: 700 }}
              >
                {goalProgress}%
              </span>
            </div>
            <div
              className="bg-slate-200 dark:bg-gray-700"
              style={{ height: 8, borderRadius: 4, overflow: "hidden", position: "relative" }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${goalProgress}%`,
                  background: "linear-gradient(90deg, var(--status-success), var(--status-success-text))",
                  transition: "width 0.4s ease",
                  borderRadius: 4,
                }}
              />
            </div>
            <div
              className="text-slate-400 dark:text-gray-500"
              style={{ fontSize: 11, marginTop: 3 }}
            >
              ${retirementGoal.toLocaleString()} retirement goal
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <div
                className="text-slate-400 dark:text-gray-500"
                style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}
              >
                2026 Contributions
              </div>
              <div
                className="text-slate-900 dark:text-white"
                style={{ fontSize: 16, fontWeight: 700 }}
              >
                {contributionPercent}%
              </div>
              <div
                className="text-slate-400 dark:text-gray-500"
                style={{ fontSize: 10 }}
              >
                ${contributionsThisYear.toLocaleString()} / ${contributionLimit.toLocaleString()}
              </div>
            </div>
            <div>
              <div
                className="text-slate-400 dark:text-gray-500"
                style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}
              >
                Years to Retire
              </div>
              <div
                className="text-slate-900 dark:text-white"
                style={{ fontSize: 16, fontWeight: 700 }}
              >
                {yearsToRetire}
              </div>
              <div
                className="text-slate-400 dark:text-gray-500"
                style={{ fontSize: 10 }}
              >
                Age {currentAge} → {targetAge}
              </div>
            </div>
          </div>

          {/* Impact Message */}
          {showImpact && impactLabel && (
            <div
              className={impactAmount! < 0 ? "dark:bg-amber-950/20 dark:border-amber-800/40" : "dark:bg-green-950/20 dark:border-green-800/40"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: 10,
                background: impactAmount! < 0
                  ? "var(--status-warning-tint)"
                  : "var(--status-success-tint)",
                border: impactAmount! < 0 ? "1px solid var(--status-warning)" : "1px solid var(--status-success)",
                marginBottom: 10,
              }}
            >
              {impactAmount! < 0 ? (
                <AlertTriangle style={{ width: 16, height: 16, color: "var(--status-warning)", flexShrink: 0 }} />
              ) : (
                <TrendingUp style={{ width: 16, height: 16, color: "var(--status-success)", flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: impactAmount! < 0 ? "var(--status-warning-text)" : "var(--status-success-text)" }}>
                  {impactLabel}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: impactAmount! < 0 ? "var(--status-warning-text)" : "var(--status-success-text)" }}>
                  {impactAmount! < 0 ? "-" : "+"}${Math.abs(impactAmount!).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* On Track Banner */}
          {onTrack && !showImpact && (
            <div
              className="dark:bg-green-950/20 dark:border-green-800/40"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 8,
                background: "var(--status-success-tint)",
                border: "1px solid var(--c-border-green)",
              }}
            >
              <CheckCircle2 style={{ width: 14, height: 14, color: "var(--status-success)" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--status-success-text)" }}>
                You're on track to meet your goal
              </span>
            </div>
          )}

          {/* Off Track Warning */}
          {!onTrack && !showImpact && (
            <div
              className="dark:bg-amber-950/20 dark:border-amber-800/40"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 8,
                background: "var(--status-warning-tint)",
                border: "1px solid var(--c-border-amber)",
              }}
            >
              <Target style={{ width: 14, height: 14, color: "var(--status-warning)" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--status-warning-text)" }}>
                Consider increasing contributions
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
export default RetirementImpactWidget

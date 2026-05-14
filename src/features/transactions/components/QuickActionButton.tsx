import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface QuickActionButtonProps {
  icon: React.ReactNode;
  title: string;
  contextInfo: string;
  additionalInfo?: string;
  onClick: () => void;
}

function QuickActionButton({
  icon,
  title,
  contextInfo,
  additionalInfo,
  onClick,
}: QuickActionButtonProps) {
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: "var(--shadow-elevated)" }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={onClick}
      className="relative overflow-hidden cursor-pointer group bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700"
      style={{ borderRadius: 14, padding: "16px 20px" }}
    >
      <div className="relative flex items-start gap-3.5">
        <div
          className="flex items-center justify-center flex-shrink-0 transition-all duration-200"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "var(--c-blue-tint)",
            color: "var(--brand-primary)",
          }}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3
              className="text-slate-900 dark:text-white"
              style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.3px", lineHeight: "20px" }}
            >
              {title}
            </h3>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-gray-600 group-hover:brand-text group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </div>
          <p className="brand-text" style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>
            {contextInfo}
          </p>
          {additionalInfo && (
            <p
              className="text-slate-400 dark:text-gray-500"
              style={{ fontSize: 11, fontWeight: 500, marginTop: 2 }}
            >
              {additionalInfo}
            </p>
          )}
        </div>
      </div>

      {/* Bottom accent line on hover */}
      <div
        className="absolute bottom-0 left-0 right-0 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"
        style={{ height: 2, background: "var(--brand-primary)", borderRadius: 1 }}
      />
    </motion.div>
  );
}
export default QuickActionButton

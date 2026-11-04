import { UtensilsCrossed, Receipt, Filter, Coins, FileText, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export default function QuickActions() {
  const { t } = useLanguage();

  const actions = [
    { label: t.recordTodaysMeals, icon: UtensilsCrossed, href: "/meal-entry", highlight: true },
    { label: t.addExpense, icon: Receipt, href: "/expenses" },
    { label: t.filterExpenses, icon: Filter, href: "/expenses" },
    { label: t.recordAdvance, icon: Coins, href: "/advances" },
    { label: t.monthlyReport, icon: FileText, href: "/monthly-report" },
  ];

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center">
          <Zap size={14} className="text-warning" />
        </div>
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{t.quickActions}</h2>
      </div>
      <div className="space-y-2">
        {actions.map((a) => (
          <Link
            key={a.label}
            to={a.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              a.highlight
                ? "bg-primary/15 text-primary hover:bg-primary/25 border border-primary/20 hover:border-primary/40"
                : "bg-secondary/40 text-foreground hover:bg-secondary/70 border border-transparent hover:border-border/30"
            }`}
          >
            <a.icon size={16} />
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

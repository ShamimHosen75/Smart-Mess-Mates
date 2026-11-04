import { TrendingUp, UtensilsCrossed, Calculator, Wallet } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface StatCardsProps {
  totalExpense: number;
  totalMeals: number;
  perMealCost: number;
  totalAdvances: number;
  expenseRecordCount: number;
  activeCount: number;
  advanceEntryCount: number;
}

export default function StatCards({
  totalExpense, totalMeals, perMealCost, totalAdvances,
  expenseRecordCount, activeCount, advanceEntryCount,
}: StatCardsProps) {
  const { t } = useLanguage();

  const cards = [
    {
      label: t.totalExpense,
      value: `৳${totalExpense.toFixed(2)}`,
      sub: `${expenseRecordCount} ${t.records}`,
      icon: TrendingUp,
      variant: "primary" as const,
    },
    {
      label: t.totalMeals,
      value: totalMeals.toString(),
      sub: `${activeCount} ${t.activeMembersCount}`,
      icon: UtensilsCrossed,
      variant: "success" as const,
    },
    {
      label: t.perMealCost,
      value: `৳${perMealCost}`,
      sub: t.perMealUnit,
      icon: Calculator,
      variant: "warning" as const,
    },
    {
      label: t.totalAdvances,
      value: `৳${totalAdvances.toFixed(2)}`,
      sub: `${advanceEntryCount} ${t.entries}`,
      icon: Wallet,
      variant: "info" as const,
    },
  ];

  const variantStyles = {
    primary: "from-primary/15 to-primary/5 border-primary/20",
    success: "from-success/15 to-success/5 border-success/20",
    warning: "from-warning/15 to-warning/5 border-warning/20",
    info: "from-info/15 to-info/5 border-info/20",
  };

  const iconStyles = {
    primary: "bg-primary/15 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    info: "bg-info/15 text-info",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${variantStyles[card.variant]} p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                {card.label}
              </p>
              <p className="text-2xl font-bold text-foreground tracking-tight">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.sub}</p>
            </div>
            <div className={`w-10 h-10 rounded-lg ${iconStyles[card.variant]} flex items-center justify-center flex-shrink-0`}>
              <card.icon size={20} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

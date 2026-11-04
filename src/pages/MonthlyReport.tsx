import AppLayout from "@/components/layout/AppLayout";
import { FileText, Printer } from "lucide-react";
import { MEMBERS, TOTAL_EXPENSE, TOTAL_MEALS, PER_MEAL_COST, getMemberBalance } from "@/lib/data";
import { useLanguage } from "@/contexts/LanguageContext";

export default function MonthlyReport() {
  const { t } = useLanguage();

  return (
    <AppLayout title={t.monthlyReport} subtitle={t.february2026} icon={<FileText className="text-primary" size={22} />}>
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div className="stat-card">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.totalExpense}</p>
            <p className="text-xl md:text-2xl font-bold text-primary">৳{TOTAL_EXPENSE.toFixed(2)}</p>
          </div>
          <div className="stat-card stat-card-success">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.totalMeals}</p>
            <p className="text-xl md:text-2xl font-bold text-foreground">{TOTAL_MEALS}</p>
          </div>
          <div className="stat-card stat-card-warning">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.perMealCost}</p>
            <p className="text-xl md:text-2xl font-bold text-foreground">৳{PER_MEAL_COST}</p>
          </div>
        </div>

        <div className="glass-card p-4 md:p-5">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">{t.calculation}</h2>
          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm">
            <div className="glass-card p-3 text-center flex-1 min-w-[80px]">
              <p className="text-[10px] text-muted-foreground">💰 {t.totalExpense.toUpperCase()}</p>
              <p className="text-base md:text-lg font-bold text-primary">৳{TOTAL_EXPENSE.toFixed(2)}</p>
            </div>
            <span className="text-muted-foreground text-lg">÷</span>
            <div className="glass-card p-3 text-center flex-1 min-w-[80px]">
              <p className="text-[10px] text-muted-foreground">🍽 {t.totalMeals.toUpperCase()}</p>
              <p className="text-base md:text-lg font-bold text-foreground">{TOTAL_MEALS}</p>
            </div>
            <span className="text-muted-foreground text-lg">=</span>
            <div className="glass-card p-3 text-center flex-1 min-w-[80px]">
              <p className="text-[10px] text-muted-foreground">💵 {t.perMealCost.toUpperCase()}</p>
              <p className="text-base md:text-lg font-bold text-warning">৳{PER_MEAL_COST}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">
            <Printer size={16} /> {t.printReport}
          </button>
        </div>

        <div className="glass-card p-4 md:p-5">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4 md:mb-6">{t.individualReport}</h2>
          <div className="space-y-4 md:space-y-6">
            {MEMBERS.map((member) => {
              const mealCost = member.totalMeals * PER_MEAL_COST;
              const balance = getMemberBalance(member);
              const mustPay = balance > 0;
              return (
                <div key={member.id} className="glass-card p-4 md:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 md:mb-4 gap-2">
                    <h3 className="text-base font-bold text-foreground">{member.name}</h3>
                    <span className={mustPay ? "badge-pay text-sm px-3 py-1 self-start" : "badge-receive text-sm px-3 py-1 self-start"}>
                      {mustPay ? `${t.mustPay} ৳${balance.toFixed(2)}` : `${t.willReceive} ৳${Math.abs(balance).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">{t.totalMeals}</span><span className="font-medium text-foreground">{member.totalMeals}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">× {t.perMealCost} (৳{PER_MEAL_COST})</span><span className="font-medium text-foreground">৳{mealCost.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">− {t.personalPurchases}</span><span className="font-medium text-destructive">−৳{member.personalPurchases.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">− {t.advanceContributed}</span><span className="font-medium text-destructive">−৳{member.advanceContributed.toFixed(2)}</span></div>
                    <div className="flex justify-between border-t border-border/30 pt-2">
                      <span className="font-bold text-foreground">{t.finalBalance}</span>
                      <span className={`font-bold ${mustPay ? "text-success" : "text-destructive"}`}>{mustPay ? "+" : ""}৳{balance.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

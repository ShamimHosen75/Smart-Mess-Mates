import { PieChart as PieIcon } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";

const CATEGORY_COLORS = ["hsl(187,72%,55%)", "hsl(280,65%,60%)", "hsl(142,72%,45%)", "hsl(38,92%,55%)", "hsl(215,20%,55%)"];

interface ExpenseByCategoryChartProps {
  expenseByCategory: Array<{ category: string; amount: number }>;
}

export default function ExpenseByCategoryChart({ expenseByCategory }: ExpenseByCategoryChartProps) {
  const { t } = useLanguage();

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
          <PieIcon size={14} className="text-primary" />
        </div>
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{t.expenseByCategory}</h2>
      </div>
      {expenseByCategory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
            <PieIcon size={20} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No expenses recorded yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Add expenses to see breakdown</p>
        </div>
      ) : (
        <>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {expenseByCategory.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                  formatter={(val: number) => [`৳${val.toFixed(2)}`, t.amount]}
                />
                <Legend
                  formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                  iconSize={8}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-2">
            {expenseByCategory.map((item, i) => (
              <div key={item.category} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                  <span className="text-muted-foreground">{item.category}</span>
                </div>
                <span className="font-semibold text-foreground tabular-nums">৳{item.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

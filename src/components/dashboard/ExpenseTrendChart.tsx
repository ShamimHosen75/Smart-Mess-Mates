import { TrendingUp } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

interface ExpenseTrendChartProps {
  monthlyTrend: Array<{ month: string; amount: number }>;
}

export default function ExpenseTrendChart({ monthlyTrend }: ExpenseTrendChartProps) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-info/10 flex items-center justify-center">
          <TrendingUp size={14} className="text-info" />
        </div>
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Monthly Expense Trend</h2>
      </div>
      {monthlyTrend.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
            <TrendingUp size={20} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No expense data yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Start recording to see trends</p>
        </div>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v: string) => {
                  const [y, m] = v.split("-");
                  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                  return `${months[parseInt(m, 10) - 1]} ${y.slice(2)}`;
                }}
              />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v: number) => `৳${v}`} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                formatter={(val: number) => [`৳${val.toFixed(2)}`, "Expense"]}
                labelFormatter={(label: string) => {
                  const [y, m] = label.split("-");
                  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
                  return `${months[parseInt(m, 10) - 1]} ${y}`;
                }}
              />
              <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

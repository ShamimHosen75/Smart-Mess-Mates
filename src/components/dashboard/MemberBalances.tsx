import { Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Member {
  id: string;
  name: string;
  avatar: string;
  totalMeals: number;
  isGuest: boolean;
}

interface MemberBalancesProps {
  members: Member[];
  perMealCost: number;
  getMemberBalance: (m: Member, cost: number) => number;
}

export default function MemberBalances({ members, perMealCost, getMemberBalance }: MemberBalancesProps) {
  const { t } = useLanguage();

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Users size={14} className="text-primary" />
        </div>
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{t.memberBalances}</h2>
      </div>
      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
            <Users size={20} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No active members found</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Add members to see balances</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((m) => {
            const balance = getMemberBalance(m, perMealCost);
            const mustPay = balance > 0;
            return (
              <div
                key={m.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-secondary/40 transition-colors border-b border-border/20 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-bold text-primary ring-1 ring-primary/10">
                    {m.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {m.name}
                      {m.isGuest && <span className="badge-guest ml-2">{t.guest}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.totalMeals} {t.meals} · ৳{(m.totalMeals * perMealCost).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-foreground tabular-nums">৳{Math.abs(balance).toFixed(2)}</span>
                  <span className={`${mustPay ? "badge-pay" : "badge-receive"} min-w-[52px] text-center`}>
                    {mustPay ? t.pay : t.receive}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { LayoutDashboard, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMonth } from "@/contexts/MonthContext";
import PendingApprovals from "@/components/dashboard/PendingApprovals";
import MessOverviewWidget from "@/components/dashboard/MessOverviewWidget";
import StatCards from "@/components/dashboard/StatCards";
import MemberBalances from "@/components/dashboard/MemberBalances";
import ExpenseTrendChart from "@/components/dashboard/ExpenseTrendChart";
import ExpenseByCategoryChart from "@/components/dashboard/ExpenseByCategoryChart";
import QuickActions from "@/components/dashboard/QuickActions";
import { useMess } from "@/contexts/MessContext";
import { useDashboardData, getMemberBalance } from "@/hooks/use-dashboard-data";

export default function Dashboard() {
  const { t } = useLanguage();
  const { currentMess } = useMess();
  const isMobile = useIsMobile();
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const { monthLabel } = useMonth();

  const {
    members, totalExpense, totalMeals, perMealCost, totalAdvances,
    expenseByCategory, monthlyTrend, activeCount, expenseRecordCount,
    advanceEntryCount, loading: dataLoading,
  } = useDashboardData();

  useEffect(() => {
    if (isMobile && !localStorage.getItem("install-banner-dismissed")) {
      setShowInstallBanner(true);
    }
  }, [isMobile]);

  return (
    <AppLayout title={currentMess ? currentMess.name : t.dashboard} subtitle={monthLabel} icon={<LayoutDashboard className="text-primary" size={22} />}>
      <div className="space-y-6 animate-fade-in">
        <PendingApprovals />

        {dataLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <>
            <MessOverviewWidget />

            <StatCards
              totalExpense={totalExpense}
              totalMeals={totalMeals}
              perMealCost={perMealCost}
              totalAdvances={totalAdvances}
              expenseRecordCount={expenseRecordCount}
              activeCount={activeCount}
              advanceEntryCount={advanceEntryCount}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <MemberBalances
                  members={members}
                  perMealCost={perMealCost || 0}
                  getMemberBalance={getMemberBalance}
                />
              </div>
              <ExpenseTrendChart monthlyTrend={monthlyTrend} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ExpenseByCategoryChart expenseByCategory={expenseByCategory} />
              <QuickActions />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

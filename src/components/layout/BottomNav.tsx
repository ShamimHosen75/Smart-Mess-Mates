import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, UtensilsCrossed, Receipt, Users, MoreHorizontal,
  FileText, Coins, UserCircle, Settings, Building2
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

export default function BottomNav() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const { t } = useLanguage();
  const { userRole } = useAuth();
  const isSuperAdmin = userRole === "super_admin";

  const mainItems = [
    { to: "/", icon: LayoutDashboard, label: t.dashboard },
    { to: "/meal-entry", icon: UtensilsCrossed, label: t.mealEntry },
    { to: "/expenses", icon: Receipt, label: t.expenses },
    { to: "/members", icon: Users, label: t.members },
  ];

  const moreItems = [
    { to: "/monthly-report", icon: FileText, label: t.monthlyReport },
    { to: "/advances", icon: Coins, label: t.advances },
    ...(isSuperAdmin ? [{ to: "/mess-management", icon: Building2, label: "Mess Mgmt" }] : []),
    { to: "/settings", icon: Settings, label: t.settings },
    { to: "/my-account", icon: UserCircle, label: t.myAccount },
  ];

  const isMoreActive = moreItems.some(item => location.pathname === item.to);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/50 flex items-center justify-around h-16 safe-area-bottom px-1">
        {mainItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative"
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
              <item.icon size={20} className={isActive ? "text-primary" : "text-muted-foreground"} />
              <span className={`text-[10px] leading-none ${isActive ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative"
        >
          {isMoreActive && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
          )}
          <MoreHorizontal size={20} className={isMoreActive ? "text-primary" : "text-muted-foreground"} />
          <span className={`text-[10px] leading-none ${isMoreActive ? "text-primary font-semibold" : "text-muted-foreground"}`}>
            More
          </span>
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="!p-0 bg-card">
          <SheetTitle className="sr-only">More options</SheetTitle>
          <div className="w-8 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-3 mb-3" />
          <div className={`grid ${moreItems.length > 4 ? 'grid-cols-3' : 'grid-cols-4'} gap-1 px-3 pb-4`}>
            {moreItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <item.icon size={22} />
                  <span className="text-[11px] font-medium text-center leading-tight">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

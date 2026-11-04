import { ReactNode, useState } from "react";
import AppSidebar from "./AppSidebar";
import BottomNav from "./BottomNav";
import MessSwitcher from "@/components/dashboard/MessSwitcher";
import { ChevronLeft, ChevronRight, Bell, Menu, Calendar } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useMonth } from "@/contexts/MonthContext";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

export default function AppLayout({ children, title, subtitle, icon }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const { onTouchStart, onTouchEnd } = useSwipeNavigation();
  const { monthLabel, monthLabelShort, goToPreviousMonth, goToNextMonth } = useMonth();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      {!isMobile && <AppSidebar />}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b border-border/40 bg-card/60 backdrop-blur-xl flex items-center justify-between px-3 md:px-6 flex-shrink-0 sticky top-0 z-30">
          {/* Left section */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-1 rounded-xl hover:bg-primary/10 text-foreground transition-all duration-200 active:scale-95 flex-shrink-0"
              >
                <Menu size={20} />
              </button>
            )}
            {icon && (
              <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 items-center justify-center text-primary border border-primary/10 hidden md:flex">
                {icon}
              </span>
            )}
            <div className="min-w-0 hidden md:block">
              <h1 className="text-lg font-bold text-foreground truncate leading-tight">{title}</h1>
              {subtitle && (
                <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>

            {/* Month navigator */}
            <div className="flex items-center bg-secondary/40 rounded-lg border border-border/30">
              <button
                onClick={goToPreviousMonth}
                className="p-1.5 rounded-l-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-200 active:scale-90"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="font-semibold text-foreground text-[11px] sm:text-xs px-1.5 sm:px-2 whitespace-nowrap">
                <span className="sm:hidden">{monthLabelShort}</span>
                <span className="hidden sm:inline">{monthLabel}</span>
              </span>
              <button
                onClick={goToNextMonth}
                className="p-1.5 rounded-r-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-200 active:scale-90"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0 ml-2">
            <MessSwitcher />
            <button className="relative p-2 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-200 active:scale-95">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive ring-2 ring-card/80" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main
          className={`flex-1 p-4 md:p-6 overflow-auto ${isMobile ? "pb-20" : ""}`}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {isMobile && <BottomNav />}

      {/* Mobile sidebar drawer */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="!p-0 w-72 bg-sidebar">
            <SheetTitle className="sr-only">Navigation menu</SheetTitle>
            <AppSidebar mobile onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

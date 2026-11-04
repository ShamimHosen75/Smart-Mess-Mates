import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FileText, UtensilsCrossed, Receipt,
  Coins, Users, User, ChevronLeft, ChevronRight, LogOut, Settings, Building2, Calculator, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMess } from "@/contexts/MessContext";
import { useMonth } from "@/contexts/MonthContext";
import { supabase } from "@/integrations/supabase/client";

interface AppSidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

export default function AppSidebar({ mobile, onNavigate }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { signOut, user, userRole } = useAuth();
  const { currentMess } = useMess();
  const { monthLabel } = useMonth();
  const [avatar, setAvatar] = useState<string | null>(() => localStorage.getItem("profile-avatar"));
  const [pendingCount, setPendingCount] = useState(0);

  const isSuperAdmin = userRole === "super_admin";
  const isAdminOrManager = userRole === "admin" || userRole === "moderator" || isSuperAdmin;

  // Fetch pending approvals count for admin/manager
  useEffect(() => {
    if (!isAdminOrManager) return;
    const fetchCount = async () => {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_approved", false);
      setPendingCount(count ?? 0);
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [isAdminOrManager]);

  // Listen for storage changes (same tab via custom event)
  useEffect(() => {
    const sync = () => setAvatar(localStorage.getItem("profile-avatar"));
    window.addEventListener("storage", sync);
    window.addEventListener("profile-avatar-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("profile-avatar-updated", sync);
    };
  }, []);

  // On mobile, always show expanded
  const isCollapsed = mobile ? false : collapsed;

  const NAV_SECTIONS = [
    {
      label: t.overview,
      items: [
        { to: "/", icon: LayoutDashboard, label: t.dashboard },
        { to: "/monthly-report", icon: FileText, label: t.monthlyReport },
      ],
    },
    {
      label: t.dailyEntry,
      items: [
        { to: "/meal-entry", icon: UtensilsCrossed, label: t.mealEntry },
        { to: "/expenses", icon: Receipt, label: t.expenses },
        { to: "/advances", icon: Coins, label: t.advances },
        { to: "/meal-calculator", icon: Calculator, label: "Meal Calculator" },
      ],
    },
    {
      label: t.manage,
      items: [
        { to: "/members", icon: Users, label: t.members },
        ...(isSuperAdmin ? [{ to: "/mess-management", icon: Building2, label: "Mess Management" }] : []),
        ...(isSuperAdmin ? [{ to: "/admin/users", icon: ShieldCheck, label: "User Admin" }] : []),
        { to: "/settings", icon: Settings, label: t.settings },
        { to: "/my-account", icon: User, label: t.myAccount },
      ],
    },
  ];

  const footerHeight = isCollapsed ? 0 : 160;

  return (
    <aside
      className={`${
        mobile ? "w-full h-full" : isCollapsed ? "w-16" : "w-60"
      } ${mobile ? "" : "flex-shrink-0 h-screen sticky top-0"} bg-sidebar ${mobile ? "" : "border-r border-sidebar-border"} relative transition-all duration-300`}
    >
      {/* Header */}
      <div className="px-4 py-5 flex items-center gap-3.5 border-b border-border/30">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-info/60 flex items-center justify-center flex-shrink-0 shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.5)] ring-1 ring-primary/30">
          <span className="text-primary-foreground font-black text-xl leading-none">M</span>
        </div>
        {!isCollapsed && (
          <div className="animate-fade-in min-w-0 flex-1">
            <h1 className="text-lg font-black text-foreground leading-tight tracking-tight">
              Mess<span className="text-primary">Mate</span>
            </h1>
            {currentMess ? (
              <p className="text-[10px] text-primary/70 tracking-widest uppercase font-semibold truncate mt-0.5">{currentMess.name}</p>
            ) : (
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5">{t.appTagline}</p>
            )}
          </div>
        )}
        {!mobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground transition-all duration-200 hover:text-foreground hover:scale-105"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Nav — scrollable, with bottom padding to avoid footer overlap */}
      <nav
        className="overflow-y-auto px-2 space-y-4 pt-3"
        style={{
          position: 'absolute',
          top: 76,
          left: 0,
          right: 0,
          bottom: isCollapsed ? 0 : footerHeight,
        }}
      >
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!isCollapsed && (
              <p className="text-[10px] text-foreground/70 uppercase tracking-wider px-3 mb-1 font-semibold">{section.label}</p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    title={item.label}
                    className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                      isActive
                        ? "bg-primary/15 text-primary font-semibold shadow-sm"
                        : "text-foreground hover:bg-sidebar-accent hover:text-primary hover:translate-x-0.5"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary animate-scale-in" />
                    )}
                    <item.icon
                      size={18}
                      className={`transition-transform duration-200 ${
                        isActive ? "text-primary" : "group-hover:scale-110"
                      }`}
                    />
                    {!isCollapsed && <span>{item.label}</span>}
                    {/* Pending approvals badge on Dashboard */}
                    {item.to === "/" && isAdminOrManager && pendingCount > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 animate-scale-in">
                        {pendingCount}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer — absolutely positioned at bottom */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute bottom-0 left-0 right-0 bg-sidebar"
          >
            {/* Active Month Pill */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
              className="mx-3 mb-2 flex items-center justify-center gap-2 py-1.5 px-3 rounded-full border border-border/40 bg-card/50"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{t.activeMonth}</p>
              <p className="text-[11px] font-semibold text-primary">{monthLabel}</p>
            </motion.div>

            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.35, ease: "easeOut" }}
              className="mx-3 mb-2"
            >
              <div
                className="group relative p-3 rounded-xl bg-gradient-to-br from-card to-card/60 border border-border/30 cursor-pointer transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_16px_-6px_hsl(var(--primary)/0.2)]"
                onClick={() => { navigate("/my-account"); onNavigate?.(); }}
              >
                <div className="flex items-center gap-3">
                  {avatar ? (
                    <img src={avatar} alt="Profile" className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-sm font-bold ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all shadow-[0_0_12px_-4px_hsl(var(--primary)/0.4)]">
                      {(user?.user_metadata?.full_name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{user?.user_metadata?.full_name || "User"}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-success" />
                      <p className="text-[10px] text-primary/80 uppercase tracking-widest font-semibold">
                        {isSuperAdmin ? "Super Admin" : userRole === "admin" ? t.administrator : userRole === "moderator" ? "Manager" : "Member"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </motion.div>

            {/* Sign Out */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3, ease: "easeOut" }}
              className="mx-3 mb-3"
            >
              <button
                onClick={signOut}
                className="flex items-center justify-center gap-2 text-muted-foreground text-xs w-full px-3 py-2 rounded-lg border border-transparent hover:border-destructive/20 hover:text-destructive hover:bg-destructive/5 transition-all duration-200"
              >
                <LogOut size={13} />
                <span className="font-medium">{t.signOut}</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}

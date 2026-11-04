import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import {
  Settings as SettingsIcon, Globe, Palette, Search, ChevronRight,
  User, Shield, Languages, Bell, Building2, Info,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import GlobalSettings from "@/components/settings/GlobalSettings";
import ThemeSettings from "@/components/settings/ThemeSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import { useLanguage } from "@/contexts/LanguageContext";

type SectionId = "region" | "language" | "appearance" | "notifications" | "about";

interface NavItem {
  id: SectionId | string;
  label: string;
  description: string;
  icon: typeof Globe;
  group: string;
  href?: string;
  badge?: string;
}

export default function Settings() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [active, setActive] = useState<SectionId>("region");
  const [query, setQuery] = useState("");

  const NAV: NavItem[] = [
    { id: "profile", label: "Profile", description: "Your name, photo and contact details.", icon: User, group: "Account", href: "/my-account" },
    { id: "security", label: "Security", description: "Password and sign-in protection.", icon: Shield, group: "Account", href: "/my-account" },
    { id: "region", label: "Region & currency", description: "Country, currency symbol and number format.", icon: Globe, group: "Workspace" },
    { id: "language", label: "Language", description: "Choose the language used across the app.", icon: Languages, group: "Workspace" },
    { id: "appearance", label: "Appearance", description: "Light or dark mode, brand colours and corners.", icon: Palette, group: "Workspace" },
    { id: "notifications", label: "Notifications", description: "Reminders, alerts and monthly summaries.", icon: Bell, group: "Workspace" },
    { id: "mess", label: "Mess management", description: "Create messes, assign managers and members.", icon: Building2, group: "Organisation", href: "/mess-management" },
    { id: "about", label: "About", description: "App version and product information.", icon: Info, group: "Organisation" },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NAV;
    return NAV.filter((n) => `${n.label} ${n.description} ${n.group}`.toLowerCase().includes(q));
  }, [query]);

  const groups = useMemo(() => {
    const map = new Map<string, NavItem[]>();
    filtered.forEach((item) => {
      map.set(item.group, [...(map.get(item.group) ?? []), item]);
    });
    return [...map.entries()];
  }, [filtered]);

  const current = NAV.find((n) => n.id === active)!;

  return (
    <AppLayout title={t.settings} subtitle={t.managePreferences} icon={<SettingsIcon className="text-primary" size={22} />}>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 animate-fade-in">
        {/* Nav column */}
        <aside className="space-y-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search settings..."
              className="pl-9 bg-secondary border-border"
            />
          </div>

          <nav className="space-y-5">
            {groups.map(([group, items]) => (
              <div key={group} className="space-y-1">
                <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{group}</p>
                {items.map((item) => {
                  const isActive = !item.href && item.id === active;
                  return (
                    <button
                      key={item.id}
                      onClick={() => (item.href ? navigate(item.href) : setActive(item.id as SectionId))}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <item.icon size={16} className="shrink-0" />
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      <ChevronRight size={14} className={isActive ? "opacity-100" : "opacity-0"} />
                    </button>
                  );
                })}
              </div>
            ))}
            {groups.length === 0 && (
              <p className="px-2 text-xs text-muted-foreground">No settings match “{query}”.</p>
            )}
          </nav>
        </aside>

        {/* Detail panel */}
        <section className="glass-card p-0 overflow-hidden">
          <header className="flex items-start gap-3 p-5 border-b border-border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <current.icon size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">{current.label}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{current.description}</p>
            </div>
          </header>

          <div className="p-5">
            {active === "region" && <GlobalSettings only="region" />}
            {active === "language" && <GlobalSettings only="language" />}
            {active === "appearance" && <ThemeSettings />}
            {active === "notifications" && <NotificationSettings />}
            {active === "about" && (
              <div className="space-y-3">
                {[
                  ["Product", "MessMate — Smart Mess & Meal Management"],
                  ["Version", "1.0.0"],
                  ["Platform", "Web app & installable PWA"],
                  ["Support", "shamimdevs75@gmail.com"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
                    <span className="text-sm font-medium text-foreground text-right">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

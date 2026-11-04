import { useEffect, useState } from "react";
import { Bell, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const STORAGE_KEY = "messmate.notifications.v1";

interface Prefs {
  mealReminders: boolean;
  expenseAlerts: boolean;
  monthlySummary: boolean;
  approvalRequests: boolean;
}

const DEFAULTS: Prefs = {
  mealReminders: true,
  expenseAlerts: true,
  monthlySummary: true,
  approvalRequests: true,
};

const ITEMS: { key: keyof Prefs; title: string; desc: string }[] = [
  { key: "mealReminders", title: "Meal entry reminders", desc: "Daily nudge to record meals before the cut-off." },
  { key: "expenseAlerts", title: "Expense alerts", desc: "Get notified when a new expense is added to your mess." },
  { key: "monthlySummary", title: "Monthly summary", desc: "Receive the closing report when a month is finalised." },
  { key: "approvalRequests", title: "Approval requests", desc: "Alert managers when a new member is waiting for approval." },
];

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);

  const toggle = (key: keyof Prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    toast.success("Notification preferences saved");
  };

  return (
    <div className="space-y-6">
      <div className="glass-card divide-y divide-border">
        <div className="flex items-center gap-2 p-5">
          <Bell size={18} className="text-primary" />
          <h3 className="text-base font-semibold text-foreground">Notifications</h3>
        </div>
        {ITEMS.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
            <Switch checked={prefs[item.key]} onCheckedChange={() => toggle(item.key)} />
          </div>
        ))}
      </div>
      <Button onClick={save} className="gap-2"><Save size={16} /> Save preferences</Button>
    </div>
  );
}

import { useState } from "react";
import { Palette, SlidersHorizontal, Sparkles, Save, RotateCcw, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useTheme, type ThemeColors } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

const ACCENT_PRESETS = [
  { name: "Red", color: "#ef4444" }, { name: "Blue", color: "#3b82f6" }, { name: "Green", color: "#22c55e" },
  { name: "Purple", color: "#a855f7" }, { name: "Orange", color: "#f97316" }, { name: "Pink", color: "#ec4899" },
  { name: "Cyan", color: "#06b6d4" }, { name: "Rose", color: "#f43f5e" }, { name: "Emerald", color: "#10b981" },
];

const RADIUS_PRESETS = [
  { label: "sharp", value: 0 }, { label: "subtle", value: 0.25 }, { label: "default_", value: 0.5 },
  { label: "rounded", value: 0.75 }, { label: "pill", value: 1.5 },
] as const;

interface ColorEntry { label: string; key: keyof ThemeColors; hint: string; }

export default function ThemeSettings() {
  const { mode, colors, radius, setMode, updateColor, setRadius, resetTheme, saveTheme } = useTheme();
  const { t } = useLanguage();
  const [saved, setSaved] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const COLOR_FIELDS: ColorEntry[] = [
    { label: t.accentCta, key: "accent", hint: t.accentCta },
    { label: t.secondary, key: "secondary", hint: t.secondarySurfaces },
    { label: t.background, key: "background", hint: t.background },
    { label: t.text, key: "text", hint: t.text },
    { label: t.mutedText, key: "muted", hint: t.mutedText },
    { label: t.border, key: "border", hint: t.border },
    { label: t.cardSurface, key: "card", hint: t.cardSurface },
  ];

  const handleSave = () => { saveTheme(); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const radiusLabels: Record<string, string> = { sharp: t.sharp, subtle: t.subtle, default_: t.default_, rounded: t.rounded, pill: t.pill };

  return (
    <div className="space-y-8">
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          {mode === "dark" ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-primary" />}
          <h3 className="text-base font-semibold text-foreground">{t.appearance}</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <button onClick={() => setMode("light")} className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${mode === "light" ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-secondary hover:border-primary/40"}`}>
            <div className="w-16 h-10 rounded-lg bg-[#faf9f7] border border-[#e5e7eb] flex items-center justify-center"><Sun size={18} className="text-[#1a1a2e]" /></div>
            <span className="text-sm font-medium text-foreground">{t.light}</span>
          </button>
          <button onClick={() => setMode("dark")} className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${mode === "dark" ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-secondary hover:border-primary/40"}`}>
            <div className="w-16 h-10 rounded-lg bg-[#0f172a] border border-[#1e3048] flex items-center justify-center"><Moon size={18} className="text-[#f1f5f9]" /></div>
            <span className="text-sm font-medium text-foreground">{t.dark}</span>
          </button>
        </div>
      </div>

      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2"><Palette size={18} className="text-primary" /><h3 className="text-base font-semibold text-foreground">{t.brandColors}</h3></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COLOR_FIELDS.map((entry) => (
            <div key={entry.key} className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{entry.label}</Label>
              <div className="flex items-center gap-2">
                <label className="relative w-10 h-10 rounded-lg border border-border flex-shrink-0 cursor-pointer overflow-hidden" style={{ backgroundColor: colors[entry.key] }}>
                  <input type="color" value={colors[entry.key]} onChange={(e) => updateColor(entry.key, e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                </label>
                <Input value={colors[entry.key]} onChange={(e) => updateColor(entry.key, e.target.value)} className="bg-secondary border-border focus:border-primary font-mono text-sm" />
              </div>
              <p className="text-[10px] text-muted-foreground">{entry.hint}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2"><SlidersHorizontal size={18} className="text-primary" /><h3 className="text-base font-semibold text-foreground">{t.borderRadius}</h3></div>
        <div className="flex items-center gap-4">
          <div className="flex-1"><Slider value={[radius]} onValueChange={([v]) => setRadius(v)} min={0} max={2} step={0.05} className="w-full" /></div>
          <span className="text-sm font-mono text-foreground min-w-[4rem] text-right">{radius.toFixed(2)}rem</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {RADIUS_PRESETS.map((p) => (
            <button key={p.label} onClick={() => setRadius(p.value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${Math.abs(radius - p.value) < 0.01 ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground hover:text-foreground"}`}>{radiusLabels[p.label]}</button>
          ))}
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2"><Sparkles size={18} className="text-primary" /><h3 className="text-base font-semibold text-foreground">{t.quickAccentPresets}</h3></div>
        <div className="flex gap-3 flex-wrap">
          {ACCENT_PRESETS.map((preset) => (
            <button key={preset.color} onClick={() => { setActivePreset(preset.color); updateColor("accent", preset.color); }} className={`w-11 h-11 rounded-full border-2 transition-all hover:scale-110 ${activePreset === preset.color ? "border-foreground ring-2 ring-primary scale-110" : "border-transparent"}`} style={{ backgroundColor: preset.color }} title={preset.name} />
          ))}
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h3 className="text-base font-semibold text-foreground">{t.preview}</h3>
        <div className="p-6 rounded-lg border border-border" style={{ borderRadius: `${radius}rem` }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: colors.accent, borderRadius: `${radius}rem` }}>Aa</div>
            <div>
              <p className="text-foreground font-semibold">{t.sampleCard}</p>
              <p className="text-muted-foreground text-sm">{t.previewThemeSettings}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: colors.accent, borderRadius: `${radius}rem` }}>{t.primaryButton}</button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground" style={{ borderRadius: `${radius}rem` }}>{t.secondary}</button>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSave} className="gap-2"><Save size={16} /> {saved ? t.saved : t.saveTheme}</Button>
        <Button variant="outline" onClick={resetTheme} className="gap-2"><RotateCcw size={16} /> {t.resetToDefault}</Button>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Globe, DollarSign, Languages, Clock, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Lang } from "@/lib/translations";

const COUNTRIES = [
  { code: "AF", name: "Afghanistan", currency: "AFN", symbol: "؋", locale: "fa-AF" },
  { code: "AL", name: "Albania", currency: "ALL", symbol: "L", locale: "sq-AL" },
  { code: "DZ", name: "Algeria", currency: "DZD", symbol: "د.ج", locale: "ar-DZ" },
  { code: "AR", name: "Argentina", currency: "ARS", symbol: "$", locale: "es-AR" },
  { code: "AU", name: "Australia", currency: "AUD", symbol: "A$", locale: "en-AU" },
  { code: "AT", name: "Austria", currency: "EUR", symbol: "€", locale: "de-AT" },
  { code: "BH", name: "Bahrain", currency: "BHD", symbol: ".د.ب", locale: "ar-BH" },
  { code: "BD", name: "Bangladesh", currency: "BDT", symbol: "৳", locale: "bn-BD" },
  { code: "BE", name: "Belgium", currency: "EUR", symbol: "€", locale: "nl-BE" },
  { code: "BR", name: "Brazil", currency: "BRL", symbol: "R$", locale: "pt-BR" },
  { code: "BN", name: "Brunei", currency: "BND", symbol: "B$", locale: "ms-BN" },
  { code: "KH", name: "Cambodia", currency: "KHR", symbol: "៛", locale: "km-KH" },
  { code: "CA", name: "Canada", currency: "CAD", symbol: "C$", locale: "en-CA" },
  { code: "CL", name: "Chile", currency: "CLP", symbol: "$", locale: "es-CL" },
  { code: "CN", name: "China", currency: "CNY", symbol: "¥", locale: "zh-CN" },
  { code: "CO", name: "Colombia", currency: "COP", symbol: "$", locale: "es-CO" },
  { code: "CZ", name: "Czech Republic", currency: "CZK", symbol: "Kč", locale: "cs-CZ" },
  { code: "DK", name: "Denmark", currency: "DKK", symbol: "kr", locale: "da-DK" },
  { code: "EG", name: "Egypt", currency: "EGP", symbol: "£", locale: "ar-EG" },
  { code: "ET", name: "Ethiopia", currency: "ETB", symbol: "Br", locale: "am-ET" },
  { code: "FI", name: "Finland", currency: "EUR", symbol: "€", locale: "fi-FI" },
  { code: "FR", name: "France", currency: "EUR", symbol: "€", locale: "fr-FR" },
  { code: "DE", name: "Germany", currency: "EUR", symbol: "€", locale: "de-DE" },
  { code: "GH", name: "Ghana", currency: "GHS", symbol: "₵", locale: "en-GH" },
  { code: "GR", name: "Greece", currency: "EUR", symbol: "€", locale: "el-GR" },
  { code: "HK", name: "Hong Kong", currency: "HKD", symbol: "HK$", locale: "zh-HK" },
  { code: "HU", name: "Hungary", currency: "HUF", symbol: "Ft", locale: "hu-HU" },
  { code: "IN", name: "India", currency: "INR", symbol: "₹", locale: "hi-IN" },
  { code: "ID", name: "Indonesia", currency: "IDR", symbol: "Rp", locale: "id-ID" },
  { code: "IR", name: "Iran", currency: "IRR", symbol: "﷼", locale: "fa-IR" },
  { code: "IQ", name: "Iraq", currency: "IQD", symbol: "ع.د", locale: "ar-IQ" },
  { code: "IE", name: "Ireland", currency: "EUR", symbol: "€", locale: "en-IE" },
  { code: "IL", name: "Israel", currency: "ILS", symbol: "₪", locale: "he-IL" },
  { code: "IT", name: "Italy", currency: "EUR", symbol: "€", locale: "it-IT" },
  { code: "JP", name: "Japan", currency: "JPY", symbol: "¥", locale: "ja-JP" },
  { code: "JO", name: "Jordan", currency: "JOD", symbol: "د.ا", locale: "ar-JO" },
  { code: "KE", name: "Kenya", currency: "KES", symbol: "KSh", locale: "en-KE" },
  { code: "KW", name: "Kuwait", currency: "KWD", symbol: "د.ك", locale: "ar-KW" },
  { code: "LB", name: "Lebanon", currency: "LBP", symbol: "ل.ل", locale: "ar-LB" },
  { code: "LY", name: "Libya", currency: "LYD", symbol: "ل.د", locale: "ar-LY" },
  { code: "MY", name: "Malaysia", currency: "MYR", symbol: "RM", locale: "ms-MY" },
  { code: "MV", name: "Maldives", currency: "MVR", symbol: "Rf", locale: "dv-MV" },
  { code: "MX", name: "Mexico", currency: "MXN", symbol: "$", locale: "es-MX" },
  { code: "MA", name: "Morocco", currency: "MAD", symbol: "د.م.", locale: "ar-MA" },
  { code: "MM", name: "Myanmar", currency: "MMK", symbol: "K", locale: "my-MM" },
  { code: "NP", name: "Nepal", currency: "NPR", symbol: "₨", locale: "ne-NP" },
  { code: "NL", name: "Netherlands", currency: "EUR", symbol: "€", locale: "nl-NL" },
  { code: "NZ", name: "New Zealand", currency: "NZD", symbol: "NZ$", locale: "en-NZ" },
  { code: "NG", name: "Nigeria", currency: "NGN", symbol: "₦", locale: "en-NG" },
  { code: "NO", name: "Norway", currency: "NOK", symbol: "kr", locale: "nb-NO" },
  { code: "OM", name: "Oman", currency: "OMR", symbol: "ر.ع.", locale: "ar-OM" },
  { code: "PK", name: "Pakistan", currency: "PKR", symbol: "₨", locale: "ur-PK" },
  { code: "PS", name: "Palestine", currency: "ILS", symbol: "₪", locale: "ar-PS" },
  { code: "PE", name: "Peru", currency: "PEN", symbol: "S/", locale: "es-PE" },
  { code: "PH", name: "Philippines", currency: "PHP", symbol: "₱", locale: "en-PH" },
  { code: "PL", name: "Poland", currency: "PLN", symbol: "zł", locale: "pl-PL" },
  { code: "PT", name: "Portugal", currency: "EUR", symbol: "€", locale: "pt-PT" },
  { code: "QA", name: "Qatar", currency: "QAR", symbol: "ر.ق", locale: "ar-QA" },
  { code: "RO", name: "Romania", currency: "RON", symbol: "lei", locale: "ro-RO" },
  { code: "RU", name: "Russia", currency: "RUB", symbol: "₽", locale: "ru-RU" },
  { code: "SA", name: "Saudi Arabia", currency: "SAR", symbol: "﷼", locale: "ar-SA" },
  { code: "SG", name: "Singapore", currency: "SGD", symbol: "S$", locale: "en-SG" },
  { code: "ZA", name: "South Africa", currency: "ZAR", symbol: "R", locale: "en-ZA" },
  { code: "KR", name: "South Korea", currency: "KRW", symbol: "₩", locale: "ko-KR" },
  { code: "ES", name: "Spain", currency: "EUR", symbol: "€", locale: "es-ES" },
  { code: "LK", name: "Sri Lanka", currency: "LKR", symbol: "Rs", locale: "si-LK" },
  { code: "SD", name: "Sudan", currency: "SDG", symbol: "ج.س.", locale: "ar-SD" },
  { code: "SE", name: "Sweden", currency: "SEK", symbol: "kr", locale: "sv-SE" },
  { code: "CH", name: "Switzerland", currency: "CHF", symbol: "CHF", locale: "de-CH" },
  { code: "TW", name: "Taiwan", currency: "TWD", symbol: "NT$", locale: "zh-TW" },
  { code: "TH", name: "Thailand", currency: "THB", symbol: "฿", locale: "th-TH" },
  { code: "TN", name: "Tunisia", currency: "TND", symbol: "د.ت", locale: "ar-TN" },
  { code: "TR", name: "Turkey", currency: "TRY", symbol: "₺", locale: "tr-TR" },
  { code: "AE", name: "UAE", currency: "AED", symbol: "د.إ", locale: "ar-AE" },
  { code: "GB", name: "United Kingdom", currency: "GBP", symbol: "£", locale: "en-GB" },
  { code: "US", name: "United States", currency: "USD", symbol: "$", locale: "en-US" },
  { code: "VN", name: "Vietnam", currency: "VND", symbol: "₫", locale: "vi-VN" },
  { code: "YE", name: "Yemen", currency: "YER", symbol: "﷼", locale: "ar-YE" },
];

const LANGUAGES = [
  { code: "en" as Lang, name: "English", native: "English" },
  { code: "hi" as Lang, name: "Hindi", native: "हिन्दी" },
  { code: "bn" as Lang, name: "Bangla", native: "বাংলা" },
];

interface GlobalSettingsProps {
  only?: "region" | "language";
}

export default function GlobalSettings({ only }: GlobalSettingsProps) {
  const { lang, setLang, t } = useLanguage();
  const [country, setCountry] = useState("BD");
  const [saved, setSaved] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const showRegion = only !== "language";
  const showLanguage = only !== "region";

  const selectedCountry = COUNTRIES.find((c) => c.code === country)!;

  const handleSave = () => {
    setLastUpdated(new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "medium" }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setCountry("BD");
    setLang("en");
  };

  return (
    <div className="space-y-8">
      {showRegion && (
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Globe size={18} className="text-primary" />
          <h3 className="text-base font-semibold text-foreground">{t.globalSettings}</h3>
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">{t.selectCountry} <span className="text-destructive">*</span></Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      )}

      {showRegion && (
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign size={18} className="text-primary" />
          <h3 className="text-base font-semibold text-foreground">{t.currency}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">{t.currencyCode}</Label>
            <div className="px-3 py-2.5 rounded-lg bg-muted text-sm text-foreground font-medium">{selectedCountry.currency}</div>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">{t.currencySymbol}</Label>
            <div className="px-3 py-2.5 rounded-lg bg-muted text-sm text-foreground font-medium">{selectedCountry.symbol}</div>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">{t.currencyLocale}</Label>
            <div className="px-3 py-2.5 rounded-lg bg-muted text-sm text-foreground font-medium">{selectedCountry.locale}</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t.currencyAutoFill}</p>
      </div>
      )}

      {showLanguage && (
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Languages size={18} className="text-primary" />
          <h3 className="text-base font-semibold text-foreground">{t.websiteLanguage}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`p-4 rounded-lg border text-left transition-all ${
                lang === l.code
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "border-border bg-secondary hover:border-primary/40"
              }`}
            >
              <p className="font-semibold text-foreground">{l.native}</p>
              <p className="text-xs text-muted-foreground">{l.name}</p>
            </button>
          ))}
        </div>
      </div>
      )}

      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={18} className="text-primary" />
          <h3 className="text-base font-semibold text-foreground">{t.currentActiveSettings}</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.country}</p>
            <p className="text-sm font-medium text-foreground">{selectedCountry.name} ({selectedCountry.code})</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.currency}</p>
            <p className="text-sm font-medium text-foreground">{selectedCountry.symbol} {selectedCountry.currency}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.language}</p>
            <p className="text-sm font-medium text-foreground">{lang.toUpperCase()}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.lastUpdated}</p>
            <p className="text-sm font-medium text-foreground">{lastUpdated || t.notSavedYet}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSave} className="gap-2">
          <Save size={16} /> {saved ? t.saved : t.saveSettings}
        </Button>
        <Button variant="outline" onClick={handleReset} className="gap-2">
          <RotateCcw size={16} /> {t.resetToDefault}
        </Button>
      </div>
    </div>
  );
}

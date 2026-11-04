import { useState, useEffect } from "react";
import { Download, Check, Share, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-2xl overflow-hidden shadow-lg">
          <img src="/pwa-512x512.png" alt="App icon" className="w-full h-full object-cover" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground">MessMate</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Install for a faster, app-like experience
          </p>
        </div>

        {installed ? (
          <div className="flex items-center justify-center gap-2 text-primary font-medium">
            <Check size={20} />
            <span>App installed!</span>
          </div>
        ) : isIOS ? (
          <div className="bg-card border border-border rounded-xl p-4 text-left space-y-3">
            <p className="text-sm font-medium text-foreground">To install on iOS:</p>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <Share size={18} className="flex-shrink-0 mt-0.5 text-primary" />
              <span>Tap the <strong>Share</strong> button in Safari</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <Smartphone size={18} className="flex-shrink-0 mt-0.5 text-primary" />
              <span>Select <strong>Add to Home Screen</strong></span>
            </div>
          </div>
        ) : deferredPrompt ? (
          <Button onClick={handleInstall} size="lg" className="w-full gap-2">
            <Download size={18} />
            Install App
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Open this page in your mobile browser to install
          </p>
        )}

        <div className="grid grid-cols-3 gap-3 pt-4">
          {["Offline Access", "Fast & Light", "No App Store"].map((feature) => (
            <div key={feature} className="bg-card border border-border rounded-lg p-3">
              <p className="text-xs font-medium text-foreground">{feature}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

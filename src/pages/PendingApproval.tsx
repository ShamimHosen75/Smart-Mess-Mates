import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Clock, LogOut, RefreshCw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

export default function PendingApproval() {
  const { signOut, refreshApproval } = useAuth();
  const { t } = useLanguage();
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    await refreshApproval();
    setTimeout(() => setChecking(false), 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Clock className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {(t as any).pendingApprovalTitle || "Account Pending Approval"}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {(t as any).pendingApprovalDesc || "Your account has been created successfully. An admin or manager will review and approve your account shortly. You'll get full access once approved."}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button onClick={handleCheck} variant="outline" className="gap-2" disabled={checking}>
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            {(t as any).checkStatus || "Check Status"}
          </Button>
          <Button onClick={signOut} variant="ghost" className="gap-2 text-muted-foreground">
            <LogOut className="w-4 h-4" />
            {t.signOut}
          </Button>
        </div>
      </div>
    </div>
  );
}

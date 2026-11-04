import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMess } from "@/contexts/MessContext";
import { Button } from "@/components/ui/button";
import { UserCheck, UserX, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PendingUser {
  id: string;
  user_id: string;
  full_name: string | null;
  created_at: string;
}

export default function PendingApprovals() {
  const { userRole } = useAuth();
  const { allMesses, currentMess } = useMess();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [selectedMess, setSelectedMess] = useState<Record<string, string>>({});

  const isSuperAdmin = userRole === "super_admin";
  const canApprove = isSuperAdmin || userRole === "admin" || userRole === "moderator";

  useEffect(() => {
    if (!canApprove) {
      setLoading(false);
      return;
    }
    fetchPending();
  }, [canApprove]);

  const fetchPending = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, created_at")
      .eq("is_approved", false)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPending(data);
    }
    setLoading(false);
  };

  const approveUser = async (profileId: string, fullName: string | null) => {
    // Regular admins always use their own mess; super admins pick from dropdown
    const messId = isSuperAdmin ? selectedMess[profileId] : currentMess?.id;
    if (!messId) {
      toast({ title: "Select a mess", description: isSuperAdmin ? "Please select which mess to assign this user to." : "You are not assigned to any mess.", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ is_approved: true, mess_id: messId } as any)
      .eq("id", profileId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: (t as any).approved || "Approved!", description: `${fullName || "User"} ${(t as any).hasBeenApproved || "has been approved and added to the mess."}` });
      setPending((prev) => prev.filter((p) => p.id !== profileId));
    }
  };

  const rejectUser = async (profileId: string, userId: string) => {
    // Just remove from pending - admin can delete the auth user from backend if needed
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", profileId);

    if (!error) {
      toast({ title: (t as any).rejected || "Rejected", description: (t as any).userRejected || "User request has been rejected." });
      setPending((prev) => prev.filter((p) => p.id !== profileId));
    }
  };

  if (!canApprove || loading || pending.length === 0) return null;

  return (
    <div className="glass-card p-5 border-l-4 border-l-primary animate-fade-in">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-foreground">
              {(t as any).pendingApprovals || "Pending Approvals"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {pending.length} {(t as any).newSignups || "new signup(s) waiting for approval"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-destructive/20 text-destructive text-xs font-bold flex items-center justify-center">
            {pending.length}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {pending.map((user) => (
            <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {user.full_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{user.full_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isSuperAdmin ? (
                  <Select
                    value={selectedMess[user.id] || ""}
                    onValueChange={(v) => setSelectedMess((prev) => ({ ...prev, [user.id]: v }))}
                  >
                    <SelectTrigger className="h-8 w-[140px] text-xs bg-secondary border-border">
                      <SelectValue placeholder="Select mess" />
                    </SelectTrigger>
                    <SelectContent>
                      {allMesses.map((mess) => (
                        <SelectItem key={mess.id} value={mess.id}>{mess.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : currentMess ? (
                  <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-secondary">
                    → {currentMess.name}
                  </span>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => rejectUser(user.id, user.user_id)}
                >
                  <UserX className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  className="h-8 px-3 gap-1.5"
                  onClick={() => approveUser(user.id, user.full_name)}
                >
                  <UserCheck className="w-4 h-4" />
                  {(t as any).approve || "Approve"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

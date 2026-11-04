import { useCallback, useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  ShieldCheck, Loader2, RefreshCcw, Search, UserX, UserCheck,
  Mail, Trash2, Copy, Check, ShieldAlert, Calculator,
} from "lucide-react";

type AppRole = "super_admin" | "admin" | "moderator" | "user";

interface AdminUser {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  full_name: string | null;
  mess_id: string | null;
  is_approved: boolean;
  is_suspended: boolean;
  avatar_url: string | null;
  roles: AppRole[];
}

interface MessRow { id: string; name: string }

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "moderator", label: "Manager" },
  { value: "user", label: "Member" },
];

const roleLabel = (r: AppRole) => ROLE_OPTIONS.find((o) => o.value === r)?.label ?? r;

const roleBadgeClass: Record<AppRole, string> = {
  super_admin: "bg-primary/15 text-primary border-primary/30",
  admin: "bg-info/15 text-info border-info/30",
  moderator: "bg-accent/40 text-accent-foreground border-border",
  user: "bg-secondary text-foreground border-border",
};

export default function AdminUsers() {
  const { user, userRole, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [messes, setMesses] = useState<MessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | AppRole>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "active" | "suspended">("all");
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [reinviteState, setReinviteState] = useState<{ email: string; link: string | null } | null>(null);
  const [copied, setCopied] = useState(false);
  const [recalcing, setRecalcing] = useState(false);

  const isSuper = userRole === "super_admin";

  const callAdmin = useCallback(async <T,>(body: unknown): Promise<T> => {
    const { data, error } = await supabase.functions.invoke("admin-users", { body });
    if (error) throw new Error(error.message);
    if (data && (data as any).error) throw new Error((data as any).error);
    return data as T;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { users, messes } = await callAdmin<{ users: AdminUser[]; messes: MessRow[] }>({ type: "list" });
      setUsers(users);
      setMesses(messes);
    } catch (e: any) {
      toast.error(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [callAdmin]);

  useEffect(() => {
    if (isSuper) void load();
  }, [isSuper, load]);

  const run = async (id: string, fn: () => Promise<void>, successMsg: string) => {
    setBusyId(id);
    try {
      await fn();
      toast.success(successMsg);
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const setRole = (u: AdminUser, role: AppRole) =>
    run(u.id, async () => {
      await callAdmin({ type: "set_role", userId: u.id, role });
      setUsers((prev) => prev.map((p) => (p.id === u.id ? { ...p, roles: [role] } : p)));
    }, `Role updated to ${roleLabel(role)}`);

  const setMess = (u: AdminUser, messId: string | null) =>
    run(u.id, async () => {
      await callAdmin({ type: "set_mess", userId: u.id, messId });
      setUsers((prev) => prev.map((p) => (p.id === u.id ? { ...p, mess_id: messId } : p)));
    }, messId ? "Mess assigned" : "Mess cleared");

  const toggleApproved = (u: AdminUser) =>
    run(u.id, async () => {
      await callAdmin({ type: "set_approved", userId: u.id, approved: !u.is_approved });
      setUsers((prev) => prev.map((p) => (p.id === u.id ? { ...p, is_approved: !u.is_approved } : p)));
    }, !u.is_approved ? "User approved" : "Approval revoked");

  const toggleSuspended = (u: AdminUser) =>
    run(u.id, async () => {
      await callAdmin({ type: "set_suspended", userId: u.id, suspended: !u.is_suspended });
      setUsers((prev) => prev.map((p) => (p.id === u.id ? { ...p, is_suspended: !u.is_suspended } : p)));
    }, !u.is_suspended ? "User suspended" : "User reactivated");

  const reinvite = (u: AdminUser) =>
    run(u.id, async () => {
      const res = await callAdmin<{ action_link: string | null; email: string }>({ type: "reinvite", userId: u.id });
      setReinviteState({ email: res.email, link: res.action_link });
    }, "Re-invite link generated");

  const removeUser = async () => {
    if (!deleteUser) return;
    await run(deleteUser.id, async () => {
      await callAdmin({ type: "delete_user", userId: deleteUser.id });
      setUsers((prev) => prev.filter((p) => p.id !== deleteUser.id));
      setDeleteUser(null);
    }, "User deleted");
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (q && !((u.email ?? "").toLowerCase().includes(q) || (u.full_name ?? "").toLowerCase().includes(q))) return false;
      if (filterRole !== "all" && !u.roles.includes(filterRole)) return false;
      if (filterStatus === "pending" && u.is_approved) return false;
      if (filterStatus === "active" && (!u.is_approved || u.is_suspended)) return false;
      if (filterStatus === "suspended" && !u.is_suspended) return false;
      return true;
    });
  }, [users, search, filterRole, filterStatus]);

  const messName = (id: string | null) => (id ? messes.find((m) => m.id === id)?.name ?? "—" : "—");

  const recalcAll = async () => {
    setRecalcing(true);
    try {
      const { data, error } = await supabase.rpc("recalculate_all_totals");
      if (error) throw new Error(error.message);
      const n = (data as any)?.members_updated ?? 0;
      toast.success(`Recalculated meals & balances for ${n} member${n === 1 ? "" : "s"}`);
    } catch (e: any) {
      toast.error(e.message || "Recalculation failed");
    } finally {
      setRecalcing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isSuper) {
    return (
      <AppLayout title="Admin" subtitle="Super admin only" icon={<ShieldAlert className="text-destructive" size={22} />}>
        <div className="glass-card p-8 text-center max-w-md mx-auto mt-12">
          <ShieldAlert className="mx-auto text-destructive mb-3" size={36} />
          <h2 className="text-lg font-bold text-foreground mb-1">Access denied</h2>
          <p className="text-sm text-muted-foreground">This area is restricted to super admins.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="User Administration"
      subtitle="Manage users, roles, messes, suspensions, and re-invites"
      icon={<ShieldCheck className="text-primary" size={22} />}
    >
      <div className="space-y-4 animate-fade-in">
        {/* Maintenance */}
        <div className="glass-card p-3 md:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calculator size={15} className="text-primary" /> Recalculate all meals &amp; balances
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Rebuilds every member's meal totals and advance contributions from the daily entries (source of truth).
            </p>
          </div>
          <Button onClick={recalcAll} disabled={recalcing} className="gap-2 shrink-0">
            {recalcing ? <Loader2 size={14} className="animate-spin" /> : <Calculator size={14} />}
            {recalcing ? "Recalculating…" : "Recalculate"}
          </Button>
        </div>

        {/* Filters */}

        <div className="glass-card p-3 md:p-4 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>
          <Select value={filterRole} onValueChange={(v) => setFilterRole(v as any)}>
            <SelectTrigger className="md:w-44 bg-secondary border-border">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {ROLE_OPTIONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
            <SelectTrigger className="md:w-44 bg-secondary border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending approval</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>

        {/* Users list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-10 text-center text-sm text-muted-foreground">No users match these filters.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map((u) => {
              const primaryRole = (u.roles[0] ?? "user") as AppRole;
              const isSelf = u.id === user.id;
              return (
                <div key={u.id} className="glass-card p-4 md:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Identity */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover ring-1 ring-border" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold">
                          {(u.full_name ?? u.email ?? "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground truncate">{u.full_name || "Unnamed"}</p>
                          {isSelf && <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">You</span>}
                          {u.is_suspended && <Badge variant="destructive" className="h-5 text-[10px]">Suspended</Badge>}
                          {!u.is_approved && !u.is_suspended && <Badge variant="secondary" className="h-5 text-[10px]">Pending</Badge>}
                          {u.is_approved && !u.is_suspended && <Badge className="h-5 text-[10px] bg-success/15 text-success border-success/30 hover:bg-success/15">Active</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Joined {new Date(u.created_at).toLocaleDateString()}
                          {u.last_sign_in_at && ` · Last sign-in ${new Date(u.last_sign_in_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-2 lg:gap-3 w-full lg:w-auto">
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Role</Label>
                        <Select
                          value={primaryRole}
                          onValueChange={(v) => setRole(u, v as AppRole)}
                          disabled={busyId === u.id || (isSelf && primaryRole === "super_admin")}
                        >
                          <SelectTrigger className="h-9 w-full lg:w-40 bg-secondary border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((r) => (
                              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Mess</Label>
                        <Select
                          value={u.mess_id ?? "none"}
                          onValueChange={(v) => setMess(u, v === "none" ? null : v)}
                          disabled={busyId === u.id}
                        >
                          <SelectTrigger className="h-9 w-full lg:w-44 bg-secondary border-border">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {messes.map((m) => (
                              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-border/40">
                    <Badge variant="outline" className={`${roleBadgeClass[primaryRole]} text-[10px]`}>
                      {roleLabel(primaryRole)}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">· Mess: {messName(u.mess_id)}</span>
                    <div className="ml-auto flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => toggleApproved(u)} disabled={busyId === u.id} className="gap-1.5 h-8">
                        <UserCheck size={13} />
                        {u.is_approved ? "Revoke approval" : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant={u.is_suspended ? "outline" : "outline"}
                        onClick={() => toggleSuspended(u)}
                        disabled={busyId === u.id || isSelf}
                        className={`gap-1.5 h-8 ${u.is_suspended ? "" : "text-destructive hover:text-destructive"}`}
                      >
                        <UserX size={13} />
                        {u.is_suspended ? "Reactivate" : "Suspend"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => reinvite(u)} disabled={busyId === u.id} className="gap-1.5 h-8">
                        <Mail size={13} /> Re-invite
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteUser(u)}
                        disabled={busyId === u.id || isSelf}
                        className="gap-1.5 h-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 size={13} /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <Dialog open={!!deleteUser} onOpenChange={(o) => !o && setDeleteUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete user</DialogTitle>
            <DialogDescription>
              This permanently deletes <span className="font-semibold text-foreground">{deleteUser?.email}</span> and all
              of their linked data (profile, members, meal entries, advances). This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setDeleteUser(null)}>Cancel</Button>
            <Button variant="destructive" onClick={removeUser}>Delete permanently</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Re-invite link */}
      <Dialog open={!!reinviteState} onOpenChange={(o) => { if (!o) { setReinviteState(null); setCopied(false); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Re-invite link</DialogTitle>
            <DialogDescription>
              A password-recovery link was sent to <span className="font-semibold text-foreground">{reinviteState?.email}</span>.
              You can also share the direct link below.
            </DialogDescription>
          </DialogHeader>
          {reinviteState?.link ? (
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Recovery link</Label>
              <div className="flex gap-2">
                <Input readOnly value={reinviteState.link} className="bg-secondary font-mono text-xs" />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(reinviteState.link!);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="gap-1.5"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No link returned — check your email provider.</p>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

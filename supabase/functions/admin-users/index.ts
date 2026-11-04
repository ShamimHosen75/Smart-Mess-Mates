import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type Action =
  | { type: "list" }
  | { type: "set_role"; userId: string; role: "super_admin" | "admin" | "moderator" | "user" }
  | { type: "set_mess"; userId: string; messId: string | null }
  | { type: "set_approved"; userId: string; approved: boolean }
  | { type: "set_suspended"; userId: string; suspended: boolean }
  | { type: "reinvite"; userId: string }
  | { type: "delete_user"; userId: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const callerId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE);

    const { data: isSuper, error: roleErr } = await admin.rpc("has_role", {
      _user_id: callerId,
      _role: "super_admin",
    });
    if (roleErr || !isSuper) return json({ error: "Forbidden: super admin only" }, 403);

    const body = (await req.json()) as Action;
    if (!body || typeof body !== "object" || !("type" in body)) {
      return json({ error: "Invalid request body" }, 400);
    }

    switch (body.type) {
      case "list": {
        const { data: list, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 500 });
        if (error) return json({ error: error.message }, 500);
        const ids = list.users.map((u) => u.id);
        const [profilesRes, rolesRes, messesRes] = await Promise.all([
          admin.from("profiles").select("user_id, full_name, mess_id, is_approved, is_suspended, avatar_url").in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
          admin.from("user_roles").select("user_id, role").in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
          admin.from("messes").select("id, name").order("name"),
        ]);
        const profByUser = new Map((profilesRes.data ?? []).map((p: any) => [p.user_id, p]));
        const rolesByUser = new Map<string, string[]>();
        for (const r of (rolesRes.data ?? []) as any[]) {
          const arr = rolesByUser.get(r.user_id) ?? [];
          arr.push(r.role);
          rolesByUser.set(r.user_id, arr);
        }
        const users = list.users.map((u) => {
          const p: any = profByUser.get(u.id) ?? {};
          return {
            id: u.id,
            email: u.email,
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at,
            email_confirmed_at: u.email_confirmed_at,
            full_name: p.full_name ?? null,
            mess_id: p.mess_id ?? null,
            is_approved: p.is_approved ?? false,
            is_suspended: p.is_suspended ?? false,
            avatar_url: p.avatar_url ?? null,
            roles: rolesByUser.get(u.id) ?? ["user"],
          };
        });
        return json({ users, messes: messesRes.data ?? [] });
      }

      case "set_role": {
        if (body.userId === callerId && body.role !== "super_admin") {
          return json({ error: "You cannot remove your own super admin role." }, 400);
        }
        await admin.from("user_roles").delete().eq("user_id", body.userId);
        const { error } = await admin.from("user_roles").insert({ user_id: body.userId, role: body.role });
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }

      case "set_mess": {
        const { error } = await admin.from("profiles").update({ mess_id: body.messId }).eq("user_id", body.userId);
        if (error) return json({ error: error.message }, 500);
        // also propagate to member record
        const { data: prof } = await admin.from("profiles").select("id").eq("user_id", body.userId).maybeSingle();
        if (prof) await admin.from("members").update({ mess_id: body.messId }).eq("profile_id", prof.id);
        return json({ ok: true });
      }

      case "set_approved": {
        const { error } = await admin.from("profiles").update({ is_approved: body.approved }).eq("user_id", body.userId);
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }

      case "set_suspended": {
        if (body.userId === callerId && body.suspended) {
          return json({ error: "You cannot suspend yourself." }, 400);
        }
        const { error } = await admin.from("profiles").update({ is_suspended: body.suspended }).eq("user_id", body.userId);
        if (error) return json({ error: error.message }, 500);
        // Revoke active sessions when suspending
        if (body.suspended) {
          await admin.auth.admin.signOut(body.userId, "global").catch(() => {});
        }
        return json({ ok: true });
      }

      case "reinvite": {
        const { data: u, error: getErr } = await admin.auth.admin.getUserById(body.userId);
        if (getErr || !u.user?.email) return json({ error: "User not found" }, 404);
        const origin = req.headers.get("origin") ?? "";
        const { data, error } = await admin.auth.admin.generateLink({
          type: "recovery",
          email: u.user.email,
          options: { redirectTo: origin ? `${origin}/auth` : undefined },
        });
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true, action_link: data?.properties?.action_link ?? null, email: u.user.email });
      }

      case "delete_user": {
        if (body.userId === callerId) return json({ error: "You cannot delete yourself." }, 400);
        const { error } = await admin.auth.admin.deleteUser(body.userId);
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

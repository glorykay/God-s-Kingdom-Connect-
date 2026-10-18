import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: "Server not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const reminderId = body.reminder_id as string | undefined;

    if (reminderId) {
      const { data: reminder } = await supabase
        .from("reminders")
        .select("*")
        .eq("id", reminderId)
        .maybeSingle();

      if (!reminder) {
        return new Response(
          JSON.stringify({ error: "Reminder not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: members } = await supabase
        .from("members")
        .select("first_name, last_name, email, phone")
        .eq("workspace_id", reminder.workspace_id);

      const channel = reminder.channel as string;
      const recipientCount = (members ?? []).filter((m: Record<string, string | null>) => {
        if (channel === "email") return !!m.email;
        if (channel === "sms") return !!m.phone;
        return !!m.email || !!m.phone;
      }).length;

      await supabase
        .from("reminders")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", reminderId);

      return new Response(
        JSON.stringify({
          success: true,
          reminder_id: reminderId,
          recipients: recipientCount,
          channel,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Batch mode: process all due scheduled reminders
    const now = new Date().toISOString();
    const { data: dueReminders } = await supabase
      .from("reminders")
      .select("*")
      .eq("status", "scheduled")
      .lte("send_at", now);

    let processed = 0;
    for (const r of dueReminders ?? []) {
      await supabase
        .from("reminders")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", r.id);

      processed++;
    }

    return new Response(
      JSON.stringify({ success: true, processed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

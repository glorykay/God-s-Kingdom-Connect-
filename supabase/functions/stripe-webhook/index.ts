import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function verifyStripeSignature(payload: string, signature: string, secret: string): Promise<Record<string, unknown> | null> {
  const parts = signature.split(",").map((s) => s.trim());
  let timestamp = "";
  let v1Signature = "";
  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "t") timestamp = value;
    if (key === "v1") v1Signature = value;
  }
  if (!timestamp || !v1Signature) return null;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
  const computedSig = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (computedSig !== v1Signature) return null;

  const event = JSON.parse(payload);
  const ageSeconds = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
  if (ageSeconds > 300) return null;

  return event;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.text();
    const signature = req.headers.get("stripe-signature") ?? "";

    const event = await verifyStripeSignature(payload, signature, webhookSecret);
    if (!event) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const eventType = event.type;
    const data = event.data?.object as Record<string, unknown>;

    if (eventType === "checkout.session.completed") {
      const metadata = (data.metadata ?? {}) as Record<string, string>;
      const workspaceId = metadata.workspace_id;
      const subscriptionId = data.subscription as string;

      if (workspaceId && subscriptionId) {
        // Fetch subscription from Stripe to get current period end
        const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
          headers: { Authorization: `Bearer ${stripeKey}` },
        });
        const sub = await subRes.json();

        await supabase
          .from("workspaces")
          .update({
            subscription_status: "active",
            stripe_subscription_id: subscriptionId,
            subscription_end: new Date((sub as { current_period_end: number }).current_period_end * 1000).toISOString(),
          })
          .eq("id", workspaceId);
      }
    } else if (eventType === "invoice.paid") {
      const subscriptionId = data.subscription as string;
      const lines = data.lines?.data as Array<{ period?: { end: number } }>;
      const periodEnd = lines?.[0]?.period?.end;

      if (subscriptionId) {
        // Find workspace by subscription ID
        const { data: wsRows } = await supabase
          .from("workspaces")
          .select("id")
          .eq("stripe_subscription_id", subscriptionId)
          .maybeSingle();

        if (wsRows && periodEnd) {
          await supabase
            .from("workspaces")
            .update({
              subscription_status: "active",
              subscription_end: new Date(periodEnd * 1000).toISOString(),
            })
            .eq("id", (wsRows as { id: string }).id);
        }
      }
    } else if (eventType === "customer.subscription.updated") {
      const subscriptionId = data.id as string;
      const status = data.status as string;
      const periodEnd = (data as { current_period_end?: number }).current_period_end;

      const { data: wsRows } = await supabase
        .from("workspaces")
        .select("id")
        .eq("stripe_subscription_id", subscriptionId)
        .maybeSingle();

      if (wsRows) {
        const wsId = (wsRows as { id: string }).id;
        let dbStatus: string;
        if (status === "active") dbStatus = "active";
        else if (status === "past_due") dbStatus = "past_due";
        else if (status === "canceled") dbStatus = "canceled";
        else if (status === "unpaid" || status === "incomplete_expired") dbStatus = "expired";
        else dbStatus = status;

        await supabase
          .from("workspaces")
          .update({
            subscription_status: dbStatus,
            subscription_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : undefined,
          })
          .eq("id", wsId);
      }
    } else if (eventType === "customer.subscription.deleted") {
      const subscriptionId = data.id as string;

      const { data: wsRows } = await supabase
        .from("workspaces")
        .select("id")
        .eq("stripe_subscription_id", subscriptionId)
        .maybeSingle();

      if (wsRows) {
        await supabase
          .from("workspaces")
          .update({
            subscription_status: "canceled",
          })
          .eq("id", (wsRows as { id: string }).id);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Webhook handler error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

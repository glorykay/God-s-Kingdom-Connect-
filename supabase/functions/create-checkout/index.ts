import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Plan {
  nickname: string;
  productName: string;
  amount: string;
  interval: "month" | "year";
}

const PLANS: Record<string, Plan> = {
  monthly: {
    nickname: "God's Kingdom Connect Monthly $21",
    productName: "God's Kingdom Connect Monthly Subscription",
    amount: "2100",
    interval: "month",
  },
  yearly: {
    nickname: "God's Kingdom Connect Yearly $210",
    productName: "God's Kingdom Connect Yearly Subscription",
    amount: "21000",
    interval: "year",
  },
};

async function stripeRequest(stripeKey: string, path: string, params?: URLSearchParams): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: params ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      ...(params ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: params,
  });
  const data = await res.json() as Record<string, unknown>;
  if (!res.ok) {
    const stripeError = data.error as { message?: string } | undefined;
    throw new Error(stripeError?.message ?? "Stripe request failed");
  }
  return data;
}

async function getOrCreatePrice(stripeKey: string, plan: Plan): Promise<string> {
  const data = await stripeRequest(stripeKey, "prices?active=true&type=recurring&limit=100");
  const prices = Array.isArray(data.data)
    ? data.data as Array<{ id: string; nickname: string | null; unit_amount: number; recurring?: { interval: string } }>
    : [];
  const existing = prices.find(
    (price) =>
      price.nickname === plan.nickname &&
      String(price.unit_amount) === plan.amount &&
      price.recurring?.interval === plan.interval,
  );
  if (existing) return existing.id;

  const productParams = new URLSearchParams({ name: plan.productName });
  const product = await stripeRequest(stripeKey, "products", productParams);
  const productId = typeof product.id === "string" ? product.id : null;
  if (!productId) throw new Error("Stripe did not return a product ID");

  const priceParams = new URLSearchParams({
    product: productId,
    currency: "usd",
    unit_amount: plan.amount,
    "recurring[interval]": plan.interval,
    nickname: plan.nickname,
  });
  const price = await stripeRequest(stripeKey, "prices", priceParams);
  if (typeof price.id !== "string") throw new Error("Stripe did not return a price ID");
  return price.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey || !supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let planKey = "monthly";
    try {
      const body = await req.json();
      if (body?.plan === "yearly") planKey = "yearly";
    } catch {
      // no body or invalid JSON — default to monthly
    }
    const plan = PLANS[planKey];

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData } = await userClient.auth.getUser();
    if (!userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const email = userData.user.email ?? "";

    // Find workspace owned by this user
    const { data: ws } = await supabase
      .from("workspaces")
      .select("*")
      .eq("owner_user_id", userId)
      .maybeSingle();

    if (!ws) {
      return new Response(JSON.stringify({ error: "No workspace found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get or create Stripe customer
    let customerId = ws.stripe_customer_id;

    if (!customerId) {
      const customerParams = new URLSearchParams({
        email,
        "metadata[workspace_id]": ws.id,
      });
      const customer = await stripeRequest(stripeKey, "customers", customerParams);
      customerId = typeof customer.id === "string" ? customer.id : null;
      if (!customerId) throw new Error("Stripe did not return a customer ID");

      const { error: customerSaveError } = await supabase
        .from("workspaces")
        .update({ stripe_customer_id: customerId })
        .eq("id", ws.id);
      if (customerSaveError) throw new Error("Unable to save Stripe customer");
    }

    const priceId = await getOrCreatePrice(stripeKey, plan);
    const origin = req.headers.get("origin") ?? "http://localhost:5173";

    const params = new URLSearchParams();
    params.set("mode", "subscription");
    params.set("customer", customerId);
    params.set("line_items[0][price]", priceId);
    params.set("line_items[0][quantity]", "1");
    params.set("success_url", `${origin}/?checkout=success`);
    params.set("cancel_url", `${origin}/?checkout=cancelled`);
    params.set("metadata[workspace_id]", ws.id);
    params.set("metadata[plan]", planKey);
    params.set("subscription_data[metadata][workspace_id]", ws.id);
    params.set("subscription_data[metadata][plan]", planKey);

    const session = await stripeRequest(stripeKey, "checkout/sessions", params);
    if (typeof session.url !== "string") throw new Error("Stripe did not return a checkout URL");

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to start checkout";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

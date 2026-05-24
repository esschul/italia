import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Use ?date=YYYY-MM-DD for testing, otherwise today in Europe/Rome timezone
  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date");

  const today = dateParam
    ? dateParam
    : new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });

  // Try exact match first
  let { data, error } = await supabase
    .from("daily_content")
    .select("*")
    .eq("display_date", today)
    .maybeSingle();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // No exact match — find the most recent past entry (handles gaps in countdown)
  if (!data) {
    const { data: fallback } = await supabase
      .from("daily_content")
      .select("*")
      .lte("display_date", today)
      .order("display_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    data = fallback;
  }

  if (!data) {
    return new Response(
      JSON.stringify({ error: "No content found for this date" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Compute days until trip start (July 11) if this is a countdown entry
  const tripStart = new Date("2026-07-11");
  const todayDate = new Date(today);
  const daysUntil = Math.ceil(
    (tripStart.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  return new Response(
    JSON.stringify({ ...data, days_until_trip: daysUntil > 0 ? daysUntil : null }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

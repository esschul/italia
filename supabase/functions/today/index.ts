import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Unsplash photo query per category / location ──────────────────────────────

function photoQuery(data: Record<string, unknown>): string {
  if (data.type === "itinerary" && data.location) {
    return `${data.location} italy travel`;
  }
  const map: Record<string, string> = {
    history:  "ancient rome ruins colosseum",
    recipe:   "italian food cuisine",
    culture:  "italy culture piazza",
    language: "tuscany italy village",
    nature:   "italy landscape amalfi",
  };
  return map[data.category as string] ?? "italy travel";
}

// ── Fetch a photo from Unsplash and cache it in the DB row ────────────────────

async function resolvePhoto(
  supabase: ReturnType<typeof createClient>,
  data: Record<string, unknown>,
): Promise<string | null> {
  // Already cached — use it
  if (data.illustration_url) return data.illustration_url as string;

  const accessKey = Deno.env.get("UNSPLASH_ACCESS_KEY");
  if (!accessKey) return null;

  try {
    const query = photoQuery(data);
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&content_filter=high&client_id=${accessKey}`,
    );
    if (!res.ok) return null;

    const photo = await res.json();
    const url: string | null = photo.urls?.regular ?? null;

    // Save to DB so subsequent loads skip the Unsplash call
    if (url) {
      await supabase
        .from("daily_content")
        .update({ illustration_url: url })
        .eq("id", data.id);
    }

    return url;
  } catch {
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const url     = new URL(req.url);
  const dateParam = url.searchParams.get("date");
  const today   = dateParam
    ? dateParam
    : new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });

  // Exact match first
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

  // Fall back to most recent past entry
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

  // Resolve photo (use cached or fetch fresh from Unsplash)
  const illustrationUrl = await resolvePhoto(supabase, data);

  // Days until trip
  const tripStart  = new Date("2026-07-11");
  const todayDate  = new Date(today);
  const daysUntil  = Math.ceil(
    (tripStart.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  return new Response(
    JSON.stringify({
      ...data,
      illustration_url: illustrationUrl,
      days_until_trip: daysUntil > 0 ? daysUntil : null,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

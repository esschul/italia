// Italy Trip Widget
const EDGE_URL = "https://cxgxnqxnocwippgeduex.supabase.co/functions/v1/today";

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchContent() {
  const req = new Request(EDGE_URL);
  return await req.loadJSON();
}

async function fetchImage(url) {
  try {
    const req = new Request(url);
    return await req.loadImage();
  } catch {
    return null;
  }
}

// ── Colors ────────────────────────────────────────────────────────────────────

const C = {
  white:    new Color("#FFFFFF"),
  offWhite: new Color("#F5F0E8"),
  gold:     new Color("#D4A843"),
  cardBg:   new Color("#FFFFFF18"),
  subtle:   new Color("#FFFFFF55"),
  dimText:  new Color("#FFFFFF99"),
  sky:      new Color("#7EC8E3"),
};

// ── Build the top photo section as a DrawContext composite ────────────────────
// Photo fills the area, gradient darkens toward the bottom,
// header + big number + subtitle sit on top.

async function makePhotoHeader(photo, data, width, height) {
  const dc = new DrawContext();
  dc.size = new Size(width, height);
  dc.opaque = true;

  // ── Photo (or solid fallback) ──────────────────────────────────────────────
  if (photo) {
    dc.drawImageInRect(photo, new Rect(0, 0, width, height));
  } else {
    dc.setFillColor(new Color("#1A1A2A"));
    dc.fillRect(new Rect(0, 0, width, height));
    // Large category emoji as placeholder
    dc.setFont(Font.systemFont(height * 0.55));
    dc.setTextColor(new Color("#FFFFFF33"));
    dc.drawTextInRect(
      categoryEmoji(data.category),
      new Rect(width / 2 - 60, height / 2 - 60, 120, 120)
    );
  }

  // ── Gradient overlay — darkens bottom two-thirds for legibility ───────────
  const steps = 12;
  for (let i = 0; i < steps; i++) {
    const t     = i / (steps - 1);
    const alpha = Math.pow(t, 1.4) * 0.82; // ease in
    const y     = (i / steps) * height;
    dc.setFillColor(new Color("#080808", alpha));
    dc.fillRect(new Rect(0, y, width, height / steps + 1));
  }

  // ── Header row: 🇮🇹 ITALY (left) + category chip (right) ─────────────────
  const pad = 18;
  dc.setTextColor(C.gold);
  dc.setFont(Font.boldSystemFont(11));
  dc.drawText("🇮🇹  ITALY", new Point(pad, 14));

  // Category chip — draw a rounded rect + text
  const chipLabel  = categoryLabel(data.category);
  dc.setFont(Font.boldSystemFont(9));
  const chipW  = chipLabel.length * 6.2 + 20;
  const chipH  = 20;
  const chipX  = width - pad - chipW;
  const chipY  = 11;
  const chipBg = chipColor(data.category);
  dc.setFillColor(chipBg);
  const chipPath = new Path();
  chipPath.addRoundedRect(new Rect(chipX, chipY, chipW, chipH), 5, 5);
  dc.addPath(chipPath);
  dc.fillPath();
  dc.setTextColor(C.white);
  dc.drawText(chipLabel, new Point(chipX + 8, chipY + 4));

  // ── Big number ────────────────────────────────────────────────────────────
  const numStr  = String(data.days_until_trip ?? "?");
  const numSize = numStr.length > 2 ? 74 : 86;
  dc.setFont(Font.boldSystemFont(numSize));
  dc.setTextColor(C.white);
  dc.drawText(numStr, new Point(pad, height - numSize - 26));

  // ── "days to go" subtitle ─────────────────────────────────────────────────
  dc.setFont(Font.mediumSystemFont(15));
  dc.setTextColor(new Color("#FFFFFFBB"));
  dc.drawText("days to go", new Point(pad + 3, height - 22));

  return dc.getImage();
}

// ── Countdown view ────────────────────────────────────────────────────────────

async function buildCountdown(w, data, size) {
  const grad = new LinearGradient();
  grad.colors    = [new Color("#111118"), new Color("#0D1A0D")];
  grad.locations = [0, 1];
  w.backgroundGradient = grad;
  w.setPadding(0, 0, 0, 0);

  const root = w.addStack();
  root.layoutVertically();
  root.setPadding(0, 0, 16, 0);

  // Photo header dimensions
  const WIDGET_W  = 360;
  const headerH   = size === "large" ? 218 : 108;

  const photo = data.illustration_url ? await fetchImage(data.illustration_url) : null;
  const headerImg = await makePhotoHeader(photo, data, WIDGET_W, headerH);

  const imgEl = root.addImage(headerImg);
  imgEl.imageSize = new Size(WIDGET_W, headerH);
  imgEl.cornerRadius = size === "large" ? 0 : 0; // widget corners handle rounding
  imgEl.applyFillingContentMode();

  root.addSpacer(12);

  // ── Fun fact ──────────────────────────────────────────────────────────────
  const factStack = root.addStack();
  factStack.setPadding(0, 18, 0, 18);
  const fact = factStack.addText(data.fun_fact ?? "");
  fact.font = Font.systemFont(size === "large" ? 13 : 11);
  fact.textColor = C.offWhite;
  fact.lineLimit = size === "large" ? 0 : 3;
  fact.minimumScaleFactor = 0.85;

  root.addSpacer();

  // ── Date footer ───────────────────────────────────────────────────────────
  const footerStack = root.addStack();
  footerStack.setPadding(0, 18, 0, 18);
  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Rome",
  });
  const dateLabel = footerStack.addText(dateStr);
  dateLabel.font = Font.systemFont(10);
  dateLabel.textColor = C.subtle;
}

// ── Itinerary view ────────────────────────────────────────────────────────────

async function buildItinerary(w, data, size) {
  const grad = new LinearGradient();
  grad.colors    = [new Color("#0A1628"), new Color("#0D2B3E"), new Color("#0A1E1A")];
  grad.locations = [0, 0.5, 1];
  w.backgroundGradient = grad;
  w.setPadding(0, 0, 0, 0);

  const root = w.addStack();
  root.layoutVertically();
  root.setPadding(18, 20, 16, 20);

  // ── Header ────────────────────────────────────────────────────────────────
  const header = root.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();

  const title = header.addText(data.title ?? "");
  title.font = Font.boldSystemFont(size === "large" ? 18 : 15);
  title.textColor = C.white;
  title.lineLimit = 1;
  title.minimumScaleFactor = 0.7;
  header.addSpacer();
  const flag = header.addText("🇮🇹");
  flag.font = Font.systemFont(16);

  if (data.location) {
    root.addSpacer(5);
    const loc = root.addText("📍  " + data.location);
    loc.font = Font.mediumSystemFont(12);
    loc.textColor = C.sky;
  }

  // ── Weather ───────────────────────────────────────────────────────────────
  if (data.weather_condition) {
    root.addSpacer(size === "large" ? 10 : 6);
    const wx = root.addStack();
    wx.layoutHorizontally();
    wx.centerAlignContent();
    wx.backgroundColor = C.cardBg;
    wx.cornerRadius = 10;
    wx.setPadding(size === "large" ? 8 : 4, 12, size === "large" ? 8 : 4, 12);
    wx.spacing = 6;

    const cond = wx.addText(data.weather_condition);
    cond.font = Font.systemFont(size === "large" ? 13 : 11);
    cond.textColor = C.white;
    wx.addSpacer();

    const temps = wx.addText(
      `${data.weather_temp_max ?? "--"}°  /  ${data.weather_temp_min ?? "--"}°`
    );
    temps.font = Font.boldSystemFont(size === "large" ? 15 : 12);
    temps.textColor = C.gold;

    if (data.weather_precip_pct > 0) {
      const rain = wx.addText(`  💧${data.weather_precip_pct}%`);
      rain.font = Font.systemFont(size === "large" ? 12 : 10);
      rain.textColor = C.sky;
    }
  }

  // ── Divider ───────────────────────────────────────────────────────────────
  root.addSpacer(size === "large" ? 12 : 8);
  const div = root.addStack();
  div.backgroundColor = C.gold;
  div.size = new Size(40, 2);
  div.cornerRadius = 1;
  root.addSpacer(size === "large" ? 10 : 8);

  // ── Description ───────────────────────────────────────────────────────────
  if (data.description) {
    const desc = root.addText(data.description);
    desc.font = Font.systemFont(size === "large" ? 13 : 12);
    desc.textColor = C.offWhite;
    desc.lineLimit = size === "large" ? 0 : 3;
    desc.minimumScaleFactor = 0.8;
  }

  root.addSpacer();

  // ── Fun fact ──────────────────────────────────────────────────────────────
  const factRow = root.addStack();
  factRow.layoutHorizontally();
  factRow.backgroundColor = C.cardBg;
  factRow.cornerRadius = 10;
  factRow.setPadding(size === "large" ? 8 : 5, 10, size === "large" ? 8 : 5, 10);

  const star = factRow.addText("✦  ");
  star.font = Font.boldSystemFont(10);
  star.textColor = C.gold;

  const fact = factRow.addText(data.fun_fact ?? "");
  fact.font = Font.italicSystemFont(size === "large" ? 12 : 10);
  fact.textColor = C.dimText;
  fact.lineLimit = size === "large" ? 0 : 2;
  fact.minimumScaleFactor = 0.8;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function categoryLabel(cat) {
  const map = {
    history:  "🏛 History",
    recipe:   "🍳 Recipe",
    culture:  "🎭 Culture",
    language: "💬 Italian",
    nature:   "🌿 Nature",
    joke:     "😄 Joke",
  };
  return map[cat] ?? "🇮🇹 Italy";
}

function categoryEmoji(cat) {
  const map = { history: "🏛", recipe: "🍝", culture: "🎭", language: "💬", nature: "🌿", joke: "😄" };
  return map[cat] ?? "🇮🇹";
}

function chipColor(cat) {
  const map = {
    history:  new Color("#6B3A2A"),
    recipe:   new Color("#2A4A1A"),
    culture:  new Color("#2A2A5A"),
    language: new Color("#3A2A5A"),
    nature:   new Color("#1A4A2A"),
    joke:     new Color("#4A3A1A"),
  };
  return map[cat] ?? new Color("#333333");
}

// ── Main ──────────────────────────────────────────────────────────────────────

const size = config.widgetFamily ?? "large";

let data;
try {
  data = await fetchContent();
} catch {
  const w = new ListWidget();
  w.addText("⚠️ Could not load").textColor = Color.white();
  Script.setWidget(w);
  Script.complete();
  throw new Error("fetch failed");
}

if (data.error) {
  const w = new ListWidget();
  const grad = new LinearGradient();
  grad.colors = [new Color("#2D1B0E"), new Color("#1A1A2A")];
  grad.locations = [0, 1];
  w.backgroundGradient = grad;
  w.setPadding(20, 20, 20, 20);
  const t1 = w.addText("🇮🇹  Italia");
  t1.font = Font.boldSystemFont(16);
  t1.textColor = C.gold;
  w.addSpacer(10);
  const t2 = w.addText("No content yet — run the seed SQL in Supabase to get started.");
  t2.font = Font.systemFont(13);
  t2.textColor = C.dimText;
  Script.setWidget(w);
  if (config.runsInApp) await w.presentLarge();
  Script.complete();
  return;
}

const widget = new ListWidget();
widget.url = EDGE_URL;

if (data.type === "itinerary") {
  await buildItinerary(widget, data, size);
} else {
  await buildCountdown(widget, data, size);
}

Script.setWidget(widget);
if (config.runsInApp) {
  if (size === "small")       await widget.presentSmall();
  else if (size === "medium") await widget.presentMedium();
  else                        await widget.presentLarge();
}
Script.complete();

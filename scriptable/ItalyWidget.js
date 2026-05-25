// Italy Trip Widget
const EDGE_URL = "https://cxgxnqxnocwippgeduex.supabase.co/functions/v1/today";

// ── Self-update (runs only when opened in the Scriptable app, not as widget) ──
if (config.runsInApp) {
  try {
    const latest = await new Request(
      "https://raw.githubusercontent.com/esschul/italia/main/scriptable/ItalyWidget.js"
    ).loadString();
    if (latest && latest.length > 500 && latest.includes("EDGE_URL")) {
      const fm = FileManager.local();
      const path = fm.joinPath(fm.documentsDirectory(), Script.name() + ".js");
      if (fm.fileExists(path)) fm.writeString(path, latest);
    }
  } catch (_) {}
}

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
  dc.respectScreenScale = true; // render at full screen resolution — no blur
  dc.opaque = true;

  // ── Photo (or dark fallback) ──────────────────────────────────────────────
  if (photo) {
    dc.drawImageInRect(photo, new Rect(0, 0, width, height));
  } else {
    dc.setFillColor(new Color("#1A1A2A"));
    dc.fillRect(new Rect(0, 0, width, height));
  }


  // ── Big number ────────────────────────────────────────────────────────────
  const pad     = 18;
  const numStr  = String(data.days_until_trip ?? "?");
  const numSize = numStr.length > 2 ? 74 : 86;
  dc.setFont(Font.boldSystemFont(numSize));
  dc.setTextColor(C.white);
  dc.drawText(numStr, new Point(pad, height - numSize - 28));

  // ── "days to go" subtitle ─────────────────────────────────────────────────
  dc.setFont(Font.mediumSystemFont(15));
  dc.setTextColor(new Color("#FFFFFFBB"));
  dc.drawText("days to go", new Point(pad + 2, height - 26));

  return dc.getImage();
}

// ── Countdown view ────────────────────────────────────────────────────────────

async function buildCountdown(w, data, size) {
  // ── Canvas dimensions ─────────────────────────────────────────────────────
  // Large widget is ~338×354 pt. Photo fills the top 215pt, dark below.
  const CW       = 338;
  const CH       = 354;
  const PHOTO_H  = 215;

  // ── Build full-widget background image in DrawContext ─────────────────────
  const dc = new DrawContext();
  dc.size = new Size(CW, CH);
  dc.respectScreenScale = true;
  dc.opaque = true;

  const photo = data.illustration_url ? await fetchImage(data.illustration_url) : null;

  // Photo (top portion)
  if (photo) {
    dc.drawImageInRect(photo, new Rect(0, 0, CW, PHOTO_H));
  } else {
    dc.setFillColor(new Color("#1A1A2A"));
    dc.fillRect(new Rect(0, 0, CW, PHOTO_H));
  }

  // Dark content area (bottom portion)
  dc.setFillColor(new Color("#111118"));
  dc.fillRect(new Rect(0, PHOTO_H, CW, CH - PHOTO_H));

  // Number at bottom of photo
  const numStr    = String(data.days_until_trip ?? "?");
  const numSize   = numStr.length > 2 ? 72 : 84;
  const blackText = data.number_color === "black";
  dc.setFont(Font.boldSystemFont(numSize));
  dc.setTextColor(blackText ? new Color("#000000") : C.white);
  dc.drawText(numStr, new Point(18, PHOTO_H - numSize - 28));

  // "days to go"
  dc.setFont(Font.mediumSystemFont(15));
  dc.setTextColor(blackText ? new Color("#000000BB") : new Color("#FFFFFFBB"));
  dc.drawText("days to go", new Point(20, PHOTO_H - 26));

  // Set as widget background — truly edge-to-edge, no insets
  w.backgroundImage = dc.getImage();
  w.setPadding(0, 0, 0, 0);
  w.spacing = 0;

  // ── Content stacks float over the dark background area ────────────────────
  const root = w.addStack();
  root.layoutVertically();
  root.spacing = 0;
  root.setPadding(0, 0, 14, 0);

  // Spacer to clear the photo area
  root.addSpacer(PHOTO_H + 14);

  // Fun fact
  const factStack = root.addStack();
  factStack.setPadding(0, 18, 0, 18);
  const fact = factStack.addText(data.fun_fact ?? "");
  fact.font = Font.systemFont(13);
  fact.textColor = C.offWhite;
  fact.lineLimit = 0;
  fact.minimumScaleFactor = 0.8;
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

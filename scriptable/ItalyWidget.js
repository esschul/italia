// Italy Trip Widget
const EDGE_URL   = "https://cxgxnqxnocwippgeduex.supabase.co/functions/v1/today";

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
  white:      new Color("#FFFFFF"),
  offWhite:   new Color("#F5F0E8"),
  gold:       new Color("#D4A843"),
  goldDim:    new Color("#8B6914"),
  terracotta: new Color("#C4622D"),
  oliveLight: new Color("#7A9E5F"),
  darkBg:     new Color("#1A1A2A"),
  cardBg:     new Color("#FFFFFF18"),
  subtle:     new Color("#FFFFFF55"),
  dimText:    new Color("#FFFFFF99"),
};

// ── Countdown view ────────────────────────────────────────────────────────────

async function buildCountdown(w, data, size) {
  // Warm linen-to-dark gradient
  const grad = new LinearGradient();
  grad.colors   = [new Color("#2D1B0E"), new Color("#1A1A2A"), new Color("#0D1F0D")];
  grad.locations = [0, 0.5, 1];
  w.backgroundGradient = grad;
  w.setPadding(0, 0, 0, 0);

  const root = w.addStack();
  root.layoutVertically();
  root.setPadding(16, 18, 14, 18);
  root.size = new Size(0, 0);

  if (size === "small") {
    await buildCountdownSmall(root, data);
  } else {
    await buildCountdownMedium(root, data);
  }
}

async function buildCountdownSmall(root, data) {
  // Flag + label
  const topRow = root.addStack();
  topRow.layoutHorizontally();
  topRow.centerAlignContent();
  const flag = topRow.addText("🇮🇹");
  flag.font = Font.systemFont(14);
  topRow.addSpacer(6);
  const label = topRow.addText("ITALY");
  label.font = Font.boldSystemFont(11);
  label.textColor = C.gold;

  root.addSpacer(8);

  // Big number
  const num = root.addText(String(data.days_until_trip ?? "?"));
  num.font = Font.boldSystemFont(52);
  num.textColor = C.white;
  num.minimumScaleFactor = 0.5;

  const sub = root.addText("days to go");
  sub.font = Font.mediumSystemFont(11);
  sub.textColor = C.dimText;

  root.addSpacer();

  // Category chip
  if (data.category) {
    const chip = root.addText(categoryLabel(data.category));
    chip.font = Font.boldSystemFont(9);
    chip.textColor = C.gold;
  }

  // Fun fact (short)
  const fact = root.addText(data.fun_fact ?? "");
  fact.font = Font.systemFont(10);
  fact.textColor = C.dimText;
  fact.lineLimit = 3;
  fact.minimumScaleFactor = 0.8;
}

async function buildCountdownMedium(root, data) {
  // ── Top row: number block + illustration ──────────────────────────────────
  const topRow = root.addStack();
  topRow.layoutHorizontally();

  // Left: days number block
  const leftCol = topRow.addStack();
  leftCol.layoutVertically();
  leftCol.size = new Size(130, 0);

  const flag = leftCol.addText("🇮🇹  ITALY");
  flag.font = Font.boldSystemFont(11);
  flag.textColor = C.gold;

  leftCol.addSpacer(6);

  const num = leftCol.addText(String(data.days_until_trip ?? "?"));
  num.font = Font.boldSystemFont(68);
  num.textColor = C.white;
  num.minimumScaleFactor = 0.4;
  num.lineLimit = 1;

  const sub = leftCol.addText("days to go");
  sub.font = Font.mediumSystemFont(13);
  sub.textColor = C.dimText;

  leftCol.addSpacer();

  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "short", timeZone: "Europe/Rome",
  });
  const dateLabel = leftCol.addText(dateStr);
  dateLabel.font = Font.systemFont(9);
  dateLabel.textColor = C.subtle;

  topRow.addSpacer();

  // Right: illustration
  if (data.illustration_url) {
    const img = await fetchImage(data.illustration_url);
    if (img) {
      const imgEl = topRow.addImage(img);
      imgEl.imageSize = new Size(120, 90);
      imgEl.cornerRadius = 12;
      imgEl.applyFillingContentMode();
    }
  } else {
    // Emoji fallback as large decorative text
    const emojiBox = topRow.addStack();
    emojiBox.backgroundColor = C.cardBg;
    emojiBox.cornerRadius = 12;
    emojiBox.size = new Size(110, 90);
    emojiBox.centerAlignContent();
    const e = emojiBox.addText(categoryEmoji(data.category));
    e.font = Font.systemFont(52);
    e.centerAlignText();
  }

  root.addSpacer(10);

  // ── Bottom: category chip + fun fact ──────────────────────────────────────
  const chip = root.addStack();
  chip.backgroundColor = chipColor(data.category);
  chip.cornerRadius = 6;
  chip.setPadding(2, 8, 2, 8);
  chip.layoutHorizontally();
  const chipText = chip.addText(categoryLabel(data.category));
  chipText.font = Font.boldSystemFont(9);
  chipText.textColor = C.white;

  root.addSpacer(5);

  const fact = root.addText(data.fun_fact ?? "");
  fact.font = Font.systemFont(12);
  fact.textColor = C.offWhite;
  fact.lineLimit = 3;
  fact.minimumScaleFactor = 0.8;
}

// ── Italy / Itinerary view ────────────────────────────────────────────────────

async function buildItinerary(w, data, size) {
  // Deep blue-teal gradient — feels like Mediterranean sky
  const grad = new LinearGradient();
  grad.colors   = [new Color("#0A1628"), new Color("#0D2B3E"), new Color("#0A1E1A")];
  grad.locations = [0, 0.5, 1];
  w.backgroundGradient = grad;
  w.setPadding(0, 0, 0, 0);

  const root = w.addStack();
  root.layoutVertically();
  root.setPadding(14, 16, 12, 16);

  // ── Header: title + flag ─────────────────────────────────────────────────
  const header = root.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();

  const dayLabel = header.addText(data.title ?? "");
  dayLabel.font = Font.boldSystemFont(size === "small" ? 12 : 15);
  dayLabel.textColor = C.white;
  dayLabel.lineLimit = 1;
  dayLabel.minimumScaleFactor = 0.7;

  header.addSpacer();
  const flag = header.addText("🇮🇹");
  flag.font = Font.systemFont(14);

  // ── Location + weather row ───────────────────────────────────────────────
  root.addSpacer(6);
  const midRow = root.addStack();
  midRow.layoutHorizontally();
  midRow.centerAlignContent();

  if (data.location) {
    const loc = midRow.addText("📍 " + data.location);
    loc.font = Font.mediumSystemFont(11);
    loc.textColor = new Color("#7EC8E3");
  }

  midRow.addSpacer();

  // Weather block (right-aligned)
  if (data.weather_condition) {
    const weatherStack = midRow.addStack();
    weatherStack.layoutHorizontally();
    weatherStack.centerAlignContent();
    weatherStack.backgroundColor = C.cardBg;
    weatherStack.cornerRadius = 8;
    weatherStack.setPadding(3, 8, 3, 8);
    weatherStack.spacing = 4;

    const cond = weatherStack.addText(data.weather_condition ?? "");
    cond.font = Font.systemFont(11);
    cond.textColor = C.white;

    const temps = weatherStack.addText(
      `  ${data.weather_temp_max ?? "--"}° / ${data.weather_temp_min ?? "--"}°`
    );
    temps.font = Font.boldSystemFont(11);
    temps.textColor = C.gold;

    if (data.weather_precip_pct > 0) {
      const rain = weatherStack.addText(`  💧${data.weather_precip_pct}%`);
      rain.font = Font.systemFont(10);
      rain.textColor = new Color("#7EC8E3");
    }
  }

  // ── Divider ──────────────────────────────────────────────────────────────
  root.addSpacer(8);
  const div = root.addStack();
  div.backgroundColor = C.gold;
  div.size = new Size(32, 1.5);
  div.cornerRadius = 1;
  root.addSpacer(8);

  // ── Day description ──────────────────────────────────────────────────────
  if (data.description) {
    const desc = root.addText(data.description);
    desc.font = Font.systemFont(size === "small" ? 11 : 12);
    desc.textColor = C.offWhite;
    desc.lineLimit = size === "small" ? 3 : 3;
    desc.minimumScaleFactor = 0.8;
  }

  root.addSpacer();

  // ── Fun fact footer ──────────────────────────────────────────────────────
  const factRow = root.addStack();
  factRow.layoutHorizontally();
  factRow.backgroundColor = C.cardBg;
  factRow.cornerRadius = 8;
  factRow.setPadding(5, 9, 5, 9);

  const star = factRow.addText("✦  ");
  star.font = Font.boldSystemFont(9);
  star.textColor = C.gold;

  const fact = factRow.addText(data.fun_fact ?? "");
  fact.font = Font.italicSystemFont(10);
  fact.textColor = C.dimText;
  fact.lineLimit = 2;
  fact.minimumScaleFactor = 0.8;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function categoryLabel(cat) {
  const map = {
    history:  "🏛  Ancient History",
    recipe:   "🍳  Recipe",
    culture:  "🎭  Culture",
    language: "💬  Italian",
    nature:   "🌿  Nature",
  };
  return map[cat] ?? "🇮🇹  Italy";
}

function categoryEmoji(cat) {
  const map = {
    history: "🏛", recipe: "🍝", culture: "🎭",
    language: "💬", nature: "🌿",
  };
  return map[cat] ?? "🇮🇹";
}

function chipColor(cat) {
  const map = {
    history:  new Color("#6B3A2A"),
    recipe:   new Color("#2A4A1A"),
    culture:  new Color("#2A2A5A"),
    language: new Color("#3A2A5A"),
    nature:   new Color("#1A4A2A"),
  };
  return map[cat] ?? new Color("#333333");
}

// ── Main ──────────────────────────────────────────────────────────────────────

const size = config.widgetFamily ?? "medium";

let data;
try {
  data = await fetchContent();
} catch {
  const w = new ListWidget();
  const t = w.addText("⚠️ Could not load");
  t.textColor = Color.white();
  Script.setWidget(w);
  Script.complete();
  throw new Error("fetch failed");
}

// Edge function returned an error (e.g. DB not seeded yet)
if (data.error) {
  const w = new ListWidget();
  const grad = new LinearGradient();
  grad.colors = [new Color("#2D1B0E"), new Color("#1A1A2A")];
  grad.locations = [0, 1];
  w.backgroundGradient = grad;
  w.setPadding(16, 18, 16, 18);
  const t1 = w.addText("🇮🇹  Italia");
  t1.font = Font.boldSystemFont(14);
  t1.textColor = C.gold;
  w.addSpacer(8);
  const t2 = w.addText("No content yet — run the seed SQL in Supabase to get started.");
  t2.font = Font.systemFont(12);
  t2.textColor = C.dimText;
  t2.lineLimit = 3;
  Script.setWidget(w);
  if (config.runsInApp) await w.presentMedium();
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
  size === "small"
    ? await widget.presentSmall()
    : await widget.presentMedium();
}
Script.complete();

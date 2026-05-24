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

// ── Countdown ─────────────────────────────────────────────────────────────────

async function buildCountdown(w, data, size) {
  const grad = new LinearGradient();
  grad.colors    = [new Color("#2D1B0E"), new Color("#1A1A2A"), new Color("#0D1F0D")];
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

  const flagLabel = header.addText("🇮🇹  ITALY");
  flagLabel.font = Font.boldSystemFont(12);
  flagLabel.textColor = C.gold;

  header.addSpacer();

  const chip = header.addStack();
  chip.backgroundColor = chipColor(data.category);
  chip.cornerRadius = 6;
  chip.setPadding(2, 8, 2, 8);
  const chipText = chip.addText(categoryLabel(data.category));
  chipText.font = Font.boldSystemFont(9);
  chipText.textColor = C.white;

  root.addSpacer(14);

  // ── Illustration (large: full width, tall) ────────────────────────────────
  const illustrationHeight = size === "large" ? 140 : 90;
  const illustrationWidth  = size === "large" ? 260 : 110;

  if (size === "large") {
    // Full-width illustration for large widget
    let illustration;
    if (data.illustration_url) {
      const img = await fetchImage(data.illustration_url);
      if (img) {
        const imgEl = root.addImage(img);
        imgEl.imageSize = new Size(illustrationWidth, illustrationHeight);
        imgEl.cornerRadius = 14;
        imgEl.applyFillingContentMode();
        illustration = imgEl;
      }
    }
    if (!illustration) {
      const box = root.addStack();
      box.backgroundColor = C.cardBg;
      box.cornerRadius = 14;
      box.size = new Size(illustrationWidth, illustrationHeight);
      box.centerAlignContent();
      const e = box.addText(categoryEmoji(data.category));
      e.font = Font.systemFont(80);
      e.centerAlignText();
    }
    root.addSpacer(14);
  }

  // ── Number + illustration row (medium) / just number (large) ─────────────
  if (size === "large") {
    const num = root.addText(String(data.days_until_trip ?? "?"));
    num.font = Font.boldSystemFont(86);
    num.textColor = C.white;
    num.minimumScaleFactor = 0.4;
    num.lineLimit = 1;

    const sub = root.addText("days to go");
    sub.font = Font.mediumSystemFont(15);
    sub.textColor = C.dimText;
  } else {
    // Medium: side-by-side number + illustration
    const row = root.addStack();
    row.layoutHorizontally();

    const leftCol = row.addStack();
    leftCol.layoutVertically();
    leftCol.size = new Size(130, 0);

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

    row.addSpacer();

    if (data.illustration_url) {
      const img = await fetchImage(data.illustration_url);
      if (img) {
        const imgEl = row.addImage(img);
        imgEl.imageSize = new Size(illustrationWidth, illustrationHeight);
        imgEl.cornerRadius = 12;
        imgEl.applyFillingContentMode();
      }
    } else {
      const box = row.addStack();
      box.backgroundColor = C.cardBg;
      box.cornerRadius = 12;
      box.size = new Size(illustrationWidth, illustrationHeight);
      box.centerAlignContent();
      const e = box.addText(categoryEmoji(data.category));
      e.font = Font.systemFont(52);
      e.centerAlignText();
    }
  }

  root.addSpacer(10);

  // ── Fun fact ──────────────────────────────────────────────────────────────
  const fact = root.addText(data.fun_fact ?? "");
  fact.font = Font.systemFont(size === "large" ? 13 : 12);
  fact.textColor = C.offWhite;
  fact.lineLimit = size === "large" ? 0 : 3; // 0 = no limit on large
  fact.minimumScaleFactor = 0.8;

  root.addSpacer();

  // ── Date footer ───────────────────────────────────────────────────────────
  if (size === "large") {
    const dateStr = new Date().toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Rome",
    });
    const dateLabel = root.addText(dateStr);
    dateLabel.font = Font.systemFont(10);
    dateLabel.textColor = C.subtle;
  }
}

// ── Itinerary ─────────────────────────────────────────────────────────────────

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

  // ── Location ──────────────────────────────────────────────────────────────
  if (data.location) {
    root.addSpacer(5);
    const loc = root.addText("📍  " + data.location);
    loc.font = Font.mediumSystemFont(12);
    loc.textColor = C.sky;
  }

  // ── Weather row (large: expanded, medium: compact) ────────────────────────
  if (data.weather_condition) {
    root.addSpacer(size === "large" ? 10 : 6);

    const weatherRow = root.addStack();
    weatherRow.layoutHorizontally();
    weatherRow.centerAlignContent();
    weatherRow.backgroundColor = C.cardBg;
    weatherRow.cornerRadius = 10;
    weatherRow.setPadding(size === "large" ? 8 : 4, 12, size === "large" ? 8 : 4, 12);
    weatherRow.spacing = 6;

    const cond = weatherRow.addText(data.weather_condition);
    cond.font = Font.systemFont(size === "large" ? 13 : 11);
    cond.textColor = C.white;

    weatherRow.addSpacer();

    const temps = weatherRow.addText(
      `${data.weather_temp_max ?? "--"}°  /  ${data.weather_temp_min ?? "--"}°`
    );
    temps.font = Font.boldSystemFont(size === "large" ? 15 : 12);
    temps.textColor = C.gold;

    if (data.weather_precip_pct > 0) {
      const rain = weatherRow.addText(`💧 ${data.weather_precip_pct}%`);
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
    history:  "🏛  History",
    recipe:   "🍳  Recipe",
    culture:  "🎭  Culture",
    language: "💬  Italian",
    nature:   "🌿  Nature",
  };
  return map[cat] ?? "🇮🇹  Italy";
}

function categoryEmoji(cat) {
  const map = { history: "🏛", recipe: "🍝", culture: "🎭", language: "💬", nature: "🌿" };
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
  if (size === "small") await widget.presentSmall();
  else if (size === "medium") await widget.presentMedium();
  else await widget.presentLarge();
}
Script.complete();

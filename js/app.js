// Connects the page to the engine. All checking happens here in the browser.
import { check, LEVELS } from "./engine.js";
import { readImage } from "./ocr.js";
import { t, LANGUAGES, language } from "./strings.js";

const $ = (id) => document.getElementById(id);
const SVG = "http://www.w3.org/2000/svg";

// ---------- language ----------
// Remembered on this device only (browser storage can be unavailable, so fail quietly).
const STORE_KEY = "kj-lang";
function savedLanguage() {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved;
  } catch { /* storage blocked */ }
  const browser = (navigator.language || "en").slice(0, 2).toLowerCase();
  return LANGUAGES.some((l) => l.code === browser) ? browser : "en";
}

let lang = savedLanguage();
let S = t(lang);
let lastResult = null;

// Fill every element marked data-s="key" with its text, so all wording comes from js/i18n/.
function applyStrings() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-s]").forEach((el) => {
    const value = S[el.dataset.s];
    el.textContent = typeof value === "string" ? value : "";
  });
  $("lang-switch").setAttribute("aria-label", S.languageLabel);
  renderTrust();
  renderSigns();
  renderAbout();
  $("how-steps").replaceChildren(...S.howSteps.map((step, i) => {
    const li = document.createElement("li");
    const n = document.createElement("span");
    n.className = "how-num";
    n.setAttribute("aria-hidden", "true");
    n.textContent = String(i + 1).padStart(2, "0");
    const p = document.createElement("span");
    p.textContent = step;
    li.append(n, p);
    return li;
  }));
}

// ---------- website sections ----------
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
const icon = (paths) => {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = paths;
  return svg;
};

const TICK = '<path d="M5 12.5l4.5 4.5L19 7.5"/>';
function renderTrust() {
  $("trust").replaceChildren(...S.trust.map((t) => {
    const li = el("li");
    const badge = el("span", "trust-tick");
    badge.append(icon(TICK));
    li.append(badge, el("span", null, t));
    return li;
  }));
}

// One simple line icon per warning sign, in the same order as S.signs.
const SIGN_ICONS = [
  '<path d="M12 4v11"/><path d="M7.5 10.5L12 15l4.5-4.5"/><path d="M5 19h14"/>',                                // app download
  '<circle cx="8" cy="15" r="3.5"/><path d="M10.5 12.5L19 4"/><path d="M15.5 7.5l2.5 2.5"/><path d="M17 5.5l2 2"/>', // password / key
  '<circle cx="12" cy="12" r="8"/><path d="M4 12h16"/><path d="M12 4c2.5 2.4 3.6 5 3.6 8s-1.1 5.6-3.6 8c-2.5-2.4-3.6-5-3.6-8S9.5 6.4 12 4z"/>', // website
  '<path d="M5 18.5l1.2-3.6A7 7 0 1 1 9 17.6z"/>',                                                                  // chat
  '<circle cx="12" cy="12" r="8"/><path d="M14.5 9.2c-.6-.8-1.5-1.2-2.6-1.2-1.6 0-2.7.8-2.7 2s1 1.7 2.8 2.1c1.9.4 2.9 1 2.9 2.2s-1.2 2.1-2.9 2.1c-1.2 0-2.2-.5-2.8-1.3"/><path d="M12 6.5V8M12 16.4v1.1"/>', // money
  '<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 2"/><path d="M9.5 3h5"/>',                                   // clock
];
function renderSigns() {
  $("sign-grid").replaceChildren(...S.signs.map((sgn, i) => {
    const li = el("li", "sign-row");
    const ic = el("span", "sign-icon");
    ic.append(icon(SIGN_ICONS[i] || SIGN_ICONS[0]));
    const body = el("div");
    body.append(el("h3", null, sgn.title), el("p", null, sgn.text));
    li.append(ic, body);
    return li;
  }));
}

function renderAbout() {
  $("about-grid").replaceChildren(...S.about.map((a) => {
    const card = el("article", "about-item");
    card.append(el("h3", null, a.title), el("p", null, a.text));
    return card;
  }));
}

function buildSwitcher() {
  $("lang-switch").replaceChildren(...LANGUAGES.map((l) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "lang-btn";
    b.lang = l.code;
    b.textContent = l.name;
    b.setAttribute("aria-pressed", String(l.code === lang));
    b.addEventListener("click", () => setLanguage(l.code));
    return b;
  }));
}

function setLanguage(code) {
  if (code === lang) return;
  lang = code;
  S = t(lang);
  try { localStorage.setItem(STORE_KEY, lang); } catch { /* storage blocked */ }
  stopSpeaking();
  applyStrings();
  buildSwitcher();
  updateSpeakButton();
  if (lastResult && !$("result").hidden) render(lastResult, false);
}

// ---------- risk meter ----------
// A half circle of soft dots in two rows: green (low) -> amber -> red (high).
// 12 steps, each step lights 2 dots on each row, so the arc fills from left to right.
const SEGMENTS = 12;
const COLOURS = ["olive", "olive", "olive", "olive", "yellow", "yellow", "yellow", "yellow", "pink", "pink", "pink", "pink"];

function segmentsToFill(result) {
  if (result.level === LEVELS.NO_FLAGS) return 3;
  if (result.level === LEVELS.CAREFUL) return 6 + Math.min(2, Math.floor((result.score - 15) / 10));
  return Math.min(SEGMENTS, 9 + Math.floor((result.score - 40) / 25));
}

const motionOK = () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function drawMeter(svg, filled, animate = false) {
  svg.replaceChildren();
  const cx = 160, cy = 158;
  const rows = [{ R: 144, dot: 7 }, { R: 118, dot: 5.5 }];
  const perStep = 2, total = SEGMENTS * perStep;
  for (let k = 0; k < total; k++) {
    const step = Math.floor(k / perStep);
    const a = Math.PI - (k + 0.5) * (Math.PI / total);
    const on = step < filled;
    const fill = on ? `var(--${COLOURS[step]})` : "var(--empty)";
    rows.forEach(({ R, dot }) => {
      const c = document.createElementNS(SVG, "circle");
      c.setAttribute("cx", (cx + R * Math.cos(a)).toFixed(1));
      c.setAttribute("cy", (cy - R * Math.sin(a)).toFixed(1));
      c.setAttribute("r", dot);
      c.setAttribute("fill", fill);
      if (animate && on && motionOK()) {
        // Dots light up one after another, like a gauge filling.
        c.classList.add("seg-in");
        c.style.animationDelay = `${k * 28}ms`;
      }
      svg.appendChild(c);
    });
  }
}

// ---------- reasons as cards ----------
function card(kind, text, mark) {
  const li = document.createElement("li");
  li.className = `reason ${kind}`;
  const dot = document.createElement("span");
  dot.className = "dot";
  dot.setAttribute("aria-hidden", "true");
  dot.textContent = mark;
  const body = document.createElement("div");
  body.className = "body";
  const pill = document.createElement("span");
  pill.className = "pill";
  pill.textContent = S.pills[kind];
  const p = document.createElement("p");
  p.textContent = text;
  body.append(pill, p);
  li.append(dot, body);
  return li;
}

// ---------- messages ----------
function showError(message) {
  $("error").textContent = message;
  $("error").hidden = false;
}
function hideError() {
  $("error").hidden = true;
}

// ---------- checking ----------
function runCheck() {
  const text = $("ad").value;
  const result = $("result");

  if (!text.trim()) {
    showError(S.emptyInput);
    result.hidden = true;
    $("ad").focus();
    return;
  }
  hideError();

  stopSpeaking();
  lastResult = check(text);
  render(lastResult, true);
}

// Shows a result in the current language. animate=false when only the language changed.
function render(r, animate) {
  const result = $("result");
  const level = S.levels[r.level];
  result.className = `result-panel ${r.level}`;
  $("meter-level").textContent = level.meter;
  $("verdict-title").textContent = level.title;
  $("verdict-advice").textContent = level.advice;
  drawMeter($("meter"), segmentsToFill(r), animate);
  $("meter").setAttribute("aria-label", `${S.meterLabel}: ${level.meter}`);

  $("reasons").replaceChildren(...r.reasons.map((x) => card(x.weight >= 30 ? "serious" : "mild", S.reasons[x.id] || x.id, "!")));
  $("reasons-block").hidden = r.reasons.length === 0;
  $("good").replaceChildren(...r.goodSigns.map((x) => card("good", S.goodSigns[x.id] || x.id, "✓")));
  $("good-block").hidden = r.goodSigns.length === 0;

  result.hidden = false;
  updateSpeakButton();
  if (animate) {
    result.classList.remove("reveal");
    void result.offsetWidth; // restart the fade-in
    result.classList.add("reveal");
    result.scrollIntoView({ behavior: motionOK() ? "smooth" : "auto", block: "start" });
    $("verdict-title").focus({ preventScroll: true });
  }
}

$("check-form").addEventListener("submit", (e) => {
  e.preventDefault();
  runCheck();
});

// ---------- screenshots and photos ----------
let busy = false;
let previewUrl = null;

function setStatus(message, progress) {
  $("ocr-status").textContent = message;
  const showBar = typeof progress === "number";
  $("ocr-bar-wrap").hidden = !showBar;
  if (showBar) $("ocr-bar").style.width = `${Math.round(progress * 100)}%`;
}

async function checkImage(file) {
  if (busy || !file) return;
  if (!file.type.startsWith("image/")) {
    showError(S.ocr.notImage);
    return;
  }
  busy = true;
  hideError();
  $("result").hidden = true;
  document.querySelector(".btn-photo").setAttribute("aria-disabled", "true");

  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  $("preview-img").src = previewUrl;
  $("preview-img").alt = S.photoAlt;
  $("preview").hidden = false;
  $("preview").scrollIntoView({ behavior: "smooth", block: "nearest" });

  try {
    const { text, confidence } = await readImage(file, (stage, p) => {
      setStatus(stage === "reading" ? S.ocr.reading : S.ocr.preparing, stage === "reading" ? p : undefined);
    });
    if (!text.replace(/[^a-z0-9]/gi, "").length) {
      setStatus("");
      showError(S.ocr.noText);
      return;
    }
    $("ad").value = text;
    setStatus(confidence < 60 ? `${S.ocr.lowConfidence} ${S.ocr.done}` : S.ocr.done);
    runCheck();
  } catch (err) {
    setStatus("");
    showError(err && err.message === "load-failed" ? S.ocr.loadFailed : S.ocr.noText);
  } finally {
    busy = false;
    document.querySelector(".btn-photo").removeAttribute("aria-disabled");
    $("photo").value = ""; // lets the same picture be chosen again
  }
}

$("photo").addEventListener("change", (e) => checkImage(e.target.files[0]));

// Ctrl+V a screenshot anywhere on the page (computers).
document.addEventListener("paste", (e) => {
  const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith("image/"));
  if (!item) return; // normal text paste carries on as usual
  e.preventDefault();
  checkImage(item.getAsFile());
});

// Drag a picture onto the box (computers).
const form = $("check-form");
form.addEventListener("dragover", (e) => {
  if ([...e.dataTransfer.items].some((i) => i.kind === "file")) {
    e.preventDefault();
    form.classList.add("drop-active");
  }
});
form.addEventListener("dragleave", () => form.classList.remove("drop-active"));
form.addEventListener("drop", (e) => {
  form.classList.remove("drop-active");
  const file = [...e.dataTransfer.files].find((f) => f.type.startsWith("image/"));
  if (file) {
    e.preventDefault();
    checkImage(file);
  }
});

// ---------- clear ----------
$("clear").addEventListener("click", () => {
  stopSpeaking();
  lastResult = null;
  $("ad").value = "";
  $("result").hidden = true;
  $("preview").hidden = true;
  setStatus("");
  hideError();
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  $("ad").focus();
});

// ---------- read aloud ----------
// Uses the voices built into the phone or computer. The button only shows when the
// device has a voice for the chosen language, so nobody presses a button that does nothing.
const synth = "speechSynthesis" in window ? window.speechSynthesis : null;
let speaking = false;

function findVoice() {
  if (!synth) return null;
  const voices = synth.getVoices();
  for (const want of language(lang).voices) {
    const v = voices.find((x) => x.lang.replace("_", "-").toLowerCase().startsWith(want.toLowerCase()));
    if (v) return v;
  }
  return null;
}

function updateSpeakButton() {
  const btn = $("speak");
  btn.hidden = !findVoice() || $("result").hidden;
  $("speak-label").textContent = speaking ? S.stopReading : S.readAloud;
  btn.setAttribute("aria-pressed", String(speaking));
}

function stopSpeaking() {
  if (synth && (synth.speaking || synth.pending)) synth.cancel();
  speaking = false;
  if ($("speak")) updateSpeakButton();
}

function speakResult() {
  if (!lastResult) return;
  const voice = findVoice();
  if (!voice) return;
  const r = lastResult;
  const level = S.levels[r.level];
  const stop = lang === "zh" ? "。" : ". "; // Chinese uses its own full stop
  const parts = [
    `${level.meter}${stop}${level.title}${stop}`.trim(),
    level.advice,
    ...(r.reasons.length ? [S.reasonsHeading + stop.trim(), ...r.reasons.map((x) => S.reasons[x.id])] : []),
    ...(r.goodSigns.length ? [S.goodSignsHeading + stop.trim(), ...r.goodSigns.map((x) => S.goodSigns[x.id])] : []),
  ];
  synth.cancel();
  parts.forEach((text, i) => {
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = 0.9; // a little slower than normal, easier to follow
    if (i === parts.length - 1) u.onend = u.onerror = () => { speaking = false; updateSpeakButton(); };
    synth.speak(u);
  });
  speaking = true;
  updateSpeakButton();
}

$("speak").addEventListener("click", () => (speaking ? stopSpeaking() : speakResult()));
if (synth) synth.addEventListener?.("voiceschanged", updateSpeakButton);

// ---------- start ----------
applyStrings();
buildSwitcher();

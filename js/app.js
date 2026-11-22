// Connects the page to the engine. All checking happens here in the browser.
import { check, LEVELS } from "./engine.js";
import { t } from "./strings.js";

const S = t("en");
const $ = (id) => document.getElementById(id);
const SVG = "http://www.w3.org/2000/svg";

// Fill every element marked data-s="key" with its text, so all wording comes from strings.js.
document.querySelectorAll("[data-s]").forEach((el) => {
  const value = S[el.dataset.s];
  if (typeof value === "string") el.textContent = value;
});

// ---------- risk meter ----------
// 12 rounded segments in a half circle: olive (low) -> yellow -> pink (high).
const SEGMENTS = 12;
const COLOURS = ["olive", "olive", "olive", "olive", "yellow", "yellow", "yellow", "yellow", "pink", "pink", "pink", "pink"];

function segmentsToFill(result) {
  if (result.level === LEVELS.NO_FLAGS) return 3;
  if (result.level === LEVELS.CAREFUL) return 6 + Math.min(2, Math.floor((result.score - 15) / 10));
  return Math.min(SEGMENTS, 9 + Math.floor((result.score - 40) / 25));
}

function drawMeter(svg, filled) {
  svg.replaceChildren();
  // Each segment is a wedge of a ring, drawn with a thick round-joined outline in the same
  // colour so its corners come out soft. The gap between wedges is the same in pixels on
  // the inside and outside edge, so they look evenly spaced.
  const cx = 160, cy = 160, R = 150, r = 88, stroke = 12, gap = 7;
  const step = Math.PI / SEGMENTS;
  const Ro = R - stroke / 2, Ri = r + stroke / 2;
  const pt = (rad, a) => `${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy - rad * Math.sin(a)).toFixed(1)}`;
  for (let i = 0; i < SEGMENTS; i++) {
    const a0 = Math.PI - i * step, a1 = Math.PI - (i + 1) * step;
    const go = (gap + stroke) / 2 / Ro, gi = (gap + stroke) / 2 / Ri;
    const d = [
      `M ${pt(Ro, a0 - go)}`,
      `A ${Ro} ${Ro} 0 0 1 ${pt(Ro, a1 + go)}`,
      `L ${pt(Ri, a1 + gi)}`,
      `A ${Ri} ${Ri} 0 0 0 ${pt(Ri, a0 - gi)}`,
      "Z",
    ].join(" ");
    const path = document.createElementNS(SVG, "path");
    const fill = i < filled ? `var(--${COLOURS[i]})` : "var(--empty)";
    path.setAttribute("d", d);
    path.setAttribute("fill", fill);
    path.setAttribute("stroke", fill);
    path.setAttribute("stroke-width", stroke);
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
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

$("check-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = $("ad").value;
  const err = $("error");
  const result = $("result");

  if (!text.trim()) {
    err.textContent = S.emptyInput;
    err.hidden = false;
    result.hidden = true;
    $("ad").focus();
    return;
  }
  err.hidden = true;

  const r = check(text);
  const level = S.levels[r.level];
  result.className = `panel result-panel ${r.level}`;
  $("meter-level").textContent = level.meter;
  $("verdict-title").textContent = level.title;
  $("verdict-advice").textContent = level.advice;
  drawMeter($("meter"), segmentsToFill(r));
  $("meter").setAttribute("aria-label", `${S.meterLabel}: ${level.meter}`);

  $("reasons").replaceChildren(...r.reasons.map((x) => card(x.weight >= 30 ? "serious" : "mild", S.reasons[x.id] || x.id, "!")));
  $("reasons-block").hidden = r.reasons.length === 0;
  $("good").replaceChildren(...r.goodSigns.map((x) => card("good", S.goodSigns[x.id] || x.id, "✓")));
  $("good-block").hidden = r.goodSigns.length === 0;

  result.hidden = false;
  document.querySelector(".grid").classList.add("has-result");
  result.scrollIntoView({ behavior: "smooth", block: "start" });
  $("verdict-title").focus({ preventScroll: true });
});

$("clear").addEventListener("click", () => {
  $("ad").value = "";
  $("result").hidden = true;
  $("error").hidden = true;
  document.querySelector(".grid").classList.remove("has-result");
  $("ad").focus();
});

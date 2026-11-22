// Run with: node test/i18n.test.js
// Checks every language has exactly the same pieces of text as English, none empty,
// and that every warning sign the engine can raise has an explanation in every language.
import { LANGUAGES } from "../js/strings.js";
import { RULES, GOOD_SIGNS } from "../js/engine.js";

function paths(obj, prefix = "") {
  return Object.entries(obj).flatMap(([k, v]) => {
    const p = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) return v.map((_, i) => `${p}[${i}]`);
    return v && typeof v === "object" ? paths(v, p) : [p];
  });
}
const get = (obj, p) => p.split(/\.|\[|\]/).filter(Boolean).reduce((o, k) => (o == null ? o : o[k]), obj);

const en = LANGUAGES[0].strings;
const enPaths = paths(en);
let pass = 0, total = 0;

for (const lang of LANGUAGES) {
  const s = lang.strings;
  const have = new Set(paths(s));
  const missing = enPaths.filter((p) => !have.has(p));
  const extra = [...have].filter((p) => !enPaths.includes(p));
  const empty = [...have].filter((p) => typeof get(s, p) === "string" && !get(s, p).trim());
  const ruleGaps = [...RULES.map((r) => `reasons.${r.id}`), ...GOOD_SIGNS.map((g) => `goodSigns.${g.id}`)].filter((p) => !get(s, p));

  total++;
  const ok = !missing.length && !extra.length && !empty.length && !ruleGaps.length;
  if (ok) pass++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${lang.name} (${lang.code}): ${have.size} pieces of text`);
  if (missing.length) console.log("      missing:", missing.join(", "));
  if (extra.length) console.log("      not in English:", extra.join(", "));
  if (empty.length) console.log("      empty:", empty.join(", "));
  if (ruleGaps.length) console.log("      no explanation for:", ruleGaps.join(", "));
}

console.log(`\n${pass}/${total} passed`);
process.exit(pass === total ? 0 : 1);

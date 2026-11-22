// Kaypoh Jaga checking engine.
// Takes the text of an ad (and any links in it) and returns a verdict with reasons.
// Runs entirely in the browser: nothing the user pastes is sent anywhere.

import {
  TRUSTED_DOMAIN_SUFFIXES, LINK_SHORTENERS, OFFICIAL_SHORTENERS, OFFICIAL_NAMES,
} from "../data/trusted.js";

// ---------- helpers ----------

// Finds links, including ones written without http (e.g. "pa-seniors.com/join").
const URL_RE = /\b((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:\/[^\s"'<>)]*)?)/gi;

export function extractLinks(text) {
  const found = text.match(URL_RE) || [];
  const links = [];
  for (const raw of found) {
    const withScheme = /^https?:\/\//i.test(raw) ? raw : "https://" + raw;
    try {
      const u = new URL(withScheme.replace(/[.,;:!?]+$/, ""));
      // Skip things like "e.g" or file names in sentences: a real host has a TLD of 2+ letters.
      if (!/\.[a-z]{2,}$/i.test(u.hostname)) continue;
      links.push({ raw, host: u.hostname.toLowerCase().replace(/^www\./, ""), path: u.pathname.toLowerCase() });
    } catch { /* not a link */ }
  }
  return links;
}

// ".gov.sg" matches any host ending in .gov.sg; "bit.ly" matches bit.ly and its subdomains.
const endsWithAny = (host, list) =>
  list.some((d) => (d.startsWith(".") ? host.endsWith(d) : host === d || host.endsWith("." + d)));
const isTrusted = (host) => endsWithAny(host, TRUSTED_DOMAIN_SUFFIXES);
const hasWord = (text, words) => words.find((w) => new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\']/g, "\\$&")}([^a-z]|$)`, "i").test(text));

// ---------- rules ----------
// Each rule looks for one warning sign. weight = how much it raises the risk score.
// id is also the key for the plain-language reason in js/strings.js.

export const RULES = [
  {
    id: "apkDownload",
    weight: 45,
    test: (t, links) =>
      links.some((l) => l.path.endsWith(".apk")) ||
      /\.apk\b/i.test(t) ||
      /(download|install)\s+(our|the|this)?\s*(app|application)\b[^.]{0,60}(link|here|below|click|tap)/i.test(t) &&
        !links.some((l) => isTrusted(l.host)),
  },
  {
    id: "unknownSources",
    weight: 45,
    test: (t) => /(unknown sources|install unknown apps|allow (installation|install) from)/i.test(t),
  },
  {
    id: "asksForSecrets",
    weight: 40,
    test: (t) => /\b(otp|one[- ]time password|singpass (password|login|details)|password|pin number|card number|cvv|bank (login|account details|log-in))\b/i.test(t),
  },
  {
    id: "lookalikeGovLink",
    weight: 40,
    test: (t, links) => links.some((l) => /(^|[.-])(gov|govsg|sg-?gov)([.-]|$)/i.test(l.host) && !l.host.endsWith(".gov.sg")),
  },
  {
    id: "officialNameUnofficialLink",
    weight: 30,
    test: (t, links) => {
      const name = hasWord(t, OFFICIAL_NAMES);
      const outside = links.filter((l) => !isTrusted(l.host) && !endsWithAny(l.host, OFFICIAL_SHORTENERS) && !/^wa\.me$|whatsapp/.test(l.host));
      return Boolean(name && outside.length);
    },
  },
  {
    id: "chatAppOnly",
    weight: 15,
    test: (t, links) =>
      links.some((l) => /^(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com|t\.me|telegram\.me)$/.test(l.host)) ||
      /(whatsapp|telegram)\s+(us|me|to|at|for)\b/i.test(t),
  },
  {
    id: "asksForPayment",
    weight: 15,
    test: (t) => /\b(registration fee|admin fee|deposit|transfer|paynow|pay now|pay \$|processing fee|membership fee)\b/i.test(t),
  },
  {
    id: "asksForId",
    weight: 15,
    test: (t) => /\b(nric|ic number|i\/c|passport number|date of birth)\b/i.test(t),
  },
  {
    id: "linkShortener",
    weight: 10,
    test: (t, links) => links.some((l) => endsWithAny(l.host, LINK_SHORTENERS)),
  },
  {
    id: "urgency",
    weight: 10,
    test: (t) => /(limited (slots|seats|places)|only \d+ (slots|seats|places)|today only|act (now|fast)|hurry|last chance|expires? (today|tonight|soon)|before it'?s too late)/i.test(t),
  },
  {
    id: "tooGoodToBeTrue",
    weight: 8,
    test: (t) => /(free (cash|money|gift|voucher|trip|tour|ang ?pow)|\$\d+[\d,]* (cash|voucher)s? (free|for every|for all)|guaranteed (payout|return|cash))/i.test(t),
  },
];

// Signs that make an ad more likely to be genuine. Negative weight lowers the score.
export const GOOD_SIGNS = [
  {
    id: "onlyOfficialLinks",
    weight: -20,
    test: (t, links) => links.length > 0 && links.every((l) => isTrusted(l.host) || endsWithAny(l.host, OFFICIAL_SHORTENERS)),
  },
];

// ---------- verdict ----------

const SERIOUS = 30;

export const LEVELS = {
  SCAM: "likelyScam",       // red
  CAREFUL: "beCareful",     // amber
  NO_FLAGS: "noFlagsFound", // green, but never "safe": we cannot prove an ad is real
};

export function check(text) {
  const t = (text || "").trim();
  if (!t) return { level: null, score: 0, reasons: [], goodSigns: [], links: [] };

  const links = extractLinks(t);
  const reasons = RULES.filter((r) => r.test(t, links)).map((r) => ({ id: r.id, weight: r.weight }));
  const goodSigns = GOOD_SIGNS.filter((g) => g.test(t, links)).map((g) => ({ id: g.id, weight: g.weight }));

  const score = Math.max(0, [...reasons, ...goodSigns].reduce((s, r) => s + r.weight, 0));
  // "Likely scam" needs at least one serious sign (weight 30+). Several mild signs together,
  // like a WhatsApp sign-up plus a small fee, are common in genuine community groups too,
  // so on their own they can only reach "be careful".
  const hasSerious = reasons.some((r) => r.weight >= SERIOUS);
  const level = score >= 40 && hasSerious ? LEVELS.SCAM : score >= 15 ? LEVELS.CAREFUL : LEVELS.NO_FLAGS;

  // Strongest warning first, so the most important reason is read first.
  reasons.sort((a, b) => b.weight - a.weight);
  return { level, score, reasons, goodSigns, links };
}

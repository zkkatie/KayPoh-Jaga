// Run with: node test/engine.test.js
// Sample ads are written for testing; organisations and links in them are made up.
import { check, extractLinks, LEVELS } from "../js/engine.js";

const cases = [
  // --- Scams, modelled on the patterns in police advisories ---
  {
    name: "Fake senior activity ad with app download",
    level: LEVELS.SCAM,
    text: `Active Ageing Centre: FREE weekly outings and talks for seniors 60+! Limited slots.
Register now by downloading our app here: https://seniorjoy-sg.com/register.apk`,
  },
  {
    name: "Fake 'government' payout with lookalike link",
    level: LEVELS.SCAM,
    text: `Silver Generation Bonus: claim your $600 cash today only. Log in with your Singpass password at https://sg-gov-payout.com`,
  },
  {
    name: "WhatsApp-only sign-up with fee and short link",
    level: LEVELS.CAREFUL,
    text: `Seniors day trip to Malacca, only $10! Pay $10 registration fee via PayNow. WhatsApp us at wa.me/6591234567 or see bit.ly/trip-sg`,
  },
  {
    name: "Asks to allow unknown sources",
    level: LEVELS.SCAM,
    text: `To join our community club activities, install our member app. Go to Settings and allow install unknown apps, then open the file we send you.`,
  },
  {
    name: "Asks for OTP",
    level: LEVELS.SCAM,
    text: `Your CDC voucher is ready. Reply with the OTP we sent you to receive it.`,
  },

  // --- Genuine-looking ads ---
  {
    name: "Official-style ad with gov.sg link",
    level: LEVELS.NO_FLAGS,
    text: `Join free health screening at your nearby community club this Saturday. Find out more at https://www.healthhub.gov.sg`,
  },
  {
    name: "Official short link and app store",
    level: LEVELS.NO_FLAGS,
    text: `Get the ScamShield app from https://go.gov.sg/ss-android or https://apps.apple.com/sg/app/scamshield`,
  },
  {
    name: "Plain community notice, no links",
    level: LEVELS.NO_FLAGS,
    text: `Line dancing every Tuesday 9am at the void deck of Blk 123. All residents welcome. No registration needed.`,
  },
];

let pass = 0;
for (const c of cases) {
  const r = check(c.text);
  const ok = r.level === c.level;
  if (ok) pass++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${c.name}`);
  console.log(`      expected ${c.level}, got ${r.level} (score ${r.score}) flags: ${r.reasons.map((x) => x.id).join(", ") || "none"}${r.goodSigns.length ? " | good: " + r.goodSigns.map((g) => g.id).join(", ") : ""}`);
}

// Link finder sanity checks
const links = extractLinks("see bit.ly/abc, or https://www.healthhub.gov.sg/x. e.g. this");
const hosts = links.map((l) => l.host).join(",");
const linkOk = hosts === "bit.ly,healthhub.gov.sg";
console.log(`${linkOk ? "PASS" : "FAIL"}  extractLinks finds bare and full links (got ${hosts})`);
if (linkOk) pass++;

const total = cases.length + 1;
console.log(`\n${pass}/${total} passed`);
process.exit(pass === total ? 0 : 1);

// Run with: node test/ocr.test.js
// Tests the clean-up applied to text read from screenshots (the reading itself needs a browser).
import { tidy } from "../js/ocr.js";
import { check, LEVELS } from "../js/engine.js";

const cases = [
  ["joins a link split after https", "go to https: //seniorjoy-sg.com/app.apk", "go to https://seniorjoy-sg.com/app.apk"],
  ["joins a link split before .com", "visit seniorjoy-sg .com/join", "visit seniorjoy-sg.com/join"],
  ["joins .apk split from its name", "download register .apk now", "download register.apk now"],
  ["squashes extra spaces", "Free   outings   for seniors", "Free outings for seniors"],
  ["keeps normal sentences", "Join us. Commerce talk on Monday.", "Join us. Commerce talk on Monday."],
];

let pass = 0;
for (const [name, input, want] of cases) {
  const got = tidy(input);
  const ok = got === want;
  if (ok) pass++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `\n      expected: ${want}\n      got:      ${got}`}`);
}

// A badly read scam ad should still be caught once tidied.
const messy = "Active Ageing Centre   FREE outings!\nRegister by downloading our app: https: //seniorjoy-sg .com/register .apk";
const r = check(tidy(messy));
const caught = r.level === LEVELS.SCAM;
if (caught) pass++;
console.log(`${caught ? "PASS" : "FAIL"}  messy screenshot text still flagged as scam (got ${r.level})`);

const total = cases.length + 1;
console.log(`\n${pass}/${total} passed`);
process.exit(pass === total ? 0 : 1);

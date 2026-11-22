// All on-screen wording, one file per language in js/i18n/.
// To add a language: copy en.js, translate the text in quotes, then add it to LANGUAGES below.
import en from "./i18n/en.js";
import zh from "./i18n/zh.js";
import ms from "./i18n/ms.js";
import ta from "./i18n/ta.js";

// code: used for <html lang>; name: shown on the switcher in its own script;
// voices: language codes to look for when reading aloud, best match first.
export const LANGUAGES = [
  { code: "en", name: "English", voices: ["en-SG", "en-GB", "en-US", "en"], strings: en },
  { code: "zh", name: "中文", voices: ["zh-SG", "zh-CN", "cmn", "zh"], strings: zh },
  { code: "ms", name: "Melayu", voices: ["ms-MY", "ms-SG", "ms", "id-ID"], strings: ms },
  { code: "ta", name: "தமிழ்", voices: ["ta-SG", "ta-IN", "ta"], strings: ta },
];

export const STRINGS = Object.fromEntries(LANGUAGES.map((l) => [l.code, l.strings]));

export function t(lang = "en") {
  return STRINGS[lang] || STRINGS.en;
}

export function language(lang) {
  return LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
}

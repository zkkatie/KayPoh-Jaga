// Domains and names the checker treats as trusted or as impersonation targets.
// Kept in one file so the list can grow (e.g. official Active Ageing Centre listings) without touching the engine.

// Links ending in these are official or official app stores.
export const TRUSTED_DOMAIN_SUFFIXES = [
  ".gov.sg",
  "play.google.com",
  "apps.apple.com",
];

// Free link shorteners hide where a link really goes.
export const LINK_SHORTENERS = [
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd",
  "cutt.ly", "rebrand.ly", "shorturl.at", "rb.gy", "s.id",
];

// go.gov.sg is the Government's own shortener, so it is not suspicious.
export const OFFICIAL_SHORTENERS = ["go.gov.sg"];

// Names scammers borrow to look official. If an ad uses one of these
// but links somewhere that is not .gov.sg, that is a strong warning sign.
export const OFFICIAL_NAMES = [
  "government", "gov", "ministry", "moh", "msf", "mom", "cpf", "iras", "hdb",
  "singpass", "people's association", "peoples association", "passion card",
  "active ageing centre", "active aging centre", "aac", "aic",
  "agency for integrated care", "silver generation", "pioneer generation",
  "merdeka generation", "cdc", "community club", "town council",
  "police", "spf", "mas", "monetary authority",
];

// Help that is always shown, whatever the verdict.
export const HELP = {
  helpline: "1799",
  helplineName: "ScamShield Helpline",
  website: "https://www.scamshield.gov.sg",
};

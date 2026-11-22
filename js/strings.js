// Every word the user sees lives here, keyed by language, so Chinese, Malay and Tamil
// can be added later by filling in the same keys. English only for now.

export const STRINGS = {
  en: {
    appName: "Kaypoh Jaga",
    tagline: "We kaypoh the ad. You stay safe.",
    checkHeading: "Check an ad",
    resultHeading: "What we found",
    inputLabel: "Paste the ad or message here",
    inputHint: "Copy the words and any link from the ad, then paste them in the box.",
    checkButton: "Check this ad",
    clearButton: "Clear",
    disclaimer: "Kaypoh Jaga is an independent student project, not a government service. Nothing you paste leaves your phone.",

    levels: {
      likelyScam: { meter: "High risk", title: "This looks like a scam", advice: "Do not click any link, download anything or reply. Show this to a family member or call the helpline below." },
      beCareful: { meter: "Some risk", title: "Be careful", advice: "We found some warning signs. Check with the organiser through their official website or phone number before you sign up or pay." },
      noFlagsFound: { meter: "Low risk", title: "No warning signs found", advice: "This does not mean the ad is real. If it asks you to pay, log in or download anything, check with the helpline first." },
    },

    reasonsHeading: "Why we think so",
    goodSignsHeading: "Good signs",

    reasons: {
      apkDownload: "It asks you to download and install an app from a link. Real organisers use the App Store or Google Play. Apps from links can take over your phone.",
      unknownSources: "It tells you to allow apps from \"unknown sources\". This lets scam apps take over your phone.",
      asksForSecrets: "It asks for a password, OTP or bank details. Real organisations never ask for these.",
      lookalikeGovLink: "The link looks like a government website but is not. Real government websites end in .gov.sg.",
      officialNameUnofficialLink: "It uses a government or community name, but the link does not go to an official .gov.sg website.",
      chatAppOnly: "It asks you to sign up through WhatsApp or Telegram. Scammers often do this to talk to you privately.",
      asksForPayment: "It asks you to pay a fee or deposit to join.",
      asksForId: "It asks for your NRIC, passport or date of birth.",
      linkShortener: "It uses a short link that hides where it really goes.",
      urgency: "It rushes you with \"limited slots\" or \"today only\". Scammers rush you so you do not stop to check.",
      tooGoodToBeTrue: "It promises free cash, gifts or trips. If it sounds too good to be true, it usually is.",
    },
    goodSigns: {
      onlyOfficialLinks: "All its links go to official .gov.sg websites or the official app stores.",
    },

    helpPill: "Not sure? Call",
    webPill: "Official advice",
    helpCall: "ScamShield Helpline. Free, 24 hours.",
    helpWebsite: "Check scams and get advice online.",
    pills: { serious: "Serious", mild: "Warning sign", good: "Good sign" },
    meterLabel: "Risk meter",
    emptyInput: "Please paste the ad first.",
  },
};

export function t(lang = "en") {
  return STRINGS[lang] || STRINGS.en;
}

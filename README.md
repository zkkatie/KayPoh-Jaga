# Kaypoh Jaga

**Made for seniors.**

Kaypoh Jaga is a free web app that checks suspicious ads before Singapore's seniors click them. Paste the words from an ad, or upload a screenshot or photo of it, and it flags warning signs, like a request to download an app or a WhatsApp-only contact, then explains in plain language whether the ad looks safe.

*An independent student project*

## Why

In October 2026, police warned about fake social media ads for senior activities that trick people into installing scam apps: at least 62 cases and $989,000 lost since April 2026. Seniors lose the most money per scam of any age group. The official advice is to check the organiser through an official website before signing up, which is exactly what Kaypoh Jaga helps with.

## How it works

```
screenshot or photo ──> read the words (Tesseract.js, on the device) ──┐
                                                                        ├──> find links ──> warning-sign rules ──> score ──> verdict + reasons
pasted text ────────────────────────────────────────────────────────────┘
```

- **Screenshots** (`js/ocr.js`): most scam ads are images, so users can pick a screenshot, take a photo of the screen, paste with Ctrl+V or drag a picture in. Tesseract.js reads the words in the browser, a light clean-up repairs links the reader splits (e.g. `https: //site .com`), and the text goes into the box so the user can see and fix it before the check runs.

- **Rules** (`js/engine.js`): each rule looks for one warning sign and has a weight. Serious signs (app downloads from links, "allow unknown sources", asking for an OTP or password, fake government links) weigh 30+; mild signs (WhatsApp sign-up, fees, short links, "limited slots") weigh 8–15.
- **Verdict**: *This looks like a scam* needs a score of 40+ **and** at least one serious sign. *Be careful* is 15+. Otherwise *No warning signs found*, which never says "safe", because no tool can prove an ad is real.
- **Lists** (`data/trusted.js`): official domains, link shorteners and the names scammers borrow. Kept apart from the rules so they can grow.
- **Languages** (`js/i18n/`): English, 中文, Melayu and தமிழ், one file each with the same keys. The choice is remembered on the device, and a test checks no language is missing any text.
- **Read it to me**: reads the verdict, advice and reasons aloud in the chosen language, slightly slower than normal, using the voices built into the phone. The button only appears when the device has a voice for that language.
- **Privacy**: everything runs in the browser. Nothing a user pastes or uploads is sent anywhere. The first time a picture is checked, the browser downloads the Tesseract reading engine and its English word data (about 7 MB) from the jsDelivr CDN and keeps a copy; only those program files are downloaded.

## Run it

No build step. Serve the folder and open `index.html`:

```
python -m http.server 8000
```

Run the tests (Node 18+). Screenshot reading itself needs a browser, so the tests cover the text clean-up; it was also tested in Chrome on four ad images, including a blurred, tilted photo of a screen.

```
npm test
```

## Design decisions

- **Mild signs alone can't make a "scam" verdict.** Early testing flagged a WhatsApp sign-up with a $10 fee and a short link as a scam. Genuine community groups do all three, so false alarms would teach users to ignore the app. Now a serious sign is required.
- **Never say "safe".** The green result says no warning signs were found and still points to the 1799 ScamShield Helpline.
- **Built for older users:** 20px base text, high-contrast colours, 56px buttons, one column, verdict shown by colour *and* words.
- **A proper website, not just a form:** sticky top bar with the logo in the middle, a centred headline above the checker, a guide to the six warning signs, a help section and a full footer. It adjusts from small phones (360px) to wide screens, with no sideways scrolling in any language.
- **Looks right when shared:** a share image and description for WhatsApp, Telegram and LinkedIn previews, plus icons for browser tabs and phone home screens.
- **Calm, editorial look:** warm paper background, a serif headline with one highlighted phrase, thin lines instead of boxes, round pill buttons, and one pop of colour (Kaypoh coral). The risk meter is a half circle of dots that fills green, amber, then red. Fonts (Newsreader and Inter, SIL Open Font Licence, `assets/fonts/`) are hosted with the app so no font requests go to other sites.

## Roadmap

- [x] Screenshot and photo checking with on-device text reading (OCR)
- [x] Chinese, Malay and Tamil, with read aloud
- [ ] Native-speaker review of the Chinese, Malay and Tamil wording
- [ ] Detect scam wording in Chinese, Malay and Tamil ads (the checker currently reads English ads)
- [ ] Check organisers against official listings of Active Ageing Centres
- [ ] "Send to my kid" button so family members can check for a parent
- [ ] Test with seniors at a community centre and record what confuses them

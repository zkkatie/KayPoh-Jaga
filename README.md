# Kaypoh Jaga

**Made for seniors.**

Kaypoh Jaga is a free web app that checks suspicious ads before Singapore's seniors click them. Paste the words and link from an ad for a senior activity, giveaway or government scheme, and it flags warning signs, like a request to download an app or a WhatsApp-only contact, then explains in plain language whether the ad looks safe.

*An independent student project, not affiliated with any government agency.*

## Why

In October 2026, police warned about fake social media ads for senior activities that trick people into installing scam apps: at least 62 cases and $989,000 lost since April 2026. Seniors lose the most money per scam of any age group. The official advice is to check the organiser through an official website before signing up, which is exactly what Kaypoh Jaga helps with.

## How it works

```
ad text + links ──> find links ──> run warning-sign rules ──> score ──> verdict + reasons
```

- **Rules** (`js/engine.js`): each rule looks for one warning sign and has a weight. Serious signs (app downloads from links, "allow unknown sources", asking for an OTP or password, fake government links) weigh 30+; mild signs (WhatsApp sign-up, fees, short links, "limited slots") weigh 8–15.
- **Verdict**: *This looks like a scam* needs a score of 40+ **and** at least one serious sign. *Be careful* is 15+. Otherwise *No warning signs found*, which never says "safe", because no tool can prove an ad is real.
- **Lists** (`data/trusted.js`): official domains, link shorteners and the names scammers borrow. Kept apart from the rules so they can grow.
- **Wording** (`js/strings.js`): every word on screen, keyed by language, ready for Chinese, Malay and Tamil.
- **Privacy**: everything runs in the browser. Nothing a user pastes is sent anywhere.

## Run it

No build step. Serve the folder and open `index.html`:

```
python -m http.server 8000
```

Run the tests (Node 18+):

```
npm test
```

## Design decisions

- **Mild signs alone can't make a "scam" verdict.** Early testing flagged a WhatsApp sign-up with a $10 fee and a short link as a scam. Genuine community groups do all three, so false alarms would teach users to ignore the app. Now a serious sign is required.
- **Never say "safe".** The green result says no warning signs were found and still points to the 1799 ScamShield Helpline.
- **Built for older users:** 20px base text, high-contrast colours, 56px buttons, one column, verdict shown by colour *and* words.

## Roadmap

- [ ] Screenshot upload with on-device text reading (OCR), since most ads are seen as images
- [ ] Chinese, Malay and Tamil
- [ ] Check organisers against official listings of Active Ageing Centres
- [ ] "Send to my kid" button so family members can check for a parent
- [ ] Test with seniors at a community centre and record what confuses them

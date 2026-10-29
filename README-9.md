# Audio Link on Netlify

Upload audio, get a short link, paste it into Instagram DMs or group chats. Includes voice effects, Pro codes, ads slot,
AI translation, and an installable app (PWA). Storage uses Netlify Blobs (no extra account needed).

## Deploy (pick one)

### A) With GitHub (easiest, Netlify builds everything)
1. Create a GitHub repo and upload all files in this folder (keep the folder structure shown in the guide).
2. In Netlify: Add new site > Import an existing project > pick the repo.
3. Build command: leave empty. Publish directory: `public`. Functions directory: `functions` (already set in netlify.toml).
4. Deploy. Your site opens at https://YOUR-NAME.netlify.app

### B) With the Netlify CLI
1. Install Node.js, then: `npm i -g netlify-cli`
2. In this folder: `npm install`
3. `netlify login`, then `netlify init` (create a new site), then `netlify deploy --prod`

Do not use drag-and-drop: it may not build the functions.

## Test
1. Open your site, upload a short MP3, copy the link, open it in a normal browser and press play.
2. Paste the link in an Instagram DM to yourself and check the preview card.
3. On Android, install the app from Chrome and try sharing a voice note into it.

## Limits on Netlify (important)
- Netlify functions accept request bodies up to about 6 MB (about 4.5 MB for audio). Defaults: Free 3 MB, Pro 4 MB (FREE_MAX_MB / PRO_MAX_MB). Do not set them above 4.
- A voice-effect file is saved as WAV: 4 MB is roughly 90 seconds. Plain MP3 at 4 MB is a few minutes.
- Functions run up to about 60 seconds, enough for each AI step (they run one at a time from the page).
- The daily cleanup job only runs on the published (production) deploy.
- Check your Netlify plan limits for function runs and Blobs storage.

## Settings (Site configuration > Environment variables)
All optional. See `env.example.txt` for names and defaults. Mark keys like OPENAI_API_KEY, STRIPE_SECRET, TURNSTILE_SECRET as secrets.

## Pro codes and credits
- Free users: 5 uploads/day per IP, 7-day links, ads. Pro: bigger files, 90-day links, no ads, 1 credit per upload.
- Give someone a code yourself: `netlify blobs:set data c:PRO-TEST-1234-ABCD '{"credits":20}'`
- Take payments: make a Stripe Payment Link whose after-payment redirect is `https://YOUR-SITE/redeem?session_id={CHECKOUT_SESSION_ID}`, put the link in STRIPE_LINK, and add STRIPE_SECRET (a restricted key that can only read Checkout Sessions).
- A code works like a simple account: anyone who has it can use its credits.

## AI translation (Pro)
Add OPENAI_API_KEY. Pro users pick up to 3 languages (clips up to 60 seconds). Cost: 1 credit upload + 1 transcribe + 2 per language (AI_TRANSCRIBE_CREDITS / AI_LANG_CREDITS). Failed steps are refunded. Voices are generic AI voices and are labeled "AI-translated". Set your credit prices so they cover OpenAI's real cost.

## Human check, ads, preview picture
- Turnstile: set TURNSTILE_SITEKEY and TURNSTILE_SECRET.
- AdSense: set ADSENSE_CLIENT and ADSENSE_SLOT. EU/UK visitors need a cookie banner (not included).
- A default preview picture is built in at /og.png. Set OG_IMAGE to use your own 1200x630 PNG.

## Share audio into the app (Android)
After installing the app in Chrome, Audio Link appears in the share sheet of other apps. iPhone does not support this.
If the app was installed before an update, remove and reinstall it.

## AI voice changer (Pro) with licensed stock voices
Changes the speaker's voice into a different voice (keeps the words, timing and emotion). Uses ElevenLabs Voice Changer.
1. Create an ElevenLabs account and API key. Add it in Netlify as the secret `ELEVENLABS_API_KEY`.
2. Pick up to 8 voices in your ElevenLabs account and copy each voice ID.
3. Add an environment variable `AI_VOICES` like this (one line):
   `[{"id":"VOICE_ID_1","name":"Deep Narrator","emoji":"🎙️"},{"id":"VOICE_ID_2","name":"Bright Voice","emoji":"✨"}]`
4. Redeploy. Pro users then see "AI voice" on the upload page (clips up to 60 seconds, 2 credits by default: `AI_VOICE_CREDITS`).
Important:
- Only use voices that your ElevenLabs plan allows for commercial use. Do NOT use voices that imitate real people or celebrities.
- Listening pages show "AI-changed voice". The original recording is replaced by the converted one, and failed conversions are refunded.
- Check ElevenLabs' current pricing and set your credit prices so each pack covers the cost.

## Recording, accent styles and more languages
- **Record now:** a mic button on the home page records up to 60 seconds. It can be blocked inside Instagram's built-in browser; open the page in Chrome or Safari (or the installed app) if so.
- **Voice filters (free):** Chipmunk and Princess were added to the voice row, next to the other filters.
- **Accent styles (Pro, uses your OpenAI key):** Cute, Bhojpuri film style, Arabic accent, Nepali accent. They change how the AI voice speaks the translation. The first language you make for a link sets the style for that link.
- **Languages:** 30 now, including Nepali and Bhojpuri. Bhojpuri and Nepali voices are experimental: text is translated into Devanagari and spoken by a general voice, so pronunciation can sound Hindi-like.
- Styles need `TTS_MODEL` to be a gpt-4o style model (the default). Older models ignore styles.
- Accents are AI voices, not the speaker's own voice, and they are approximate.

## Recording, voice styles and more languages
- **Record now:** the home page has a "Record now" button (max 60 seconds). It needs microphone permission and may be blocked inside Instagram's built-in browser. Open the page in Chrome or Safari, or use the installed app.
- **Free voice filters (run in the browser):** Chipmunk, Princess, Cute Sidekick, Dramatic Villain, and more. They are pitch/echo filters, like Instagram's effects. They are not AI.
- **Pro voice styles (AI, uses OpenAI text-to-speech):** Cute, Princess, Bhojpuri film style, Arabic accent, Nepali accent. Pick languages first, then an optional style. One style applies to all languages on a link. Styles need a TTS model that supports instructions (default: gpt-4o-mini-tts).
- **More translation languages:** 30 in total, including Nepali and Bhojpuri. Bhojpuri and Nepali are experimental: the text is written in Devanagari and spoken by a Hindi-like voice, so pronunciation will not be perfect.
- Accent styles are meant to sound natural and respectful. Do not use them to mock people.

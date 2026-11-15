# ThaiAI Live Studio — Android-first starter

## What this build does
- Mobile-friendly web control panel / installable PWA shell.
- Generates Thai host dialogue using OpenAI when an API key is configured; otherwise uses built-in sample lines.
- Uses Android Chrome speech synthesis for Thai voice when the device has a Thai TTS voice installed.
- Includes a simple 2D host placeholder and a separate overlay page.

## Deploy from a phone
This project needs to run on an HTTPS Node.js host. A cloud IDE/host such as Replit or Render can be used:
1. Upload this ZIP to a Node.js project.
2. Run `npm install` and `npm start` (or deploy using `render.yaml`).
3. Add `OPENAI_API_KEY` as a server-side environment variable if you want generated dialogue. Never put the key in browser JavaScript or share it.
4. Open the deployed HTTPS URL in Android Chrome.
5. Chrome menu → Add to Home screen / Install app.

## Android voice
Enable a Thai speech engine in Android Settings → Accessibility or Text-to-speech output (menu names vary by device). Open the dashboard in Chrome and press a button once to allow speech playback. Voice selection and sound routing depend on the device.

## TikTok LIVE: important reality check
- Having TikTok LIVE access does not guarantee that the account has a stream key or RTMP access.
- The web app cannot log into TikTok, unlock LIVE features, create a stream key, or start a LIVE session on the user's behalf.
- If TikTok offers LIVE screen sharing on the account, test whether Android broadcasts the browser's generated audio as well as the screen. Some device/app combinations may not route app audio into the LIVE.
- If TikTok provides an RTMP URL and stream key to the account, use a reputable Android RTMP broadcaster that supports the required video/audio input. Keep the key private.
- The project does not scrape TikTok, use session cookies, or automate comments. Comment integration needs an approved API/provider and appropriate permissions.
- For uninterrupted multi-hour streaming, the host phone must stay powered, connected, awake as required, and the stream must be monitored. Android may suspend background tabs; keep the dashboard foregrounded during testing.

## Limitations
The included avatar is a simple 2D placeholder, not a photorealistic talking human. Browser TTS is not studio-quality and can stop if the browser/app is backgrounded. The current auto-talk loop is for controlled testing, not unattended production streaming. A production version needs a licensed Thai TTS provider, rigged 3D/Live2D avatar renderer, permitted TikTok comment integration, moderation, and a reliable streaming encoder.

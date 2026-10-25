# Español: learn Spanish page by page

A mobile-first web app that takes Filipino learners from zero Spanish toward C2, one short interactive page at a time. It teaches **Spain standard Spanish** (castellano peninsular): vosotros in every conjugation, Spain vocabulary (coche, zumo, euros) and a Spain voice. There's no AI at runtime: lessons and exams are fixed, human-reviewed content, and answers are checked with plain rules. The only model is Whisper for speaking practice, and it runs on the learner's own phone.

**What's built (v1, level A1):**

- **Path:** a home screen with levels A1–C2, 8 A1 topics, a test after every topic, a final exam and a certificate.
- **Lessons:** 40 lessons and 304 pages, using 9 page types: explain, multiple choice, match pairs, word builder, type it (with an accent bar), listen, conjugate, dialogue and speak it.
- **Gates:** each topic ends in a test of 10 random questions; you need 85% to unlock the next topic. Passed topics stay open for review and practice tests, and practice never changes progress.
- **Final exam:** 40 questions in 30 minutes, 85% to pass, and a 24-hour wait after a fail.
- **Certificate:** issued after passing the final, as a PDF with an ID and QR code, checkable by anyone at `/verify/<ID>`.
- **Talk tab:** one conversation per topic, with play-all, slow mode and English on/off.
- **Review tab:** spaced repetition with Leitner boxes. Words from every finished lesson land in the deck.
- **Motivation:** XP, a daily goal, a streak and hearts.
- **Speaking:** record on the device, then Whisper (Transformers.js) transcribes it and each word is marked green or coral. The learner can play back their own voice next to the native audio. Spoken exam answers are checked against patterns.
- **Audio:** pre-generated Piper MP3s when available, otherwise the browser's built-in Spanish voice.

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 with the design tokens from the mockups (`app/globals.css`) |
| Database | PostgreSQL with Drizzle ORM (`lib/db/schema.ts`) |
| Hosting | Vercel (app + API), Neon (Postgres), Cloudflare R2 (audio, optional model mirror) |
| Speech | `@huggingface/transformers` 4.3.0 + `onnx-community/whisper-tiny`, in a Web Worker |
| PDF | `pdf-lib` + `qrcode` |

Drizzle replaced Prisma from the plan. It's pure JavaScript (no engine binaries to download), lighter on serverless, and keeps the same Postgres tables.

## Run it locally

```bash
npm install
cp .env.example .env          # set DATABASE_URL to any Postgres 14+
npm run db:push               # creates the tables
npm run dev                   # http://localhost:3000
```

Checks:

```bash
npm test                      # answer checking + unlock rules (node:test)
npm run content:check         # validates every lesson and question bank
npm run typecheck
npx tsx scripts/e2e-walkthrough.ts http://localhost:3000 screens   # full browser walkthrough (needs Playwright + Chromium)
```

The walkthrough plays topic 1 through the UI, passes all topic tests, takes the final, claims a certificate and checks the PDF and verify page. It also checks the rules: locked lessons are refused, a failed test keeps the next topic locked, and a failed final enforces the 24-hour wait.

## Deploy to Vercel

1. Push this folder to a GitHub repo and import it in Vercel.
2. **Storage → Add → Neon Postgres** (Vercel Marketplace). This sets `DATABASE_URL`; use the pooled connection string.
3. Add environment variables:
   - `NEXT_PUBLIC_SITE_URL`: your domain, e.g. `https://espanol.example.com` (used in certificate QR codes).
   - `NEXT_PUBLIC_AUDIO_BASE` (optional): the public URL of your R2 audio bucket.
   - `NEXT_PUBLIC_MODEL_BASE` (optional): an R2 mirror of the Whisper model. If empty, the model comes from the Hugging Face hub.
4. Create the tables once, from your computer: `DATABASE_URL="<neon url>" npm run db:push`.
5. Deploy.

Vercel's free Hobby plan is for non-commercial use only. Move to Pro before adding payments or ads.

## Lesson audio (Piper → R2)

```bash
npx tsx scripts/generate-audio.ts --list            # 444 phrases in A1
pip install piper-tts                                 # plus ffmpeg
PIPER_MODEL=./voices/es_ES-<voice>.onnx npm run audio:generate   # use a Spain (es_ES) voice
```

This writes `audio-out/<hash>.mp3` plus `manifest.json`. Upload the folder to a public R2 bucket and set `NEXT_PUBLIC_AUDIO_BASE`. Re-running only generates new phrases. Check the chosen voice's licence before publishing. Until audio is uploaded, the app uses the browser's Spanish voice.

## Speaking practice

`public/speech/whisper-worker.js` loads Transformers.js from jsDelivr and the `whisper-tiny` model (about 40 MB) on first use. After that the browser caches it, so it isn't downloaded again. Recordings never leave the device. To self-host, mirror the model repo's files into R2 under the same path layout (`onnx-community/whisper-tiny/resolve/main/...`) and set `NEXT_PUBLIC_MODEL_BASE`. If the microphone or model isn't available, lessons offer "Skip for now" and exams offer "Skip this question". A skipped exam question doesn't count toward the score.

## Writing content

- Lessons live in `content/es/a1/t01.ts` … `t08.ts`, built with the helpers in `content/helpers.ts` (`explain`, `choice`, `match`, `build`, `typeIt`, `listen`, `conj`, `dialogue`, `speak`).
- Each topic has a `bank` of exam questions (`q.choice`, `q.listen`, `q.type`, `q.build`, `q.speak`).
- Spoken answers use `patterns`: regular expressions tested against the transcript, lowercased with accents removed. Each pattern needs a `sample` that matches it.
- Run `npm run content:check` after any edit. It catches out-of-range answers, duplicate tiles, banks missing a skill, and patterns that don't match their own sample.
- To add a level, add a `Level` to `content/index.ts` with its topics, then remove it from `UPCOMING`.

Question banks stay on the server. Exams get questions without answers from `/api/exam/start` and are graded in `/api/exam/submit`.

## Project map

```
app/                     pages and API routes
  api/progress           progress + lesson completion (enforces unlocks)
  api/exam/start|submit  random question sets, server-side grading, 85% gates
  api/review             spaced-repetition cards
  api/certificate        issue certificate, PDF
  lesson/[id]  topic/[id]  talk  review  me  exam/...  certificate/...  verify/[id]
components/              UI (lesson pages, exam player, speech, path)
content/                 course content, typed
lib/answers.ts           answer checking (accent-tolerant typing, word builder, speech compare)
lib/progression.ts       unlock rules, shared by server and browser
lib/server/              database access, exams, certificates
lib/client/              audio, speech recording + Whisper, API, store
scripts/                 content check, audio generation, browser walkthrough
```

## Known limits

- Progress is tied to a browser cookie, with no sign-in yet. Clearing site data starts over. Accounts (Auth.js) are the next step.
- A2–C2 show on the path as "coming soon"; only A1 is written.
- Spanish content should get a native-speaker review before launch.
- The certificate is a course certificate aligned with CEFR, not an official DELE or SIELE diploma, and it says so.

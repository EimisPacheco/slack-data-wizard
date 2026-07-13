# voice-agent

An **ElevenLabs Conversational AI voice agent** that calls Data Wizard functions by voice, with
the whole spoken exchange — your words, the agent's, and Data Wizard's answers — **posted into
Slack chat** as a transcript.

```
you speak ──▶ ElevenLabs agent ──webhook tool──▶ /voice/ask ──▶ Data Wizard (Databricks)
                     │                                              │
              speaks the answer ◀───────────────────────────── short answer
                     │
        post-call transcript ──▶ /voice/transcript ──▶ posted to Slack
        (and each Q&A is posted to Slack in real time)
```

## Pieces

- **The agent** — "Data Wizard Voice" (`agent_0001kx9sw5p9eedvjj5ktnz5hrpt`), created via the
  Node SDK, with a `query_data` webhook tool attached.
- **`server.js`** —
  - `POST /voice/ask` — the tool the agent calls: runs Data Wizard (`nl2sql`), returns a short
    spoken answer, and posts the exchange to Slack. Destructive SQL is refused by voice.
  - `POST /voice/transcript` — ElevenLabs post-call webhook: posts the full conversation script.
- **`create.mjs` / `attach.mjs`** — create the agent and attach the webhook tool.

## Run

```bash
npm install
node server.js                       # backend on :3300
cloudflared tunnel --url http://localhost:3300   # public URL the agent calls
```

Set `SLACK_TRANSCRIPT_CHANNEL` in `.env` to the channel/DM where transcripts should appear
(the bot must be able to post there). `SLACK_BOT_TOKEN` and `DATABRICKS_*` are already in `.env`.

## Verified (without live voice)

Tested by calling the webhook exactly as the agent does:
- `/voice/ask` → "how many signups per country?" → spoken answer "US 6, GB 3, AT 1" **and** posted
  to Slack. Destructive request refused by voice.
- `/voice/transcript` → full 4-line script posted to Slack.
- Confirmed over the **public tunnel URL** (the agent's real call path) and against a live Slack DM.

## The one blocker: credits

Creating/configuring agents and posting to Slack all work at 0 credits. But **holding an actual
voice conversation consumes ElevenLabs credits, and the account is at 0 / 10,000.** Everything is
wired; the moment the account has credits you can speak to the agent and this whole chain fires.

## To go live

1. ElevenLabs credits.
2. Backend + tunnel running (the tunnel URL is ephemeral — re-run `attach.mjs` if it changes, or
   use a stable URL).
3. Start a conversation via the agent's shareable link/widget (ElevenLabs dashboard → the agent),
   passing `slack_channel` as a dynamic variable if you want per-session Slack targeting.

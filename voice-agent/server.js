/**
 * Voice-agent backend.
 *
 * The ElevenLabs voice agent calls these webhooks during a spoken conversation:
 *   POST /voice/ask        — a "tool" the agent invokes to answer a data question via Data Wizard.
 *                            Returns a short spoken answer AND posts the exchange to Slack.
 *   POST /voice/transcript — ElevenLabs post-call webhook: the full conversation transcript,
 *                            which we post to Slack as the script of the whole interaction.
 *
 * So the voice back-and-forth (user + agent) and Data Wizard's answers all appear in Slack chat.
 */
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';

const ROOT = path.resolve(import.meta.dirname, '..');
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const { planQuery, runPlanned, formatRows } = await import(path.join(ROOT, 'slack-data-agent', 'nl2sql.js'));

const DEFAULT_CATALOG = process.env.DATABRICKS_CATALOG || 'workspace';
const DEFAULT_SCHEMA = process.env.DATABRICKS_SCHEMA || 'data_wizard';

/** Post a message to Slack via the bot token. Channel from arg or SLACK_TRANSCRIPT_CHANNEL. */
async function postToSlack(channel, text, blocks) {
  const ch = channel || process.env.SLACK_TRANSCRIPT_CHANNEL;
  if (!ch) return { ok: false, skipped: 'no channel' };
  const r = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel: ch, text, ...(blocks ? { blocks } : {}) }),
  });
  return r.json();
}

/** Turns a query result into a short, speakable answer for the voice agent. */
function speakable(plan, out) {
  if (plan.kind !== 'read') return `Done. ${plan.explanation}`;
  if (!out.rows.length) return `${plan.explanation} No rows matched.`;
  const cols = Object.keys(out.rows[0]);
  if (out.rows.length === 1 && cols.length === 1) return `${plan.explanation} The answer is ${out.rows[0][cols[0]]}.`;
  const top = out.rows.slice(0, 3).map(r => cols.map(c => `${c} ${r[c]}`).join(', ')).join('; ');
  return `${plan.explanation} Top results: ${top}.` + (out.rows.length > 3 ? ` And ${out.rows.length - 3} more.` : '');
}

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(import.meta.dirname, 'public')));
app.get('/', (_req, res) => res.json({ status: 'ok', server: 'voice-agent', talk: '/talk' }));

// ── the function the agent calls when you ask a data question by voice ──
app.post('/voice/ask', async (req, res) => {
  try {
    console.log('[/voice/ask] body:', JSON.stringify(req.body));
    const question = req.body?.question || req.body?.command_value || '';
    const channel = req.body?.slack_channel;
    if (!question) return res.status(400).json({ answer: 'I did not catch a question.' });

    const ctx = { catalog: req.body?.catalog || DEFAULT_CATALOG, schema: req.body?.schema || DEFAULT_SCHEMA };
    const plan = await planQuery(question, ctx);

    let answer, slackText;
    if (!plan.ok) {
      answer = `I couldn't answer that: ${plan.reason}`;
      slackText = `:studio_microphone: *You asked:* ${question}\n:magic_wand: *Data Wizard:* ${answer}`;
    } else if (plan.needsConfirmation) {
      answer = `That would change your data, so I won't run it out loud. The SQL is ready for you to confirm in Slack.`;
      slackText = `:studio_microphone: *You asked:* ${question}\n:warning: *Data Wizard:* destructive — not run by voice.\n\`${plan.sql}\``;
    } else {
      const out = await runPlanned(plan, ctx);
      answer = speakable(plan, out);
      const body = out.kind === 'read' ? '\n' + formatRows(out.rows, 8) : `\nAffected ${out.affectedRows} rows.`;
      slackText = `:studio_microphone: *You asked:* ${question}\n:magic_wand: *Data Wizard:* ${plan.explanation}${body}\n\`${plan.sql}\``;
    }

    // Represent the voice exchange in Slack chat
    await postToSlack(channel, slackText);
    // Return the spoken answer to the ElevenLabs agent
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ answer: `Something went wrong: ${err.message}` });
  }
});

// ── ElevenLabs post-call webhook: the full transcript → Slack script ──
app.post('/voice/transcript', async (req, res) => {
  try {
    const data = req.body?.data || req.body || {};
    const channel = data.conversation_initiation_client_data?.dynamic_variables?.slack_channel;
    const turns = data.transcript || data.messages || [];
    const lines = turns.map(t => {
      const who = (t.role === 'user' || t.role === 'human') ? '🗣️ You' : '🤖 Agent';
      const msg = t.message ?? t.text ?? '';
      return msg ? `${who}: ${msg}` : null;
    }).filter(Boolean);
    const script = lines.length ? lines.join('\n') : '_(empty transcript)_';
    await postToSlack(channel, `:speech_balloon: *Voice conversation transcript*\n${script}`);
    res.json({ ok: true, lines: lines.length });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = Number(process.env.VOICE_PORT || 3300);
app.listen(PORT, () => console.log(`🎙️  Voice-agent backend on http://localhost:${PORT}`));

import fs from 'node:fs';
for (const l of fs.readFileSync('../.env','utf8').split('\n')) { const m=l.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/); if(m) process.env[m[1]]=m[2]; }
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
const agentId = fs.readFileSync('/tmp/new_agent_id.txt','utf8').trim();
try {
  const r = await client.conversationalAi.conversations.getSignedUrl({ agentId });
  const url = r.signedUrl || r.signed_url || r;
  console.log('✅ signed URL obtained (connection path works)');
  console.log('   ', String(url).slice(0,75)+'…');
  console.log('   → a browser/mobile/Slack-linked client opens this WebSocket to talk to the agent');
} catch(e) {
  console.log('signed-url error:', e.message?.slice(0,160));
}

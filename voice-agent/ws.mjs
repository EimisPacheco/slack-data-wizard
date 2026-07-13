import fs from 'node:fs';
for (const l of fs.readFileSync('../.env','utf8').split('\n')) { const m=l.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/); if(m) process.env[m[1]]=m[2]; }
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
const agentId = fs.readFileSync('/tmp/new_agent_id.txt','utf8').trim();

const { signedUrl } = await client.conversationalAi.conversations.getSignedUrl({ agentId });
console.log('connecting to agent over WebSocket (text mode)…');
const ws = new WebSocket(signedUrl);
let done = false;
const finish = (why) => { if(!done){done=true; console.log('--- end:', why); ws.close(); } };

ws.addEventListener('open', () => {
  ws.send(JSON.stringify({ type:'conversation_initiation_client_data' }));
});
ws.addEventListener('message', (ev) => {
  let m; try { m = JSON.parse(ev.data); } catch { return; }
  if (m.type === 'conversation_initiation_metadata') {
    console.log('  ✅ conversation started; sending text question…');
    ws.send(JSON.stringify({ type:'user_message', text:'How many signups are there per country?' }));
  } else if (m.type === 'agent_response') {
    console.log('  🤖 agent:', (m.agent_response_event?.agent_response||'').slice(0,180));
  } else if (m.type === 'agent_tool_response' || m.type === 'client_tool_call') {
    console.log('  🔧 tool event:', JSON.stringify(m).slice(0,160));
  } else if (m.type === 'user_transcript') {
    console.log('  🗣️ user:', m.user_transcription_event?.user_transcript);
  } else if (/error|quota/i.test(JSON.stringify(m))) {
    console.log('  ⚠️', JSON.stringify(m).slice(0,180));
  }
});
ws.addEventListener('error', (e) => { console.log('  ws error:', e.message||e.type); finish('error'); });
ws.addEventListener('close', () => finish('closed'));
setTimeout(() => finish('timeout 35s'), 35000);

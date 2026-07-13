import fs from 'node:fs';
for (const l of fs.readFileSync('../.env','utf8').split('\n')) { const m=l.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/); if(m) process.env[m[1]]=m[2]; }
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
const agentId = fs.readFileSync('/tmp/new_agent_id.txt','utf8').trim();

console.log('running simulated conversation (agent decides whether to call query_data)…');
const res = await client.conversationalAi.agents.simulateConversation(agentId, {
  simulationSpecification: {
    simulatedUserConfig: {
      firstMessage: 'How many signups are there per country?',
      prompt: { prompt: 'You are a user of a data assistant. Ask exactly: how many signups are there per country. After it answers with numbers, say "thanks, bye".' },
    },
  },
  newTurnsLimit: 6,
});

const hist = res.simulatedConversation || res.simulated_conversation || res.transcript || [];
console.log('\n=== TRANSCRIPT ===');
let toolCalled = false;
for (const turn of hist) {
  const role = turn.role || turn.speaker;
  const msg = turn.message ?? turn.text ?? '';
  if (msg) console.log(`  ${role}: ${msg.slice(0,160)}`);
  const tcs = turn.toolCalls || turn.tool_calls || [];
  for (const tc of tcs) { toolCalled = true; console.log(`     🔧 tool call: ${tc.toolName||tc.tool_name||tc.name} (${JSON.stringify(tc.params||tc.parameters||{}).slice(0,80)})`); }
}
console.log('\nquery_data tool was called by the agent:', toolCalled ? '✅ YES' : '❔ (check transcript above)');

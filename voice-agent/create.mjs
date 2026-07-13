import fs from 'node:fs';
for (const l of fs.readFileSync('../.env','utf8').split('\n')) { const m=l.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/); if(m) process.env[m[1]]=m[2]; }
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

console.log('creating voice agent…');
const agent = await client.conversationalAi.agents.create({
  name: 'Data Wizard Voice',
  tags: ['data-wizard','hackathon'],
  conversationConfig: {
    agent: {
      firstMessage: "Hi, I'm the Data Wizard. Ask me to create a table, pull real statistics, or query your data.",
      language: 'en',
      prompt: {
        prompt: "You are Data Wizard, a friendly voice assistant for a Databricks lakehouse. " +
          "You help users create tables from web data or synthetic data, query their tables in plain English, " +
          "and turn scanned documents or drawings into tables. Keep spoken answers short and clear.",
      },
    },
    tts: { voiceId: 'EXAVITQu4vr4xnSDxMaL' }, // Sarah (premade)
  },
});
console.log('✅ created agent_id:', agent.agentId);
fs.writeFileSync('/tmp/new_agent_id.txt', agent.agentId);

// verify by fetching it back
const got = await client.conversationalAi.agents.get(agent.agentId);
console.log('✅ verified: name =', got.name, '| first_message =', got.conversationConfig?.agent?.firstMessage?.slice(0,50)+'…');
console.log('   voice =', got.conversationConfig?.tts?.voiceId, '| language =', got.conversationConfig?.agent?.language);

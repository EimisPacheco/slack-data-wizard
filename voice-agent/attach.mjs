import fs from 'node:fs';
for (const l of fs.readFileSync('../.env','utf8').split('\n')) { const m=l.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/); if(m) process.env[m[1]]=m[2]; }
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
const agentId = fs.readFileSync('/tmp/new_agent_id.txt','utf8').trim();
const URL = 'https://layers-bind-forget-pixel.trycloudflare.com';

// 1) create the webhook tool
const tool = await client.conversationalAi.tools.create({
  toolConfig: {
    type: 'webhook',
    name: 'query_data',
    description: 'Answer a question about the user\'s data by querying the Databricks lakehouse. Use for any data question.',
    apiSchema: {
      url: URL + '/voice/ask',
      method: 'POST',
      requestBodySchema: {
        type: 'object',
        description: 'the data question',
        properties: { question: { type: 'string', description: 'the natural-language data question the user asked' } },
        required: ['question'],
      },
    },
  },
});
const toolId = tool.id || tool.toolId;
console.log('✅ created tool query_data:', toolId);

// 2) attach it to the agent
await client.conversationalAi.agents.update(agentId, {
  conversationConfig: { agent: { prompt: { toolIds: [toolId] } } },
});
// 3) verify
const got = await client.conversationalAi.agents.get(agentId);
console.log('✅ agent now has toolIds:', got.conversationConfig?.agent?.prompt?.toolIds);

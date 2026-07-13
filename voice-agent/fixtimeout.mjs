import fs from 'node:fs';
for (const l of fs.readFileSync('../.env','utf8').split('\n')) { const m=l.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/); if(m) process.env[m[1]]=m[2]; }
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
const agentId = fs.readFileSync('/tmp/new_agent_id.txt','utf8').trim();
// find our query_data tool
const list = await client.conversationalAi.tools.list();
const tools = list.tools || list;
const t = tools.find(x => (x.toolConfig?.name||x.name) === 'query_data');
const toolId = t.id || t.toolId;
console.log('updating tool', toolId, 'responseTimeoutSecs → 30');
const url = fs.readFileSync('/tmp/va_url.txt','utf8').trim();
await client.conversationalAi.tools.update(toolId, {
  toolConfig: {
    type: 'webhook', name: 'query_data',
    description: "Answer a question about the user's data by querying the Databricks lakehouse. Use for any data question.",
    responseTimeoutSecs: 30,
    apiSchema: {
      url: url + '/voice/ask', method: 'POST',
      requestBodySchema: { type:'object', description:'the data question',
        properties: { question: { type:'string', description:'the natural-language data question the user asked' } },
        required:['question'] },
    },
  },
});
console.log('✅ timeout updated to 30s');

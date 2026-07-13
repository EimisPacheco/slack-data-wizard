# data-wizard-mcp-server

Exposes Data Wizard's data capabilities as **MCP tools over HTTP**, so **Slackbot's MCP client**
(or any MCP client — Claude Desktop, Cursor, ChatGPT) can discover and invoke them from natural
conversation. This is the hackathon's "MCP server integration" — we *build the server*; Slack is
the client.

```
Slackbot ──JSON-RPC / Streamable HTTP──▶ this server ──▶ Databricks / Perplexity / OpenAI
```

It reuses the exact modules the Slack app uses — nothing is reimplemented.

## Tools exposed

| Tool | What it does |
|---|---|
| `list_namespaces` | list Databricks catalogs and a catalog's schemas |
| `list_tables` | list tables in a catalog.schema |
| `query_data` | NL → Databricks SQL; runs reads/creates, **refuses destructive SQL** (returns it for a human to run) |
| `create_table_from_web` | Perplexity web search → real stats → new Databricks table (with citations) |
| `generate_synthetic_table` | OpenAI → synthetic rows → new Databricks table |

Each tool ships a JSON-Schema input contract so Slackbot knows how to prompt for arguments.

## Run

```bash
npm install
node server.js          # → http://localhost:3100/mcp
```

Reads credentials from the repo-root `.env` (`DATABRICKS_*`, `PERPLEXITY_API_KEY`, `OPENAI_API_KEY`).

## Expose it (Slack needs a public HTTPS URL)

The server listens on plain HTTP locally; Slack's MCP client requires HTTPS. For the demo:

```bash
ngrok http 3100
# → https://<something>.ngrok-free.app   (your MCP endpoint is .../mcp)
```

Or host it on your AMD droplet behind TLS. Either way the MCP URL is `<base>/mcp`.

## Register it in Slack (Slackbot MCP client)

1. api.slack.com/apps → your app → **MCP Servers** (left sidebar).
2. **Add server** → URL `https://<your-ngrok>/mcp`, authentication **No auth**
   (this server doesn't gate on Slack identity).
3. Save. A user then activates it in Slackbot (up to 5 MCP servers per user). Slackbot
   auto-discovers the tools and calls them from conversation, asking the user to authorize
   each call.

## Verified

- `initialize`, `tools/list`, `tools/call` over Streamable HTTP (stateless, `enableJsonResponse`).
- Confirmed with a **real MCP client** (`@modelcontextprotocol/sdk` `StreamableHTTPClientTransport`),
  not just curl — the same transport Slackbot uses.
- `generate_synthetic_table` and `create_table_from_web` create correctly-named Databricks tables
  with real/synthetic data (verified by querying them back).
- `query_data` refuses destructive SQL: "drop the … table" returns the SQL **unexecuted**.

## Safety

`query_data` runs LLM-generated SQL, so it carries the same `guard.js` classifier: multi-statement
input refused, `DROP`/`DELETE`/`UPDATE`/`CREATE OR REPLACE` never auto-run (returned for a human).
Slackbot's own per-tool authorization is a second gate. As with the Slack app, Free Edition has no
read-only DB role, so don't point this at production data.

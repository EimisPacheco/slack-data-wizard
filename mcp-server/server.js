/**
 * Data Wizard MCP server.
 *
 * Exposes Data Wizard's data capabilities as MCP tools over Streamable HTTP, so Slackbot
 * (or any MCP client) can discover and invoke them from natural conversation. Reuses the
 * same tested modules the Slack app uses — nothing is reimplemented.
 *
 *   Slackbot ──JSON-RPC/HTTP──▶ this server ──▶ Databricks / Perplexity / OpenAI
 */
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

const ROOT = path.resolve(import.meta.dirname, '..');
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const SDA = path.join(ROOT, 'slack-data-agent');
const dbx = await import(path.join(SDA, 'databricks.js'));
const { planQuery, runPlanned, formatRows } = await import(path.join(SDA, 'nl2sql.js'));
const { loadFlatTable } = await import(path.join(SDA, 'medallion.js'));
const { fromSearch, synthetic } = await import(path.join(ROOT, 'datagen', 'datagen.js'));

const DEFAULT_CATALOG = process.env.DATABRICKS_CATALOG || 'workspace';
const DEFAULT_SCHEMA = process.env.DATABRICKS_SCHEMA || 'data_wizard';
const text = s => ({ content: [{ type: 'text', text: String(s) }] });

/** Create a Databricks table (exact name) from CSV text. */
async function createTableFromCsv(catalog, schema, table, csvText) {
  await dbx.ensureSchema(catalog, schema);
  const r = await loadFlatTable({ catalog, schema, table, csvText });
  return r.rowsInserted;
}

/** Builds a fresh McpServer with all tools registered. */
function buildServer() {
  const server = new McpServer({ name: 'data-wizard', version: '1.0.0' });

  server.registerTool('list_namespaces', {
    title: 'List catalogs and schemas',
    description: 'List Databricks catalogs, and the schemas in a given catalog.',
    inputSchema: { catalog: z.string().optional().describe('catalog to list schemas for; defaults to workspace') },
  }, async ({ catalog }) => {
    const cats = await dbx.listCatalogs();
    const schemas = await dbx.listSchemas(catalog || DEFAULT_CATALOG);
    return text(`Catalogs: ${cats.join(', ')}\nSchemas in ${catalog || DEFAULT_CATALOG}: ${schemas.join(', ')}`);
  });

  server.registerTool('list_tables', {
    title: 'List tables',
    description: 'List the tables in a catalog.schema (defaults to workspace.data_wizard).',
    inputSchema: {
      catalog: z.string().optional(),
      schema: z.string().optional(),
    },
  }, async ({ catalog, schema }) => {
    const c = catalog || DEFAULT_CATALOG, s = schema || DEFAULT_SCHEMA;
    const tables = await dbx.listTables(c, s);
    return text(tables.length ? `Tables in ${c}.${s}:\n- ${tables.join('\n- ')}` : `${c}.${s} has no tables.`);
  });

  server.registerTool('query_data', {
    title: 'Query data in plain English',
    description: 'Answer a question about the data by generating and running Databricks SQL. ' +
      'Read/create queries run and return results. Destructive statements (DROP/DELETE/UPDATE/…) ' +
      'are NOT executed — the SQL is returned for a human to run deliberately.',
    inputSchema: {
      question: z.string().describe('the natural-language question'),
      catalog: z.string().optional(),
      schema: z.string().optional(),
    },
  }, async ({ question, catalog, schema }) => {
    const ctx = { catalog: catalog || DEFAULT_CATALOG, schema: schema || DEFAULT_SCHEMA };
    const plan = await planQuery(question, ctx);
    if (!plan.ok) return text(`Could not run this: ${plan.reason}`);
    if (plan.needsConfirmation) {
      return text(`⚠️ This is a destructive change and was NOT executed. Review and run it deliberately:\n${plan.sql}`);
    }
    const out = await runPlanned(plan, ctx);
    if (out.kind === 'read') return text(`${plan.explanation}\n\n${formatRows(out.rows)}\n\nSQL: ${plan.sql}`);
    return text(`${plan.explanation}\nAffected ${out.affectedRows} rows.\nSQL: ${plan.sql}`);
  });

  server.registerTool('create_table_from_web', {
    title: 'Create a table from real web data',
    description: 'Search the web (Perplexity) for real, current statistics matching a description ' +
      'and load them into a new Databricks table. Use for "top 10 countries by GDP", etc.',
    inputSchema: {
      description: z.string().describe('what data to fetch, e.g. "top 10 countries by population 2026"'),
      table: z.string().describe('name for the new table'),
      catalog: z.string().optional(),
      schema: z.string().optional(),
    },
  }, async ({ description, table, catalog, schema }) => {
    const c = catalog || DEFAULT_CATALOG, s = schema || DEFAULT_SCHEMA;
    const gen = await fromSearch(description);
    const n = await createTableFromCsv(c, s, table, gen.csv);
    return text(`Created ${c}.${s}.${table} with ${n} rows of real data (${gen.columns.join(', ')}). ` +
      `Sources: ${gen.citations.slice(0, 5).join(' ')}`);
  });

  server.registerTool('generate_synthetic_table', {
    title: 'Generate a synthetic table',
    description: 'Generate realistic FAKE data (OpenAI) matching a description and load it into a new ' +
      'Databricks table. Use for sample/dummy/test data.',
    inputSchema: {
      description: z.string().describe('what fake data to make, e.g. "20 sample employees with name, dept, salary"'),
      table: z.string().describe('name for the new table'),
      catalog: z.string().optional(),
      schema: z.string().optional(),
    },
  }, async ({ description, table, catalog, schema }) => {
    const c = catalog || DEFAULT_CATALOG, s = schema || DEFAULT_SCHEMA;
    const gen = await synthetic(description);
    const n = await createTableFromCsv(c, s, table, gen.csv);
    return text(`Created ${c}.${s}.${table} with ${n} synthetic rows (${gen.columns.join(', ')}).`);
  });

  return server;
}

// ── HTTP transport (stateless: fresh server+transport per request) ──
const app = express();
app.use(express.json({ limit: '4mb' }));

app.get('/', (_req, res) => res.json({ status: 'ok', server: 'data-wizard-mcp', endpoint: '/mcp' }));

app.post('/mcp', async (req, res) => {
  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on('close', () => { transport.close(); server.close(); });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: err.message }, id: null });
  }
});

const PORT = Number(process.env.MCP_PORT || 3100);
app.listen(PORT, () => console.log(`⚙️  Data Wizard MCP server on http://localhost:${PORT}/mcp`));

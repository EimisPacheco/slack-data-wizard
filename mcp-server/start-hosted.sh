#!/usr/bin/env bash
# Starts the Data Wizard MCP server + a public HTTPS tunnel, and prints the URL to
# paste into Slack (App Settings → MCP Servers). Keep this terminal open while demoing.
set -e
cd "$(dirname "$0")"

pkill -f "node server.js" 2>/dev/null || true
pkill -f "cloudflared tunnel" 2>/dev/null || true
sleep 1

echo "starting MCP server on :3100 …"
nohup node server.js > /tmp/mcp_srv.log 2>&1 &
sleep 2

echo "opening public HTTPS tunnel …"
nohup cloudflared tunnel --url http://localhost:3100 > /tmp/cf.log 2>&1 &

URL=""
for i in $(seq 1 20); do
  URL=$(grep -oE "https://[a-z0-9-]+\.trycloudflare\.com" /tmp/cf.log | head -1)
  [ -n "$URL" ] && break
  sleep 2
done

if [ -z "$URL" ]; then echo "❌ tunnel URL not found — see /tmp/cf.log"; exit 1; fi

echo
echo "══════════════════════════════════════════════════════════════"
echo "  MCP endpoint for Slack:  $URL/mcp"
echo "  auth: No auth"
echo "══════════════════════════════════════════════════════════════"
echo "  (this URL changes each restart — re-paste it in Slack if so)"
echo "  logs: /tmp/mcp_srv.log  and  /tmp/cf.log"
echo "  stop: pkill -f 'node server.js'; pkill -f 'cloudflared tunnel'"

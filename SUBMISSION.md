# Submission Data Wizard (AMD Unicorn Track)

## Short Description (255 max)

A data team for companies that don't have one. Upload a file, build a governed lakehouse, ask questions in plain English and publish a Tableau dashboard — by typing a sentence in Slack. Every act of reasoning runs on Gemma, open-source, on an AMD GPU.

## Long Description (600 min / 2000 max)

Every company has data. Most don't have a data team. That gap is the market.

In a small business, the people who own the data can't query it. The office manager holds the signup sheet. The clinic administrator holds scanned invoices. Neither writes SQL; neither has an engineer to ask. So the question never gets asked.

Slack Data Wizard is that data team. Drop a CSV and it becomes a typed table, named in your words. Ask "how many signups per country?" and Gemma writes the SQL. Say "create a schema called sales" and Gemma writes the DDL. Say "build a medallion pipeline" and get bronze, silver and gold tables. Say "create a dashboard" and Gemma picks the chart and publishes a real Tableau workbook. Ask for "the top 10 countries by population" and Perplexity pulls the real figures from the internet, with citations — or OpenAI generates synthetic rows for testing. You can even ask by voice through an ElevenLabs agent, or reach the same tools from Claude and ChatGPT via MCP.

Then drop in a scanned PDF — the case that matters most. Hospitals and billing offices still run on paper. Today a human retypes it. Gemma's vision reads the table straight off the page.

And that changes who touches the data: the person who produces it loads the lakehouse directly — no analyst, no engineer, no untracked copies in between. For sensitive records, the fewer people in the chain, the smaller the leak surface.

So the AMD GPU is not an implementation detail. A scanned patient record is exactly the data you may not paste into a closed third-party API — HIPAA, GDPR. An open Gemma on your own AMD Instinct GPU (ROCm) means the page never leaves the building. Take it away and in regulated industries you get no product.

A model that writes CREATE TABLE can also write DROP TABLE — so every statement is classified before it runs, and destructive ones wait for a click.

This deserves to win because it solves a real problem: it makes data handling faster, simpler and accessible to everyone.

---

# Video narration script (~3 minutes)

Every company has data. Most companies don't have a data team.

Think about who actually holds the numbers. The office manager with the signup sheet. The clinic administrator with a folder of scanned invoices. They own the data. They cannot query it. And there's no engineer down the hall to ask.

So the question doesn't get asked. The decision gets made on instinct.

This is Data Wizard. A data team for the companies that don't have one — living inside Slack, where those people already work.

And Slack is not just a distribution trick — I chose it from experience. I'm a data engineer, and honestly, even for me it's bothersome to connect to one more platform, wait for a console, click past gadgets I never asked for. Most days I just want to ask the question — and send the answer to the person who needs it. Slack gives me exactly that: one simple surface, nothing extra, and when the answer comes back I forward it straight to the coworker, the internal user, the customer. If it's the path of least resistance for an engineer, imagine what it is for the office manager.

They drag in a CSV. It becomes a typed table, named in their own words, not the file's.

Now watch. They drop in a scanned PDF.

Walk into a hospital, a clinic, a medical billing office — and you will find paper. Scanned intake forms. Faxed lab results. Invoices that are pictures of paper, not data. This is not a legacy edge case. This is Tuesday. And today, a human retypes those numbers, one row at a time.

Gemma's vision reads the table straight off the image — and the page becomes a real, queryable table.

That saves hours. But look at what else it just did.

Every one of those manual steps was a person handling records they didn't need to see. A spreadsheet on a laptop. A printout on a desk. A file emailed to a colleague — each one a copy nobody is tracking. With Data Wizard, the person who produces the data loads the lakehouse directly — no analyst in the middle, no engineer in the middle, no hand-offs at all. The fewer people who ever touch the data, the smaller the surface for a leak — and for the most sensitive records, the top-secret ones, the shortest chain is the safest one. So removing the retyping doesn't just remove the typos. It removes the exposure.

And the model that read that page runs on your own AMD GPU. Which is exactly why the GPU here is not an implementation detail.

A scanned patient record is precisely the data you are not allowed to paste into a closed, third-party API. Protected health information is bound by HIPAA. By GDPR. Sending that page to someone else's model endpoint isn't a trade-off to weigh — it is simply not permitted.

An open model, on your own AMD Instinct GPU, means the page never leaves the building. Take the AMD GPU away, and you don't get a slower product — in regulated industries, you get no product at all.

That same GPU does everything else. Gemma isn't a garnish here — Gemma is the reasoning. On AMD Developer Cloud, on ROCm, it writes the SQL when someone asks "how many signups per country". It writes the DDL when they say "create a schema called sales". It builds them a bronze, silver and gold lakehouse without ever using the word. It picks the chart when they ask for a dashboard — and publishes a real Tableau workbook back into the channel. Ask for the top ten countries by population and you get real, cited figures; ask out loud and an ElevenLabs voice agent answers and posts the transcript to Slack.

One last thing, and it matters most for the people we built this for. A model that can write CREATE TABLE can also write DROP TABLE. So every statement Gemma produces is classified before it runs — and anything destructive waits for a human to click.

So why does this deserve to win? Because it solves a real problem — it makes data handling faster, simpler and accessible to everyone. And because of who that unlocks: there are millions of small businesses, clinics and family firms that will never hire a data engineer — and every one of them makes decisions every single day. Data Wizard gives them the whole stack — ingestion, a governed lakehouse, safe SQL, published dashboards — for the cost of typing one sentence in a tool they already have open. That's the impact: this is not a nicer workflow for people who already have answers. It is the first answer for the people who had none.

Every company has data. Most don't have a data team. And the ones who need this most are the ones who can least afford to hand their data to anybody else.

That gap is the market. And it is one sentence in Slack away from closing.

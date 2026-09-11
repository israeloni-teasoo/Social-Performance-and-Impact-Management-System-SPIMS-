/**
 * End-to-end check of the mention alert pipeline, against a real database.
 *
 *   npm run smoke:alerts
 *
 * This exists because the pipeline's interesting half cannot be unit tested and cannot
 * be tried against the real world from a development machine: collection reaches out to
 * GDELT and to Nigerian news sites, which are unreachable from a sandboxed network, and
 * delivery posts to a Teams or Slack webhook nobody wants firing during development.
 *
 * So both ends are stood up locally. A feed source is pointed at an RSS document served
 * from this process, and an alert channel at a webhook receiver in the same process. The
 * code under test is entirely unmodified — it fetches a URL and posts to a URL, and does
 * not care that both happen to be local. What gets exercised is the whole path: fetch,
 * parse, de-duplicate, store, match against the watchlist, deliver, and record the
 * outcome on the channel.
 *
 * It cleans up what it creates. It will refuse to run against a database that is not
 * local, because it writes.
 */

import assert from 'node:assert/strict';
import http from 'node:http';
import { prisma } from '../server/lib/db';
import { createAlertChannelHandler, createAlertRuleHandler, listAlertConfigHandler } from '../server/handlers/alerts';
import { createMentionSourceHandler, listMentionsHandler, runMentionIngestionHandler } from '../server/handlers/mentions';

const RULE_NAME = 'Smoke test — environmental incident';
const SOURCE_NAME = 'Smoke test — local feed';
const CHANNEL_NAME = 'Smoke test — local webhook';

const url = process.env.DATABASE_URL ?? '';
if (!/localhost|127\.0\.0\.1/.test(url)) {
  console.error('Refusing to run: DATABASE_URL is not local, and this check writes.\n');
  process.exit(1);
}

/** Two stories, one of which should trip the watchlist and one of which should not. */
const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>Smoke Test Wire</title>
  <item>
    <title>Oil spill reported near a delivery site</title>
    <link>https://smoke.example/spill-reported</link>
    <description>Residents said spills were visible on Tuesday morning.</description>
    <pubDate>Tue, 08 Sep 2026 09:15:00 +0100</pubDate>
  </item>
  <item>
    <title>Scholarship programme certifies 40 teachers</title>
    <link>https://smoke.example/teachers-certified</link>
    <description>Teachers completed literacy training this year.</description>
    <pubDate>Mon, 07 Sep 2026 14:40:00 +0100</pubDate>
  </item>
</channel></rss>`;

const received: unknown[] = [];

const server = http.createServer((req, res) => {
  if (req.url === '/feed.xml') {
    res.writeHead(200, { 'content-type': 'application/rss+xml' });
    res.end(FEED);
    return;
  }
  if (req.url === '/hook' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      received.push(JSON.parse(body || '{}'));
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end('{"ok":true}');
    });
    return;
  }
  if (req.url === '/refuses' && req.method === 'POST') {
    // Stands in for a webhook that has been revoked — the quiet failure the channel's
    // recorded status exists to surface.
    res.writeHead(403, { 'content-type': 'text/plain' });
    res.end('channel not found');
    return;
  }
  res.writeHead(404);
  res.end();
});

let failures = 0;
async function check(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`  ok    ${name}`);
  } catch (error) {
    failures += 1;
    console.log(`  FAIL  ${name}`);
    console.log(`        ${(error as Error).message.split('\n')[0]}`);
  }
}

async function cleanup() {
  await prisma.mention.deleteMany({ where: { url: { contains: 'smoke.example' } } });
  await prisma.mentionSource.deleteMany({ where: { name: { startsWith: 'Smoke test' } } });
  await prisma.alertRule.deleteMany({ where: { name: { startsWith: 'Smoke test' } } });
  await prisma.alertChannel.deleteMany({ where: { name: { startsWith: 'Smoke test' } } });
}

async function main() {
  const port = await new Promise<number>((resolve) => {
    server.listen(0, () => resolve((server.address() as { port: number }).port));
  });
  const base = `http://127.0.0.1:${port}`;

  await cleanup();

  console.log('\nSetup');

  await check('adds a watchlist rule', async () => {
    const r = await createAlertRuleHandler({ name: RULE_NAME, terms: 'spill, leak' });
    assert.equal(r.status, 201);
  });

  await check('adds a delivery channel, and never returns its URL', async () => {
    const r = await createAlertChannelHandler({
      name: 'Smoke test — masking',
      kind: 'slack',
      url: 'https://hooks.slack.example/services/T000/B000/xxxxSECRETxxxx',
    });
    assert.equal(r.status, 201);
    const serialised = JSON.stringify(r.body);
    assert.ok(!serialised.includes('SECRET'), 'the secret path must not reach the browser');
    assert.ok(serialised.includes('hooks.slack.example'), 'but the host must, or channels cannot be told apart');
    // Removed immediately: an active channel pointing at a host that does not exist
    // would join every delivery below and fail it.
    await prisma.alertChannel.deleteMany({ where: { name: 'Smoke test — masking' } });
  });

  await check('refuses a plain-http webhook', async () => {
    const r = await createAlertChannelHandler({ name: 'Smoke test — insecure', kind: 'slack', url: 'http://example.org/x' });
    assert.equal(r.status, 400);
  });

  // The delivery channel is written directly rather than through the handler, because
  // the handler requires https and a local receiver cannot offer it. That rule is not
  // being worked around — it is asserted immediately above. Everything past this point
  // exercises delivery, which does not care about the scheme.
  await prisma.alertChannel.create({ data: { name: CHANNEL_NAME, kind: 'webhook', url: `${base}/hook` } });

  await check('adds the feed as a source', async () => {
    const r = await createMentionSourceHandler({ name: SOURCE_NAME, kind: 'rss', target: `${base}/feed.xml` });
    assert.equal(r.status, 201);
  });

  console.log('\nCollection');

  let firstRun: Record<string, unknown> = {};

  await check('collects both stories from the feed', async () => {
    const r = await runMentionIngestionHandler();
    firstRun = r.body as Record<string, unknown>;
    assert.equal(r.status, 200);
    assert.ok((firstRun.added as number) >= 2, `added ${firstRun.added}`);
  });

  await check('flags only the story that matched the watchlist', () => {
    const alerts = firstRun.alerts as { flagged: number; delivered: number; failed: unknown[] };
    assert.equal(alerts.flagged, 1, 'the scholarship story must not be flagged');
    assert.equal(alerts.delivered, 1);
    assert.deepEqual(alerts.failed, []);
  });

  await check('delivered one alert naming the rule that matched', () => {
    assert.equal(received.length, 1, `webhook received ${received.length} posts`);
    const payload = received[0] as { source: string; flagged: { title: string; rules: string[] }[] };
    assert.equal(payload.source, 'SPIMS');
    assert.equal(payload.flagged.length, 1);
    assert.match(payload.flagged[0]!.title, /spill/i);
    assert.deepEqual(payload.flagged[0]!.rules, [RULE_NAME]);
  });

  await check('the flag is on the mention in the queue, not only in the alert', async () => {
    const r = await listMentionsHandler({});
    const mentions = (r.body as { mentions: { url: string; flags: string[] }[] }).mentions;
    const spill = mentions.find((m) => m.url.includes('spill-reported'));
    const teachers = mentions.find((m) => m.url.includes('teachers-certified'));
    assert.deepEqual(spill?.flags, [RULE_NAME]);
    assert.deepEqual(teachers?.flags, []);
  });

  console.log('\nA second run over the same feed');

  await check('stores nothing new and alerts nobody twice', async () => {
    const r = await runMentionIngestionHandler();
    const body = r.body as { added: number; duplicates: number; alerts: { flagged: number } };
    assert.equal(body.added, 0, 'the same two stories must not be stored again');
    assert.ok(body.duplicates >= 2);
    assert.equal(body.alerts.flagged, 0, 'a duplicate is a story somebody was already told about');
    assert.equal(received.length, 1, 'no second webhook post');
  });

  console.log('\nA channel that has stopped working');

  await check('records the refusal against the channel instead of failing the run', async () => {
    await prisma.alertChannel.updateMany({
      where: { name: CHANNEL_NAME },
      data: { url: `${base}/refuses` },
    });
    // A new story, so there is something to alert on.
    await prisma.mention.deleteMany({ where: { url: { contains: 'spill-reported' } } });

    const r = await runMentionIngestionHandler();
    const body = r.body as { alerts: { flagged: number; delivered: number; failed: { channel: string; error: string }[] } };

    assert.equal(r.status, 200, 'collection still succeeded');
    assert.equal(body.alerts.flagged, 1);
    assert.equal(body.alerts.delivered, 0);
    assert.equal(body.alerts.failed.length, 1);
    assert.match(body.alerts.failed[0]!.error, /403/);

    const config = await listAlertConfigHandler();
    const channel = (config.body as { channels: { name: string; lastStatus: string | null; lastError: string | null }[] })
      .channels.find((c) => c.name === CHANNEL_NAME);
    assert.equal(channel?.lastStatus, 'failed', 'a silently broken webhook must be visible on the screen');
    assert.match(channel?.lastError ?? '', /403/);
  });

  await cleanup();
  server.close();
  await prisma.$disconnect();

  console.log(failures === 0 ? '\nThe alert pipeline works end to end.\n' : `\n${failures} check(s) failed.\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error(error);
  await cleanup().catch(() => {});
  server.close();
  process.exit(1);
});

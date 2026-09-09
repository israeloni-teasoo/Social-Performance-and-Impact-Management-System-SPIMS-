/**
 * Recorded payload shapes for the free sources.
 *
 * An honest note about these, because it affects how much they prove. The environment
 * this module was written in blocks outbound HTTP to GDELT and to Nigerian news
 * outlets, so these fixtures were written from each format's documented structure
 * rather than captured from a live response. They are enough to prove the parsers
 * handle the shapes, the awkward dates, the redirect wrapper and the missing fields —
 * which is most of the risk — but they are not proof that GDELT's field names are
 * exactly these today.
 *
 * The first live run therefore needs an operator to look at the queue rather than
 * assume it. `POST /api/mentions/run` returns a per-source count and error for exactly
 * that reason, and a source returning zero items is reported as zero rather than as
 * success.
 */

/** GDELT DOC 2.0, mode=artlist, format=json. */
export const GDELT_SAMPLE = JSON.stringify({
  articles: [
    {
      url: 'https://punchng.com/seplat-energy-commissions-classroom-block-in-edo/',
      url_mobile: '',
      title: 'Seplat Energy commissions classroom block in Edo',
      seendate: '20260904T081500Z',
      socialimage: 'https://punchng.com/img/1.jpg',
      domain: 'punchng.com',
      language: 'English',
      sourcecountry: 'Nigeria',
    },
    {
      url: 'https://www.vanguardngr.com/2026/09/seplat-eye-can-see-outreach-screens-13000/',
      title: 'Seplat’s Eye Can See outreach screens 13,000 in Delta',
      seendate: '20260902T140000Z',
      domain: 'vanguardngr.com',
      language: 'English',
      sourcecountry: 'Nigeria',
    },
    // No title: dropped rather than stored as a blank row.
    { url: 'https://example.com/no-title', seendate: '20260901T120000Z', domain: 'example.com' },
    // No url: same.
    { title: 'Headline with no link', seendate: '20260901T120000Z' },
  ],
});

/** A Nigerian outlet's RSS 2.0 feed, with CDATA and an HTML description. */
export const RSS_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Punch Newspapers</title>
    <item>
      <title><![CDATA[Seplat Energy commissions classroom block in Edo]]></title>
      <link>https://punchng.com/seplat-energy-commissions-classroom-block-in-edo/?utm_source=rss&amp;utm_medium=feed</link>
      <pubDate>Fri, 04 Sep 2026 08:15:00 +0100</pubDate>
      <description><![CDATA[<p>The company said the <b>block</b> will serve 400 pupils.</p>]]></description>
    </item>
    <item>
      <title>STEP programme certifies 623 teachers</title>
      <link>https://punchng.com/step-programme-certifies-623-teachers/</link>
      <pubDate>Wed, 02 Sep 2026 11:00:00 +0100</pubDate>
      <description>Teachers across Edo &amp; Delta completed the programme.</description>
    </item>
    <item>
      <title>Undated item</title>
      <link>https://punchng.com/undated/</link>
      <description>No pubDate at all.</description>
    </item>
  </channel>
</rss>`;

/** A Google Alerts Atom feed, whose links are wrapped in a Google redirect. */
export const GOOGLE_ALERTS_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Google Alert - Seplat Energy</title>
  <entry>
    <title type="html">&lt;b&gt;Seplat&lt;/b&gt; Energy commissions classroom block in Edo</title>
    <link href="https://www.google.com/url?rct=j&amp;sa=t&amp;url=https://punchng.com/seplat-energy-commissions-classroom-block-in-edo/&amp;ct=ga&amp;usg=AOv" />
    <published>2026-09-04T08:20:00Z</published>
    <content type="html">The company said the &lt;b&gt;block&lt;/b&gt; will serve 400 pupils.</content>
  </entry>
  <entry>
    <title>Host community trust disburses to Ovhor</title>
    <link href="https://www.google.com/url?rct=j&amp;url=https://businessday.ng/host-community-trust-ovhor/&amp;usg=AOv" />
    <published>2026-09-03T06:00:00Z</published>
  </entry>
</feed>`;

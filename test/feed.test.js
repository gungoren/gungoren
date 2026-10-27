const test = require("node:test");
const assert = require("node:assert");
const { parseFeed, formatDate } = require("../src/feed");

const sampleFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:content="http://purl.org/rss/1.0/modules/content/" version="2.0">
  <channel>
    <title>Stories by Mehmet Gungoren</title>
    <item>
      <title><![CDATA[Deadlock Nasıl Oluşur?]]></title>
      <link>https://mehgungoren.medium.com/deadlock-59096ce50522?source=rss</link>
      <guid isPermaLink="false">https://medium.com/p/59096ce50522</guid>
      <pubDate>Mon, 20 Jul 2026 17:01:03 GMT</pubDate>
      <content:encoded><![CDATA[<p>See https://github.com/gungoren/demo</p>]]></content:encoded>
    </item>
  </channel>
</rss>`;

test("parseFeed maps a Medium RSS item to a feed entry", () => {
  const [item] = parseFeed(sampleFeed);

  assert.deepStrictEqual(item, {
    guid: "https://medium.com/p/59096ce50522",
    title: "Deadlock Nasıl Oluşur?",
    link: "https://mehgungoren.medium.com/deadlock-59096ce50522?source=rss",
    pubDate: "2026-07-20 17:01:03",
    content: "<p>See https://github.com/gungoren/demo</p>",
  });
});

test("parseFeed throws when the document is not an RSS feed", () => {
  assert.throws(() => parseFeed("<html><title>Just a moment...</title></html>"), /no <item> entries/);
});

test("formatDate returns an empty string for invalid dates", () => {
  assert.strictEqual(formatDate("not a date"), "");
});

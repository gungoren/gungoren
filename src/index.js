const fs = require("fs");
const path = require("path");
const axios = require("axios");

const APP = {
  FEED: "https://api.rss2json.com/v1/api.json?rss_url=https://mehgungoren.medium.com/feed/",
  README_PATH: "README.md",
  DATA_PATH: "data/posts.json",
};

const isTurkish = (title) =>
  /[ğüşıöçĞÜŞİÖÇ]/.test(title) ||
  /\b(nedir|neden|nasıl|nasil|için|icin|niye|ile|bir|bu|ne)\b/i.test(title);

const findSource = (content = "") => {
  const match = content.match(/https?:\/\/github\.com\/gungoren[^" )]*/);
  return match ? match[0] : "";
};

// Map a raw RSS item to the compact, stable record we persist.
const toRecord = (item) => ({
  guid: item.guid || item.link,
  title: item.title,
  link: item.link,
  pubDate: item.pubDate,
  lang: isTurkish(item.title) ? "tr" : "en",
  source: findSource(item.content),
});

const toDate = (pubDate) => (pubDate || "").slice(0, 10);
const toYear = (pubDate) => (pubDate || "").slice(0, 4) || "Unknown";
const tag = (lang) => (lang === "tr" ? "`TR`" : "`EN`");

const toLine = (post) =>
  `- ${toDate(post.pubDate)} · ${tag(post.lang)} [${post.title}](${post.link})${
    post.source ? ` ([source](${post.source}))` : ""
  }`;

// Render one chronological list, newest first, grouped under a year heading.
const buildList = (posts) => {
  const groups = new Map();
  posts.forEach((p) => {
    const year = toYear(p.pubDate);
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year).push(p);
  });

  return [...groups.keys()]
    .sort((a, b) => b.localeCompare(a))
    .map((year) => `### ${year}\n\n${groups.get(year).map(toLine).join("\n")}`)
    .join("\n\n");
};

const loadStored = (dataPath) => {
  try {
    return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
};

// Keep every post we have ever seen; only append genuinely new ones.
const mergePosts = (stored, incoming) => {
  const seen = new Set(stored.map((p) => p.guid));
  const additions = incoming.filter((p) => !seen.has(p.guid));
  return [...stored, ...additions].sort(
    (a, b) => new Date(b.pubDate) - new Date(a.pubDate)
  );
};

const run = async () => {
  const { data } = await axios.get(APP.FEED);
  const incoming = (data.items || []).map(toRecord);

  const stored = loadStored(APP.DATA_PATH);
  const posts = mergePosts(stored, incoming);

  fs.mkdirSync(path.dirname(APP.DATA_PATH), { recursive: true });
  fs.writeFileSync(
    APP.DATA_PATH,
    `${JSON.stringify(posts, null, 2)}\n`,
    "utf-8"
  );

  const readme = fs.readFileSync(APP.README_PATH, "utf-8");
  const updated = readme.replace(
    /<!-- DATA:START -->([\s\S]*?)<!-- DATA:END -->/m,
    `<!-- DATA:START -->\n${buildList(posts)}\n<!-- DATA:END -->`
  );
  fs.writeFileSync(APP.README_PATH, updated, "utf-8");

  console.log(
    `README updated with ${posts.length} posts (${incoming.length} in feed, ${posts.length - stored.length} new).`
  );
};

run().catch((err) => {
  console.error("Failed to update README:", err.message);
  process.exit(1);
});

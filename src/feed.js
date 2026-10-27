const axios = require("axios");
const { XMLParser } = require("fast-xml-parser");

const FEED_URL = "https://medium.com/feed/@mehgungoren";
const USER_AGENT = "gungoren-readme-bot (+https://github.com/gungoren/gungoren)";

const parser = new XMLParser({ ignoreAttributes: true, isArray: (name) => name === "item" });

const pad = (n) => String(n).padStart(2, "0");

// Normalise RFC 822 dates to "YYYY-MM-DD HH:mm:ss" (UTC), the format already in data/posts.json.
const formatDate = (rfcDate) => {
  const d = new Date(rfcDate);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(
    d.getUTCHours()
  )}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
};

const text = (value) => (typeof value === "object" && value !== null ? value["#text"] : value) || "";

const parseFeed = (xml) => {
  const items = parser.parse(xml)?.rss?.channel?.item;
  if (!Array.isArray(items)) throw new Error("Unexpected feed format: no <item> entries found");

  return items.map((item) => ({
    guid: text(item.guid),
    title: text(item.title),
    link: text(item.link),
    pubDate: formatDate(text(item.pubDate)),
    content: text(item["content:encoded"]),
  }));
};

const fetchFeed = async (url = FEED_URL) => {
  const { data } = await axios.get(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/rss+xml, application/xml" },
    responseType: "text",
  });
  return parseFeed(data);
};

module.exports = { fetchFeed, parseFeed, formatDate };

const fs = require("fs");
const axios = require("axios");

const APP = {
  FEED: "https://api.rss2json.com/v1/api.json?rss_url=https://mehgungoren.medium.com/feed/",
  README_PATH: "README.md",
};

const isTurkish = (title) =>
  /[ğüşıöçĞÜŞİÖÇ]/.test(title) ||
  /\b(nedir|neden|nasıl|nasil|için|icin|niye|ile|bir|bu|ne)\b/i.test(title);

const toLink = (item) => {
  const github_links = [...new Set(item.content.match(/(https?:\/\/github\.com\/gungoren[^" ]*)/))] ;
  const source = github_links.length ? ` ([source](${github_links[0]}))` : "";
  return `[${item.title}](${item.link})${source}`;
};

const buildTable = (en, tr) => {
  const rows = Math.max(en.length, tr.length);
  const header = "| EN | TR |\n|---|---|";
  const body = Array.from({ length: rows }, (_, i) => {
    const enCell = en[i] ? toLink(en[i]) : "";
    const trCell = tr[i] ? toLink(tr[i]) : "";
    return `| ${enCell} | ${trCell} |`;
  }).join("\n");
  return `${header}\n${body}`;
};

axios.get(APP.FEED).then((resp) => {
  const { items } = resp.data;

  const items2026 = items.filter((item) => item.pubDate.slice(0, 4) >= "2026");
  const older = items.filter((item) => item.pubDate.slice(0, 4) < "2026");

  const en = items2026.filter((item) => !isTurkish(item.title));
  const tr = items2026.filter((item) => isTurkish(item.title));

  const tableSection = items2026.length ? `\n${buildTable(en, tr)}\n` : "";
  const olderSection = older.length
    ? older.map((item) => `\n* ${toLink(item)}`).join("")
    : "";

  const template = tableSection + olderSection;

  fs.readFile(APP.README_PATH, "utf-8", (err, data) => {
    if (err) throw err;
    fs.writeFile(
      APP.README_PATH,
      data.replace(
        /<!-- DATA:START -->([\s\S]*?)<!-- DATA:END -->/m,
        `<!-- DATA:START -->${template}\n<!-- DATA:END -->`
      ),
      "utf-8",
      (err) => {
        if (err) throw err;
        console.log("README updated.");
      }
    );
  });
});

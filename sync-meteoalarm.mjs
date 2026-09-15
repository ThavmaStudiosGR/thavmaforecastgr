// Τρέχει μέσα στο GitHub Action (server-side, όχι browser) — γι' αυτό
// δεν υπάρχει πρόβλημα CORS εδώ. Το MeteoAlarm feed είναι επίσημο,
// δημόσιο feed του EUMETNET, ελεύθερο για αναδημοσίευση με αναφορά πηγής.
import { writeFile, mkdir } from 'node:fs/promises';

const FEED_URL = 'https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-greece';

function extractEntries(xml) {
  const entries = [];
  const blocks = xml.split('<entry>').slice(1);
  for (const block of blocks) {
    const title = (block.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [,''])[1]
      .replace(/<!\[CDATA\[|\]\]>/g, '').trim();
    const updated = (block.match(/<updated>([\s\S]*?)<\/updated>/) || [,''])[1].trim();
    if (title) entries.push({ title, updated });
  }
  return entries;
}

async function main() {
  const res = await fetch(FEED_URL, { headers: { 'User-Agent': 'weather-dashboard-sync/1.0' } });
  if (!res.ok) throw new Error(`MeteoAlarm feed HTTP ${res.status}`);
  const xml = await res.text();
  const entries = extractEntries(xml).slice(0, 10);
  await mkdir('data', { recursive: true });
  await writeFile('data/meteoalarm.json', JSON.stringify(entries, null, 2));
  console.log(`Wrote ${entries.length} MeteoAlarm entries.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

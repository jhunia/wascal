// Lists internal links in the built site (dist/) that point to pages that don't exist.
// Run after `npm run build`:  node scripts/check-links.mjs
import fs from 'node:fs';
import path from 'node:path';

const files = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.html')) files.push(p);
  }
})('dist');

const missing = new Map();
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
    let url;
    try { url = decodeURI(m[1]); } catch { url = m[1]; }
    if (/^\/(_astro|pagefind|images)\//.test(url) || /\.\w{2,4}$/.test(url)) continue;
    if (!url.endsWith('/')) url += '/';
    if (fs.existsSync(path.join('dist', url, 'index.html'))) continue;
    const from = '/' + path.relative('dist', path.dirname(file)).split(path.sep).join('/') + '/';
    if (!missing.has(url)) missing.set(url, new Set());
    missing.get(url).add(from.replace('//', '/'));
  }
}
console.log(`${files.length} pages checked, ${missing.size} missing link targets`);
[...missing].sort((a, b) => b[1].size - a[1].size).forEach(([url, from]) => console.log(`${from.size}x ${url}  <- ${[...from][0]}`));

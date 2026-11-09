// Pulls content from the current wascal.org WordPress site into src/data/*.json
// so the new site can be built and previewed (e.g. on Vercel) without touching WordPress.
//
//   npm run sync            -> uses cached HTML where available
//   npm run sync -- --fresh -> re-downloads everything
//
// Posts come from the WordPress REST API. Pages are built with WPBakery shortcodes that the
// REST API does not render, so pages are taken from their live rendered HTML instead.

import fs from 'node:fs/promises';
import path from 'node:path';
import * as cheerio from 'cheerio';

const ORIGIN = 'https://wascal.org';
const API = `${ORIGIN}/wp-json/wp/v2`;
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const DATA = path.join(ROOT, 'src', 'data');
const CACHE = path.join(ROOT, 'scripts', '.cache');
const FRESH = process.argv.includes('--fresh');
const UA = 'WASCAL-redesign-sync/1.0';

// Pages that are test copies or old duplicates and should not be rebuilt.
const SKIP_PAGES = new Set([
  'testpage', 'home2', 'home3', 'competence-centre-projects-test', 'newsletters-2',
  'management-2', 'capacity-building-projects-2', 'home', 'sample-page-2', 'board', 'sac', 'home-2',
]);
// Old duplicates that should send visitors to their current equivalent.
const SKIP_TARGETS = { board: '/new-board-members/', sac: '/new-sac-members/', 'management-2': '/executive-management-team/' };
// Pages whose post lists were loaded by a WPBakery grid in the browser: rebuild them as category listings.
const LIST_MAP = {
  blog: ['blog'], investment: ['investment'], 'media-links': ['wascal-in-the-news'], newsletters: ['newsletters'],
  'policy-brief': ['policy-brief'], vacancies: ['vacancies', 'procurement-notice', 'tender', 'advertisement'],
  'other-projects': ['other-projects'], 'our-events': ['events'], reports: ['report', 'financial-report'],
  'academic-publications': ['publications', 'journal-article', 'journal-articles', 'book-chapters', 'peer-reviewed-articles'],
  'competence-centre-projects': ['competence-projects'], 'renewable-energy-coordination-projects': ['renewable-energy-coordination-project'],
  'capacity-building-projects': ['capacity-building-projects'],
};
// Listing pages that hold team cards: which group the people belong to.
const PEOPLE_GROUPS = { 'new-board-members': 'board', 'executive-management-team': 'management', 'new-sac-members': 'sac' };
// Pages the new site builds itself (custom templates), so their scraped HTML is not used as-is.
const CUSTOM_PAGES = new Set(['news', 'wascaal-news', 'blog', 'contact']);
// Old addresses that move in the new site.
const PAGE_RENAMES = {
  'doctoral-pogramme-west-african-climate-systems': 'doctoral-programme-west-african-climate-systems',
  'faqs-2': 'faqs',
  'wascaal-news': 'news',
  'capacity-building-projects-2': 'capacity-building-projects',
};

// ---------- helpers ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, { json = true, tries = 4 } = {}) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return { body: json ? await res.json() : await res.text(), headers: res.headers };
    } catch (err) {
      if (i === tries - 1) throw err;
      await sleep(1500 * (i + 1));
    }
  }
}

async function cached(key, fn) {
  const file = path.join(CACHE, key.replace(/[^a-z0-9._-]+/gi, '_').slice(0, 180));
  if (!FRESH) {
    try { return await fs.readFile(file, 'utf8'); } catch {}
  }
  const text = await fn();
  await fs.mkdir(CACHE, { recursive: true });
  await fs.writeFile(file, text);
  return text;
}

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }));
  return out;
}

const decode = (s = '') => cheerio.load(`<p>${s}</p>`)('p').text();

// Unicode "mathematical bold" letters pasted from social media -> plain letters.
const plain = (s = '') => s.normalize('NFKC').replace(/[‐-―−]/g, '-').replace(/\s+/g, ' ').trim();

const KEEP_UPPER = new Set(['WASCAL', 'GIZ', 'ECOWAS', 'BMBF', 'BMFTR', 'UN', 'UNFCCC', 'AU', 'EU', 'CSIR', 'WADI', 'WRAP',
  'HPC', 'GIS', 'PHD', 'MSC', 'USA', 'UK', 'AFDB', 'IPCC', 'CILSS', 'AGRHYMET', 'CORAF', 'IWMI', 'UNU-EHS', 'KNUST', 'DLR',
  'FAO', 'WMO', 'UNEP', 'UNDP', 'NGO', 'NDC', 'NDCS', 'II', 'III', 'IV', 'DAS-CLIM', 'CS4RRA', 'H2', 'PV', 'SAC', 'CEO',
  'MOU', 'R&D', 'ICT', 'AI', 'COP', 'GRP', 'WACS', 'CC', 'DRM', 'IT', 'UAM', 'UCAD', 'UDS', 'FUTA', 'FUTMINNA', 'UL', 'WASCAL’S', "WASCAL'S"]);
const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with', 'from', 'into', 'over', 'its', 'via', 'vs', 'de', 'du', 'des', 'la', 'le', 'les', 'et', 'en']);

// Many old headlines are in ALL CAPS. Turn those into title case, keeping acronyms.
function tidyTitle(raw) {
  const t = plain(decode(raw));
  const letters = t.replace(/[^A-Za-z]/g, '');
  const caps = letters.replace(/[^A-Z]/g, '').length;
  if (letters.length < 8 || caps / letters.length < 0.7) return t.replace(/\.$/, '');
  return t.replace(/\.$/, '').split(' ').map((w, i) => {
    const bare = w.replace(/[^\w&’'-]/g, '').toUpperCase();
    if (KEEP_UPPER.has(bare) || /\d/.test(w) && /[A-Z]/.test(w) && w.length <= 6) return w;
    const lower = w.toLowerCase();
    if (i > 0 && SMALL.has(lower.replace(/[^a-z]/g, ''))) return lower;
    return lower.replace(/(^|[-(“"‘'/])([a-zà-ÿ])/g, (m, a, b) => a + b.toUpperCase());
  }).join(' ');
}

function slugify(s) {
  return plain(decodeURIComponent(s)).normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);
}

const SHORTCODE = /\[\/?(?:vc_|apress_|zolo_|rev_slider|contact-form|mc4wp|pt_view|ultimate|zt_|ult_|bsf|dt_|cq_|templatera|caption|embed|gallery)[^\]]*\]/gi;

// ---------- HTML cleaning ----------
const ALLOWED = new Set(['p', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'strong', 'b', 'em', 'i', 'u', 'br', 'hr',
  'blockquote', 'figure', 'figcaption', 'img', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'iframe', 'sup', 'sub',
  'cite', 'code', 'pre', 'small', 'mark', 'dl', 'dt', 'dd', 'video', 'source', 'audio']);
const DROP = new Set(['script', 'style', 'noscript', 'form', 'input', 'button', 'select', 'textarea', 'svg', 'link', 'meta', 'nav', 'object', 'embed']);
const ATTRS = { a: ['href', 'title'], img: ['src', 'alt', 'width', 'height'], iframe: ['src', 'title', 'width', 'height', 'allowfullscreen'],
  td: ['colspan', 'rowspan'], th: ['colspan', 'rowspan', 'scope'], video: ['src', 'controls', 'poster'], source: ['src', 'type'], audio: ['src', 'controls'], ol: ['start'] };

let linkMap = new Map(); // old path -> new path

function localise(href) {
  if (!href) return href;
  let h = href.trim();
  if (h.startsWith('//')) h = 'https:' + h;
  h = h.replace(/^https?:\/\/(www\.)?wascal\.org/i, '');
  if (!h.startsWith('/') || h.startsWith('/wp-content/') || h.startsWith('/fr/') || h.startsWith('/greenhydrogen')) {
    return h.startsWith('/') ? ORIGIN + h : href;
  }
  const [p, rest = ''] = h.split(/(?=[?#])/);
  const key = (p.endsWith('/') ? p : p + '/').toLowerCase();
  return (linkMap.get(key) || key) + rest;
}

function cleanHtml(html, { dropTitle } = {}) {
  const $ = cheerio.load(`<div id="root">${html.replace(SHORTCODE, '')}</div>`, null, false);
  const root = $('#root');

  // Lazy-loaded images keep the real address in data-* attributes.
  root.find('img').each((_, el) => {
    const $el = $(el);
    const real = $el.attr('data-src') || $el.attr('data-lazy-src') || $el.attr('data-orig-file') || $el.attr('src');
    if (real) $el.attr('src', real.startsWith('//') ? 'https:' + real : real);
  });
  // Hidden sliders, tab nav and social-share widgets add noise.
  root.find('.vc_tta-tabs-list, .sharedaddy, .jp-relatedposts, .wpcf7, .mc4wp-form, rs-module-wrap, .rev_slider_wrapper, .owl-nav, .owl-dots').remove();

  const walk = (node) => {
    $(node).contents().each((_, child) => {
      if (child.type === 'comment') { $(child).remove(); return; }
      if (child.type !== 'tag') return;
      const tag = child.tagName.toLowerCase();
      if (DROP.has(tag)) { $(child).remove(); return; }
      walk(child);
      if (tag === 'h1') { child.tagName = 'h2'; }
      const t = child.tagName.toLowerCase();
      if (!ALLOWED.has(t)) { $(child).replaceWith($(child).contents()); return; }
      const keep = ATTRS[t] || [];
      for (const name of Object.keys(child.attribs || {})) if (!keep.includes(name)) $(child).removeAttr(name);
    });
  };
  walk(root[0]);

  root.find('a').each((_, el) => {
    const $el = $(el);
    const href = localise($el.attr('href'));
    if (!href || href === '#') { $el.replaceWith($el.contents()); return; }
    $el.attr('href', href);
    if (/^https?:/.test(href) && !href.startsWith(ORIGIN)) $el.attr('rel', 'noopener');
  });
  root.find('img').each((_, el) => {
    const $el = $(el);
    const src = $el.attr('src') || '';
    if (!src || src.startsWith('data:') || /\/(en|fr)\.png$/.test(src)) { $el.remove(); return; }
    if (src.startsWith('/')) $el.attr('src', ORIGIN + src);
    $el.attr('loading', 'lazy').attr('decoding', 'async');
    if ($el.attr('alt') === undefined) $el.attr('alt', '');
  });
  root.find('iframe').each((_, el) => {
    const $el = $(el);
    if (!/youtube|vimeo|google\.com\/maps|player/.test($el.attr('src') || '')) $el.remove();
    else $el.attr('loading', 'lazy');
  });

  // Unicode bold headings and stray non-breaking spaces.
  root.find('h2,h3,h4,h5,h6,strong,b,p,li').each((_, el) => {
    $(el).contents().each((__, c) => { if (c.type === 'text') c.data = c.data.normalize('NFKC'); });
  });

  if (dropTitle) {
    const first = root.find('h2').first();
    if (first.length && plain(first.text()).toLowerCase() === plain(dropTitle).toLowerCase()) first.remove();
  }
  // Remove empty paragraphs/headings and collapse bare text runs into paragraphs.
  for (let pass = 0; pass < 3; pass++) {
    root.find('p,h2,h3,h4,h5,h6,li,strong,em,b,i,span,blockquote,figure').each((_, el) => {
      const $el = $(el);
      if (!$el.text().replace(/[\s ]/g, '') && !$el.find('img,iframe,video,br+*').length) $el.remove();
    });
  }
  root.find('br').each((_, el) => {
    const prev = el.prev, next = el.next;
    if ((!prev || prev.type === 'tag' && prev.tagName === 'br') || !next) $(el).remove();
  });

  let out = root.html() || '';
  // Wrap top-level loose text in paragraphs.
  const $$ = cheerio.load(`<div id="r">${out}</div>`, null, false);
  const r = $$('#r');
  let buffer = [];
  const flush = (before) => {
    const text = buffer.map((n) => $$.html(n)).join('').trim();
    if (text.replace(/<br\s*\/?>/g, '').trim()) {
      const p = $$('<p></p>').html(text);
      if (before) $$(before).before(p); else r.append(p);
    }
    buffer.forEach((n) => $$(n).remove());
    buffer = [];
  };
  const BLOCK = new Set(['p', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'blockquote', 'figure', 'table', 'hr', 'iframe', 'pre', 'dl', 'video', 'audio']);
  r.contents().toArray().forEach((n) => {
    if (n.type === 'tag' && BLOCK.has(n.tagName)) flush(n);
    else if (n.type === 'text' && !n.data.trim()) { /* skip */ }
    else buffer.push(n);
  });
  flush(null);
  out = r.html() || '';
  return out.replace(/ /g, ' ').replace(/(<br\s*\/?>\s*){2,}/g, '<br>')
    .replace(/[ \t]*\n\s*/g, '\n').replace(/[ \t]{2,}/g, ' ').replace(/>\n(?=[^<])/g, '>').trim();
}

const textOf = (html) => cheerio.load(`<div>${html}</div>`)('div').text().replace(/\s+/g, ' ').trim();
const excerptOf = (html, n = 200) => {
  const t = plain(textOf(html)).replace(/(Continue|Read more|Continue reading)\s*$/i, '').trim();
  return t.length > n ? t.slice(0, t.lastIndexOf(' ', n)) + '…' : t;
};

// ---------- fetchers ----------
async function allFromApi(endpoint, fields) {
  const first = await get(`${API}/${endpoint}?per_page=100&page=1&_fields=${fields}`);
  const pages = Number(first.headers.get('x-wp-totalpages') || 1);
  const rest = await pool(Array.from({ length: pages - 1 }, (_, i) => i + 2), 3,
    async (p) => (await get(`${API}/${endpoint}?per_page=100&page=${p}&_fields=${fields}`)).body);
  return [first.body, ...rest].flat();
}

async function main() {
  await fs.mkdir(DATA, { recursive: true });
  console.log('Fetching categories, pages and posts from the API…');
  const [cats, apiPages, apiPosts] = await Promise.all([
    allFromApi('categories', 'id,name,slug,count,parent'),
    allFromApi('pages', 'id,slug,parent,link,title,date,modified,menu_order'),
    allFromApi('posts', 'id,date,modified,slug,link,title,content,excerpt,categories,featured_media'),
  ]);
  console.log(`  ${cats.length} categories, ${apiPages.length} pages, ${apiPosts.length} posts`);

  // Featured images.
  const mediaIds = [...new Set(apiPosts.map((p) => p.featured_media).filter(Boolean))];
  const media = new Map();
  const chunks = [];
  for (let i = 0; i < mediaIds.length; i += 100) chunks.push(mediaIds.slice(i, i + 100));
  await pool(chunks, 3, async (ids) => {
    const { body } = await get(`${API}/media?per_page=100&include=${ids.join(',')}&_fields=id,source_url,alt_text,media_details`);
    for (const m of body) {
      const sizes = m.media_details?.sizes || {};
      const pick = (...names) => names.map((n) => sizes[n]).find(Boolean);
      const card = pick('medium_large', 'large', 'full') || { source_url: m.source_url };
      const large = pick('1536x1536', 'large', 'full') || { source_url: m.source_url };
      media.set(m.id, {
        full: m.source_url, large: large.source_url, card: card.source_url,
        w: m.media_details?.width || null, h: m.media_details?.height || null, alt: plain(m.alt_text || ''),
      });
    }
  });
  console.log(`  ${media.size} featured images`);

  // ---------- link map (old path -> new path) ----------
  const pageInfo = apiPages
    .filter((p) => !SKIP_PAGES.has(p.slug))
    .map((p) => {
      const oldPath = p.link.replace(/^https?:\/\/(www\.)?wascal\.org/i, '').toLowerCase();
      const segs = oldPath.split('/').filter(Boolean).map((s) => PAGE_RENAMES[s] || s);
      return { ...p, oldPath, path: '/' + segs.join('/') + '/' };
    });
  const usedRoots = new Set(pageInfo.map((p) => p.path.split('/')[1]));
  const RESERVED = new Set(['news', 'category', 'search', 'partners', 'contact', 'page', 'fr', 'people']);

  const seen = new Set();
  const posts = apiPosts.map((p) => {
    let slug = slugify(p.slug) || `post-${p.id}`;
    if (usedRoots.has(slug) || RESERVED.has(slug) || seen.has(slug)) slug = `${slug}-${p.id}`;
    seen.add(slug);
    const oldPath = p.link.replace(/^https?:\/\/(www\.)?wascal\.org/i, '').toLowerCase();
    return { p, slug, oldPath };
  });

  linkMap = new Map();
  for (const pg of pageInfo) linkMap.set(pg.oldPath, pg.path);
  for (const { slug, oldPath } of posts) linkMap.set(oldPath, `/news/${slug}/`);
  for (const [from, to] of Object.entries(PAGE_RENAMES)) linkMap.set(`/${from}/`, `/${to}/`);
  linkMap.set('/our-partners/', '/partners/');
  linkMap.set('/contact/', '/contact/');
  linkMap.set('/blog/', '/news/category/blog/');
  linkMap.set('/news/', '/news/');
  for (const c of cats) linkMap.set(`/category/${c.slug}/`, `/news/category/${c.slug}/`);

  // ---------- posts ----------
  const catById = new Map(cats.map((c) => [c.id, c]));
  const HIDDEN_CATS = new Set(['uncategorized', 'slider', 'current-story']);
  const postOut = posts.map(({ p, slug, oldPath }) => {
    const html = cleanHtml(p.content?.rendered || '');
    const img = media.get(p.featured_media) || null;
    const catSlugs = (p.categories || []).map((id) => catById.get(id)?.slug).filter(Boolean);
    return {
      id: p.id, slug, oldPath, date: p.date, modified: p.modified,
      title: tidyTitle(p.title?.rendered || ''),
      excerpt: excerptOf(p.excerpt?.rendered || html),
      categories: catSlugs.filter((c) => !HIDDEN_CATS.has(c)),
      featured: catSlugs.includes('slider'),
      image: img ? { ...img, alt: img.alt || '' } : null,
      html,
    };
  }).sort((a, b) => b.date.localeCompare(a.date));

  // ---------- pages (rendered HTML) ----------
  console.log(`Downloading ${pageInfo.length} rendered pages…`);
  let done = 0;
  const pageOut = (await pool(pageInfo, 6, async (pg) => {
    const raw = await cached(`page-${pg.slug}-${pg.id}.html`, async () => (await get(pg.link, { json: false })).body);
    done++;
    if (done % 10 === 0) console.log(`  ${done}/${pageInfo.length}`);
    const $ = cheerio.load(raw);
    const body = $('article .entry-content').first().length ? $('article .entry-content').first() : $('.entry-content').first();
    const title = tidyTitle(pg.title?.rendered || '');
    const ogImage = $('meta[property="og:image"]').attr('content') || null;
    // Team cards -> structured people.
    const people = [];
    body.find('.zolo_teambox').each((i, el) => {
      const card = $(el);
      const link = card.find('a[href*="/zt_team/"]').first();
      const slug = (link.attr('href') || '').split('/zt_team/')[1]?.replace(/\/.*$/, '');
      if (!slug) return;
      people.push({
        slug, order: i, name: tidyTitle(link.text()), role: plain(card.find('.zolo_team_designation').text()),
        image: card.find('img').attr('data-src') || card.find('img').attr('src') || null,
      });
    });
    if (people.length) body.find('.zolo_teambox').remove();
    return {
      id: pg.id, slug: PAGE_RENAMES[pg.slug] || pg.slug, path: pg.path, oldPath: pg.oldPath, parent: pg.parent,
      title, modified: pg.modified, custom: CUSTOM_PAGES.has(pg.slug), image: ogImage,
      list: LIST_MAP[pg.slug] || null, peopleGroup: PEOPLE_GROUPS[pg.slug] || null, people,
      html: cleanHtml(body.html() || '', { dropTitle: plain(decode(pg.title?.rendered || '')) }),
    };
  })).filter(Boolean);

  // ---------- people profiles ----------
  const { body: sitemap } = await get(`${ORIGIN}/wp-sitemap-posts-zt_team-1.xml`, { json: false });
  const profileUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  console.log(`Downloading ${profileUrls.length} people profiles…`);
  const groupOf = new Map();
  for (const pg of pageOut) for (const p of pg.people) {
    if (!groupOf.has(p.slug)) groupOf.set(p.slug, []);
    groupOf.get(p.slug).push({ group: pg.peopleGroup, role: p.role, order: p.order, name: p.name, image: p.image });
  }
  const people = (await pool(profileUrls, 6, async (url) => {
    const slug = url.split('/zt_team/')[1]?.replace(/\/.*$/, '');
    let raw = '';
    try { raw = await cached(`person-${slug}.html`, async () => (await get(url, { json: false })).body); } catch { return null; }
    const $ = cheerio.load(raw);
    const memberships = groupOf.get(slug) || [];
    const name = memberships[0]?.name || tidyTitle($('h1').first().text() || $('title').text().split('–')[0]);
    const img = memberships[0]?.image || $('.entry-content img, .zolo_team_single img, article img').first().attr('src') || null;
    const bioRoot = $('.zolo_team_single_content, .team_single_content, article .entry-content').first();
    bioRoot.find('img').first().remove();
    return {
      slug, name, image: img, memberships,
      role: memberships[0]?.role || plain($('.zolo_team_designation').first().text()),
      bio: cleanHtml(bioRoot.html() || '', { dropTitle: name }),
    };
  })).filter(Boolean);
  for (const pr of people) linkMap.set(`/zt_team/${pr.slug}/`, `/people/${pr.slug}/`);
  for (const pg of pageOut) pg.html = pg.html.replace(/href="\/zt_team\/([^"/]+)\/?"/g, 'href="/people/$1/"');

  // ---------- categories (with post counts in the cleaned set) ----------
  const counts = new Map();
  for (const p of postOut) for (const c of p.categories) counts.set(c, (counts.get(c) || 0) + 1);
  const catOut = cats
    .filter((c) => counts.get(c.slug) && !HIDDEN_CATS.has(c.slug))
    .map((c) => ({ id: c.id, slug: c.slug, name: plain(decode(c.name)), count: counts.get(c.slug) }))
    .sort((a, b) => b.count - a.count);

  // ---------- redirects for Vercel ----------
  const redirects = [];
  const add = (source, destination) => {
    if (source !== destination && !redirects.some((r) => r.source === source)) redirects.push({ source, destination, permanent: true });
  };
  for (const pg of pageOut) add(pg.oldPath, pg.path);
  for (const p of postOut) add(p.oldPath, `/news/${p.slug}/`);
  add('/our-partners/', '/partners/');
  add('/blog/', '/news/category/blog/');
  for (const s of SKIP_PAGES) if (s !== 'home') add(`/${s}/`, SKIP_TARGETS[s] || (PAGE_RENAMES[s] ? `/${PAGE_RENAMES[s]}/` : '/'));
  for (const pr of people) add(`/zt_team/${pr.slug}/`, `/people/${pr.slug}/`);
  add('/category/:slug/', '/news/category/:slug/');

  await fs.writeFile(path.join(DATA, 'posts.json'), JSON.stringify(postOut));
  await fs.writeFile(path.join(DATA, 'pages.json'), JSON.stringify(pageOut));
  await fs.writeFile(path.join(DATA, 'categories.json'), JSON.stringify(catOut, null, 1));
  await fs.writeFile(path.join(DATA, 'people.json'), JSON.stringify(people));

  // ---------- latest YouTube videos (public channel feed, no API key needed) ----------
  try {
    const { body: feed } = await get('https://www.youtube.com/feeds/videos.xml?channel_id=UC4Gu3xoQxPEascDDwOd9-nA', { json: false });
    const $f = cheerio.load(feed, { xmlMode: true });
    const videos = $f('entry').slice(0, 6).map((_, e) => {
      const id = $f(e).find('yt\\:videoId').text();
      return { id, title: plain(decode($f(e).find('title').first().text())), published: $f(e).find('published').text(),
        url: `https://www.youtube.com/watch?v=${id}`, thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
    }).get().filter((v) => v.id);
    await fs.writeFile(path.join(DATA, 'youtube.json'), JSON.stringify(videos, null, 1));
    console.log(`  ${videos.length} YouTube videos`);
  } catch (err) { console.warn('  YouTube feed skipped:', err.message); }
  await fs.writeFile(path.join(ROOT, 'vercel.json'), JSON.stringify({
    $schema: 'https://openapi.vercel.sh/vercel.json', framework: 'astro', buildCommand: 'npm run build', outputDirectory: 'dist',
    trailingSlash: true, cleanUrls: false, redirects,
  }, null, 2));
  await fs.writeFile(path.join(DATA, 'sync-meta.json'), JSON.stringify({ syncedAt: new Date().toISOString(), posts: postOut.length, pages: pageOut.length }, null, 1));
  console.log(`Done: ${postOut.length} posts, ${pageOut.length} pages, ${catOut.length} categories, ${redirects.length} redirects.`);
}

main().catch((err) => { console.error(err); process.exit(1); });

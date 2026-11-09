# WASCAL website (redesign, feedback build)

A redesigned website for WASCAL (West African Science Service Centre on Climate Change and Adapted Land Use), built from scratch with [Astro](https://astro.build) as a fast static site.

All content (812 news posts, 84 pages, 73 people profiles) is synced from the current wascal.org WordPress site, so reviewers see the real content in the new design. This build is for feedback: it is kept out of search engines (`noindex`) until launch.

## Run it locally

Needs Node.js 20 or newer.

```bash
npm install
npm run build     # builds the site into dist/ and creates the search index
npm run preview   # serves it at http://localhost:4321
```

`npm run dev` gives live reload while editing (site search only works after `npm run build`).

## Refresh the content from wascal.org

```bash
npm run sync      # re-downloads posts, pages, people and the latest YouTube videos into src/data/
```

Add `-- --fresh` to ignore the local page cache. The sync also regenerates `vercel.json` with redirects from every old wascal.org address to its new one.

## Deploy on Vercel

1. Import this repository in Vercel (**Add New → Project**).
2. Vercel reads `vercel.json`: framework **Astro**, build command `npm run build`, output `dist`. No environment variables are needed.
3. Deploy. Every push to `main` redeploys; other branches get preview links.

## Where things live

| Path | What it is |
| --- | --- |
| `src/pages/` | Page templates: home, news, topics, content pages, people, partners, alumni, contact, search |
| `src/components/` | Header and menu, slideshow, footer, partner wall, social feeds, language switch |
| `src/data/nav.ts` | Main menu, social links and contact details |
| `src/data/partners.ts` | Partner list, logos and links (logos in `public/images/partners/`) |
| `src/data/*.json` | Content synced from wascal.org (do not edit by hand; run `npm run sync`) |
| `src/styles/global.css` | Colours, type and shared styles |
| `scripts/sync.mjs` | Content sync from WordPress |
| `scripts/check-links.mjs` | Lists broken internal links in `dist/` |

## Known gaps before launch

- **French**: the Français switch uses Google Translate (machine translation). WASCAL should review key pages.
- **Forms**: newsletter, contact and alumni registration show a "not connected yet" message.
- **Partner logos**: 16 partners show their name until WASCAL supplies official logo files; WASCAL should confirm permission to display all logos.
- **Images** are loaded from wascal.org.

import postsData from '../data/posts.json';
import pagesData from '../data/pages.json';
import categoriesData from '../data/categories.json';
import peopleData from '../data/people.json';

export interface Img { full: string; large: string; card: string; w: number | null; h: number | null; alt: string }
export interface Post {
  id: number; slug: string; date: string; modified: string; title: string; excerpt: string;
  categories: string[]; featured: boolean; image: Img | null; html: string;
}
export interface Page {
  id: number; slug: string; path: string; parent: number; title: string; modified: string; custom: boolean;
  image: string | null; list: string[] | null; peopleGroup: string | null;
  people: { slug: string; name: string; role: string; image: string | null; order: number }[];
  html: string;
}
export interface Category { id: number; slug: string; name: string; count: number }
export interface Person {
  slug: string; name: string; image: string | null; role: string; bio: string;
  memberships: { group: string; role: string; order: number }[];
}

export const posts = postsData as Post[];
export const pages = pagesData as Page[];
export const categories = categoriesData as Category[];
export const people = peopleData as Person[];

export const PER_PAGE = 12;

const catMap = new Map(categories.map((c) => [c.slug, c]));
export const categoryName = (slug: string) => catMap.get(slug)?.name ?? slug;

export const postUrl = (p: Pick<Post, 'slug'>) => `/news/${p.slug}/`;
export const personUrl = (slug: string) => `/people/${slug}/`;

export function postsIn(slugs: string[]): Post[] {
  const set = new Set(slugs);
  return posts.filter((p) => p.categories.some((c) => set.has(c)));
}

export function formatDate(iso: string, style: 'long' | 'short' = 'long') {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: style === 'long' ? 'long' : 'short', year: 'numeric', timeZone: 'UTC',
  });
}

/** Sentence-friendly role text: old roles are often in capitals ("CHAIRMAN"). */
export function tidyRole(role: string) {
  if (!role) return '';
  const letters = role.replace(/[^A-Za-z]/g, '');
  if (letters && letters === letters.toUpperCase() && letters.length > 3) {
    return role.toLowerCase().replace(/(^|[\s(-])([a-z])/g, (m, a, b) => a + b.toUpperCase());
  }
  return role;
}

export const pageByPath = (path: string) => pages.find((p) => p.path === path);
export const childPages = (page: Page) => pages.filter((p) => p.parent === page.id);

/** Remove the WordPress image size suffix to get a sharper image for large slots. */
export function bestImage(img: Img | null, size: 'card' | 'large' | 'full' = 'card') {
  if (!img) return null;
  return img[size] || img.large || img.full;
}

export const memberCountries = [
  { name: 'Benin', fr: 'Bénin', flag: 'benin.png' }, { name: 'Burkina Faso', fr: 'Burkina Faso', flag: 'burkina.png' }, { name: 'Cabo Verde', fr: 'Cabo Verde', flag: 'caboverde.png' },
  { name: "Côte d'Ivoire", fr: "Côte d'Ivoire", flag: 'civ.png' }, { name: 'The Gambia', fr: 'Gambie', flag: 'gambia.png' }, { name: 'Ghana', fr: 'Ghana', flag: 'ghana.png' },
  { name: 'Guinea', fr: 'Guinée', flag: 'guinea.png' }, { name: 'Mali', fr: 'Mali', flag: 'mali.png' }, { name: 'Niger', fr: 'Niger', flag: 'niger.png' },
  { name: 'Nigeria', fr: 'Nigéria', flag: 'nigeria.png' }, { name: 'Senegal', fr: 'Sénégal', flag: 'senegal.png' }, { name: 'Sierra Leone', fr: 'Sierra Leone', flag: 'sierraleone.jpg' },
  { name: 'Togo', fr: 'Togo', flag: 'togo.png' },
];

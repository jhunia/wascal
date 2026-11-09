// Main menu. Same sections as the current wascal.org menu, in a clearer order:
// about us -> what we do -> what we produce -> who we work with. Contact sits apart on the right.
export interface NavItem {
  label: string;
  /** Fixed French label for the top menu (machine translation is too long or wrong here). */
  fr?: string;
  href?: string;
  external?: boolean;
  children?: NavItem[];
}

export const GREEN_HYDROGEN_SITE = 'https://wascal.org/greenhydrogen/';

export const mainNav: NavItem[] = [
  { label: 'Home', fr: 'Accueil', href: '/' },
  {
    label: 'Who we are', fr: 'Qui sommes-nous',
    children: [
      { label: 'Our story', href: '/our-story/' },
      { label: 'Our impact', href: '/our-impacts/' },
      { label: 'Our partners', href: '/partners/' },
      { label: 'Board members', href: '/new-board-members/' },
      { label: 'Management team', href: '/executive-management-team/' },
      { label: 'Scientific Advisory Committee', href: '/new-sac-members/' },
      { label: 'Legal documents', href: '/legal-documents/' },
    ],
  },
  {
    label: 'Capacity building', fr: 'Renforcement des capacités',
    children: [
      {
        label: 'Graduate studies programme', href: '/graduate-studies-programme/',
        children: [
          { label: 'Climate change programmes', href: '/climate-change/' },
          { label: 'Renewable energies & green hydrogen', href: '/renewable-energies/' },
        ],
      },
      { label: 'Seminars', href: '/seminars/' },
      { label: 'Alumni', href: '/alumni/' },
    ],
  },
  {
    label: 'Competence centre', fr: 'Centre de compétences',
    children: [
      { label: 'About the Competence Centre', href: '/about-competence-centre/' },
      {
        label: 'WASCAL Data Infrastructure (WADI)', href: '/data-management-department/wascal-data-infrastructure-wadi/',
        children: [
          { label: 'About WADI', href: '/data-management-department/wascal-data-infrastructure-wadi/about-wadi/' },
          { label: 'Observation networks', href: '/data-management-department/wascal-data-infrastructure-wadi/observation-networks/' },
          { label: 'High-performance computer', href: '/data-management-department/wascal-data-infrastructure-wadi/high-performance-computer/' },
          { label: 'GIS & remote sensing lab', href: '/data-management-department/wascal-data-infrastructure-wadi/gis-remote-sensing-laboratory/' },
          { label: 'Data repository & portals', href: '/wascal-data-repository-and-portals/' },
        ],
      },
      { label: 'Data services', href: '/data-management-department/data-services/' },
      { label: 'WASCAL basins', href: '/data-management-department/wascal-basins/' },
      { label: 'Research & innovations', href: '/research-innovations/' },
      {
        label: 'Climate & environmental advisory', href: '/climate-environmental-services/',
        children: [{ label: 'Other services', href: '/climate-environmental-services/other-services/' }],
      },
    ],
  },
  {
    label: 'Projects', fr: 'Projets', href: '/projects/',
    children: [
      { label: 'All projects', href: '/projects/' },
      { label: 'Green hydrogen', href: GREEN_HYDROGEN_SITE, external: true },
      { label: 'Renewable energy coordination', href: '/renewable-energy-coordination-projects/' },
      { label: 'Competence Centre projects', href: '/competence-centre-projects/' },
      { label: 'Capacity building projects', href: '/capacity-building-projects/' },
    ],
  },
  { label: 'Publications', fr: 'Publications', href: '/academic-publications/' },
  {
    label: 'News & resources', fr: 'Actualités',
    children: [
      { label: 'News', href: '/news/' },
      { label: 'Blog', href: '/blog/' },
      { label: 'Events', href: '/our-events/' },
      { label: 'Factsheets', href: '/news/category/factsheet/' },
      { label: 'Investment', href: '/investment/' },
      { label: 'Gallery', href: '/gallery/' },
      { label: 'Reports & newsletters', href: '/reports/' },
      { label: 'Documents', href: '/documents/' },
      { label: 'Vacancies', href: '/vacancies/' },
    ],
  },
  { label: 'Partners', fr: 'Partenaires', href: '/partners/' },
];

export const social = [
  { label: 'Facebook', href: 'https://web.facebook.com/wascalclimate/', icon: 'facebook' },
  { label: 'X (Twitter)', href: 'https://twitter.com/wascalclimate', icon: 'x' },
  { label: 'YouTube', href: 'https://www.youtube.com/channel/UC4Gu3xoQxPEascDDwOd9-nA', icon: 'youtube' },
  { label: 'Instagram', href: 'https://www.instagram.com/wascalclimate/', icon: 'instagram' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/wascallinkedin', icon: 'linkedin' },
] as const;

export const contact = {
  address: ['CSIR Office Complex, Agostino Neto Road', 'Airport Residential Area', 'PMB CT 504, Cantonments', 'Accra, Ghana'],
  phone: '+233 302 500 396',
  email: 'info@wascal.org',
};

/** Find the top-level section a path belongs to, for section side menus and breadcrumbs. */
export function sectionFor(path: string): { section: NavItem; trail: NavItem[] } | null {
  const visit = (items: NavItem[], trail: NavItem[]): NavItem[] | null => {
    for (const item of items) {
      const t = [...trail, item];
      if (item.href === path) return t;
      if (item.children) {
        const found = visit(item.children, t);
        if (found) return found;
      }
    }
    return null;
  };
  for (const top of mainNav) {
    if (!top.children) continue;
    const found = visit(top.children, [top]);
    if (found) return { section: top, trail: found };
  }
  return null;
}

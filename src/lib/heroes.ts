// Background photos for page banners (all WASCAL's own photos, in /public/images/headers).
// A page gets the photo for its section; a few pages and keywords get a more specific one.
const H = (name: string) => `/images/headers/${name}.webp`;

export const heroes = {
  who: H('who'),
  governance: H('governance'),
  capacity: H('capacity'),
  graduate: H('graduate'),
  alumni: H('alumni'),
  competence: H('competence'),
  research: H('research'),
  energy: H('energy'),
  news: H('news'),
  partners: H('partners'),
  publications: H('publications'),
};

const BY_PATH: [RegExp, string][] = [
  [/^\/(new-board-members|executive-management-team|new-sac-members|management|lead-scientists|people)\//, heroes.governance],
  [/^\/(doctoral|master)|graduate-studies|climate-change\/|renewable-energies|4th-batch|call-for-applications|visiting-scholars/, heroes.graduate],
  [/^\/alumni\//, heroes.alumni],
  [/^\/(seminars|building-local-capacity)\//, heroes.capacity],
  [/^\/(data-management-department|wascal-data-repository|data-centre|about-competence-centre|dano-basin|dassari-basin|vea-sissilli-basin)/, heroes.competence],
  [/^\/(research-innovations|climate-environmental-service|climate-and-environmental-service|research-action-plan)/, heroes.research],
  [/^\/(projects|renewable-energy-coordination|competence-centre-projects|capacity-building-projects|investment)/, heroes.energy],
  [/^\/(academic-publications|publications|journal-article|policy-brief|reports|annual-reports|financial-reports|newsletters|documents|legal-documents)/, heroes.publications],
  [/^\/(our-events|gallery|media-links|blog|news|wascaal-news|vacancies|faqs)/, heroes.news],
  [/^\/(partners|our-partners)\//, heroes.partners],
];

const BY_SECTION: Record<string, string> = {
  'Who we are': heroes.who,
  'Capacity building': heroes.capacity,
  'Competence centre': heroes.competence,
  Projects: heroes.energy,
  'News & resources': heroes.news,
};

export function heroFor(path: string, section?: string): string {
  for (const [re, img] of BY_PATH) if (re.test(path)) return img;
  return (section && BY_SECTION[section]) || heroes.who;
}

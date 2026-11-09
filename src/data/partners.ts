// Partner records. Each tile shows the partner's official logo and links to its official website.
// Logos were taken from each partner's own website or its Wikimedia Commons logo file (see /public/images/partners).
// Partners whose official logo could not be found online show their name as a wordmark until WASCAL supplies the file.
// Source list: the current wascal.org "Our Partners" page (about 2012) plus current funders.
// TODO (WASCAL): confirm the current list, and confirm permission to display each logo.

export interface Partner {
  name: string;
  short?: string;
  country?: string;
  url?: string;
  logo?: string; // path under /public
  featured?: boolean;
}
export interface PartnerGroup { id: string; title: string; intro?: string; partners: Partner[] }

const L = (id: string) => `/images/partners/${id}.webp`;

export const partnerGroups: PartnerGroup[] = [
  {
    id: 'funders', title: 'Funding and strategic partners',
    partners: [
      { name: 'Federal Ministry of Research, Technology and Space (BMFTR)', short: 'BMFTR', country: 'Germany', url: 'https://www.bmftr.bund.de/', logo: L('bmftr'), featured: true },
      { name: 'Economic Community of West African States (ECOWAS)', short: 'ECOWAS', url: 'https://www.ecowas.int/', logo: L('ecowas'), featured: true },
      { name: 'Deutsche Gesellschaft für Internationale Zusammenarbeit (GIZ)', short: 'GIZ', country: 'Germany', url: 'https://www.giz.de/en/', logo: L('giz'), featured: true },
    ],
  },
  {
    id: 'german', title: 'German research partners',
    partners: [
      { name: 'University of Augsburg', short: 'Uni Augsburg', url: 'https://www.uni-augsburg.de/en/', logo: L('augsburg'), featured: true },
      { name: 'University of Rostock', short: 'Uni Rostock', url: 'https://www.uni-rostock.de/en/', logo: L('rostock') },
      { name: 'University of Würzburg', short: 'Uni Würzburg', url: 'https://www.uni-wuerzburg.de/en/', logo: L('wuerzburg') },
      { name: 'German Climate Computing Centre (DKRZ)', short: 'DKRZ', url: 'https://www.dkrz.de/en', logo: L('dkrz') },
      { name: 'German Aerospace Center (DLR)', short: 'DLR', url: 'https://www.dlr.de/en', logo: L('dlr'), featured: true },
      { name: 'Forschungszentrum Jülich', short: 'FZ Jülich', url: 'https://www.fz-juelich.de/en', logo: L('fzj') },
      { name: 'Karlsruhe Institute of Technology (KIT)', short: 'KIT', url: 'https://www.kit.edu/english/', logo: L('kit'), featured: true },
    ],
  },
  {
    id: 'universities', title: 'West African universities',
    partners: [
      { name: "Université d'Abomey-Calavi", short: 'UAC', country: 'Benin', url: 'https://www.uac.bj/', logo: L('uac') },
      { name: 'Université Joseph Ki-Zerbo (formerly Université de Ouagadougou)', short: 'UJKZ', country: 'Burkina Faso', url: 'https://www.ujkz.bf/' },
      { name: 'University of The Gambia', short: 'UTG', country: 'The Gambia', url: 'https://www.utg.edu.gm/', logo: L('utg') },
      { name: 'Kwame Nkrumah University of Science and Technology', short: 'KNUST', country: 'Ghana', url: 'https://www.knust.edu.gh/', logo: L('knust'), featured: true },
      { name: 'University for Development Studies', short: 'UDS', country: 'Ghana', url: 'https://www.uds.edu.gh/' },
      { name: 'Université Nangui Abrogoua (formerly Abobo-Adjamé)', short: 'UNA', country: "Côte d'Ivoire", url: 'https://univ-na.ci/' },
      { name: 'Université Félix Houphouët-Boigny (formerly Cocody)', short: 'UFHB', country: "Côte d'Ivoire", url: 'https://univ-fhb.edu.ci/', logo: L('ufhb') },
      { name: 'Université de Bamako', short: 'Univ. Bamako', country: 'Mali' },
      { name: 'Université Abdou Moumouni de Niamey', short: 'UAM', country: 'Niger', url: 'https://uam.edu.ne/', logo: L('uam'), featured: true },
      { name: 'Ahmadu Bello University', short: 'ABU', country: 'Nigeria', url: 'https://abu.edu.ng/', logo: L('abu') },
      { name: 'Federal University of Technology, Akure', short: 'FUTA', country: 'Nigeria', url: 'https://www.futa.edu.ng/' },
      { name: 'Federal University of Technology, Minna', short: 'FUT Minna', country: 'Nigeria', url: 'https://futminna.edu.ng/', logo: L('futminna') },
      { name: 'Obafemi Awolowo University', short: 'OAU', country: 'Nigeria', url: 'https://oauife.edu.ng/' },
      { name: 'University of Calabar', short: 'UNICAL', country: 'Nigeria', url: 'https://unical.edu.ng/', logo: L('unical') },
      { name: 'Université Cheikh Anta Diop de Dakar', short: 'UCAD', country: 'Senegal', url: 'https://www.ucad.sn/', logo: L('ucad'), featured: true },
      { name: 'Université Gaston Berger', short: 'UGB', country: 'Senegal', url: 'https://www.ugb.sn/', logo: L('ugb') },
      { name: 'Université de Kara', short: 'Univ. Kara', country: 'Togo', url: 'https://univ-kara.tg/' },
      { name: 'Université de Lomé', short: 'Univ. Lomé', country: 'Togo', url: 'https://univ-lome.tg/' },
    ],
  },
  {
    id: 'agencies', title: 'National agencies',
    intro: 'Meteorological services, water authorities and agricultural research institutes in member countries.',
    partners: [
      { name: 'Agence Nationale de la Météorologie du Bénin', short: 'Météo Bénin', country: 'Benin', url: 'https://www.meteobenin.bj/', logo: L('meteobenin') },
      { name: 'Agence Nationale de la Météorologie du Burkina Faso', short: 'Météo Burkina', country: 'Burkina Faso', url: 'https://www.meteoburkina.bf/', logo: L('meteoburkina') },
      { name: 'Ghana Meteorological Agency', short: 'GMet', country: 'Ghana', url: 'https://www.meteo.gov.gh/', logo: L('gmet') },
      { name: 'Water Resources Commission', short: 'WRC', country: 'Ghana', url: 'https://www.wrc-gh.org/' },
      { name: 'Council for Scientific and Industrial Research (CSIR)', short: 'CSIR', country: 'Ghana', url: 'https://www.csir.org.gh/', logo: L('csir') },
      { name: "Institut de l'Environnement et de Recherches Agricoles", short: 'INERA', country: 'Burkina Faso', url: 'https://www.inera.bf/' },
      { name: 'Centre National de Recherche Agronomique', short: 'CNRA', country: "Côte d'Ivoire", url: 'https://www.cnra.ci/', logo: L('cnra') },
      { name: "Institut d'Économie Rurale", short: 'IER', country: 'Mali', url: 'https://www.ier.gouv.ml/' },
      { name: 'Direction Nationale de l’Hydraulique', short: 'DNH', country: 'Mali' },
      { name: 'Institut Togolais de Recherche Agronomique', short: 'ITRA', country: 'Togo', url: 'https://itra.tg/', logo: L('itra') },
    ],
  },
  {
    id: 'international', title: 'International and regional institutions',
    partners: [
      { name: 'African Centre of Meteorological Applications for Development', short: 'ACMAD', url: 'https://acmad.org/', logo: L('acmad') },
      { name: 'AGRA', short: 'AGRA', url: 'https://agra.org/' },
      { name: 'AGRHYMET Regional Climate Centre (CILSS)', short: 'AGRHYMET', url: 'https://www.agrhymet.cilss.int/' },
      { name: 'West and Central African Council for Agricultural Research and Development', short: 'CORAF', url: 'https://www.coraf.org/', logo: L('coraf'), featured: true },
      { name: 'Forum for Agricultural Research in Africa', short: 'FARA', url: 'https://faraafrica.org/', logo: L('fara') },
      { name: 'International Food Policy Research Institute', short: 'IFPRI', url: 'https://www.ifpri.org/', logo: L('ifpri') },
      { name: 'INDEPTH Network', short: 'INDEPTH' },
      { name: 'International Institute for Water and Environmental Engineering (2iE)', short: '2iE', url: 'https://www.2ie-edu.org/', logo: L('iie') },
      { name: 'International Water Management Institute', short: 'IWMI', url: 'https://www.iwmi.org/', logo: L('iwmi'), featured: true },
      { name: 'United Nations University, Institute for Environment and Human Security', short: 'UNU-EHS', url: 'https://unu.edu/ehs', logo: L('unu'), featured: true },
      { name: 'Volta Basin Authority', short: 'VBA', url: 'https://www.abv-volta.org/', logo: L('vba') },
      { name: 'AfricanNess', short: 'AfricanNess' },
    ],
  },
];

export const featuredPartners = partnerGroups.flatMap((g) => g.partners.filter((p) => p.featured));
export const partnerCount = partnerGroups.reduce((n, g) => n + g.partners.length, 0);
export const logoCount = partnerGroups.reduce((n, g) => n + g.partners.filter((p) => p.logo).length, 0);

// Source unique des sessions de formation en présentiel.
// Consommée par : le popup (BaseLayout), la bannière d'accueil (UpcomingSessionsBanner),
// la page /formations, les pages /formations/[slug] et le dashboard.
//
// Pour ajouter ou retirer une session : modifier UNIQUEMENT ce fichier.
// Quand une session est passée, la retirer d'ici et ajouter une redirection de
// son slug vers /formations dans astro.config.mjs (le site est statique : les
// pages listant les sessions sont figées au moment du build).

export interface Session {
  slug: string;
  title: string;
  /** Format AAAA-MM-JJ */
  dateISO: string;
  location: string;
  color: 'primary' | 'secondary';
}

export const sessions: Session[] = [
  {
    slug: 'maitriser-claude-juin-2026',
    title: 'Maîtriser Claude',
    dateISO: '2026-06-17',
    location: 'Robelot',
    color: 'primary',
  },
  {
    slug: 'maitriser-claude-juillet-2026',
    title: 'Maîtriser Claude',
    dateISO: '2026-07-22',
    location: 'Robelot',
    color: 'secondary',
  },
  {
    slug: 'maitriser-claude-aout-2026',
    title: 'Maîtriser Claude',
    dateISO: '2026-08-12',
    location: 'Robelot',
    color: 'primary',
  },
];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const fr = (iso: string, options: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleDateString('fr-FR', options);

/** "Mercredi 17 juin 2026" */
export const dateDisplay = (s: Session) =>
  capitalize(fr(s.dateISO, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));

/** "17 juin 2026" */
export const shortDate = (s: Session) =>
  fr(s.dateISO, { day: 'numeric', month: 'long', year: 'numeric' });

/** "17 juin" */
export const dayMonth = (s: Session) => fr(s.dateISO, { day: 'numeric', month: 'long' });

/** "Mercredi" */
export const weekday = (s: Session) => capitalize(fr(s.dateISO, { weekday: 'long' }));

/**
 * Sessions dont la date n'est pas encore passée (une session reste visible le
 * jour J). Évaluée au build pour les pages statiques, à la requête en SSR.
 */
export function upcomingSessions(now: Date = new Date()): Session[] {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return sessions.filter((s) => new Date(`${s.dateISO}T23:59:59`) >= startOfToday);
}

/** Programme commun aux sessions "Maîtriser Claude" (affiché au dashboard). */
export const claudeProgramme = [
  { icon: 'table_chart', label: 'Claude dans Excel' },
  { icon: 'slideshow', label: 'Claude dans PowerPoint' },
  { icon: 'auto_awesome', label: 'Les artefacts dans Claude' },
  { icon: 'terminal', label: 'Claude Code' },
  { icon: 'image', label: "Concurrents & création d'images (NanoBanana)" },
  { icon: 'psychology', label: 'Créer un second cerveau IA multi-LLM' },
  { icon: 'compare_arrows', label: 'ChatGPT, Gemini & autres LLMs' },
];

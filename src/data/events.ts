// Événement mis en avant dans le popup du site (src/components/EventPopup.astro).
// Pour changer d'événement : modifier UNIQUEMENT cet objet. Le popup disparaît
// tout seul le lendemain de `endISO`.
export const featuredEvent = {
  name: 'Immersion IA',
  city: 'Paris',
  dates: '11 & 12 janvier 2027',
  /** Dernier jour de l'événement, format AAAA-MM-JJ */
  endISO: '2027-01-12',
  url: 'https://immersion-ia-paris-2027.vercel.app',
};

/** Vrai tant que l'événement n'est pas terminé (évalué au build). */
export function isFeaturedEventActive(now: Date = new Date()): boolean {
  return now <= new Date(`${featuredEvent.endISO}T23:59:59`);
}

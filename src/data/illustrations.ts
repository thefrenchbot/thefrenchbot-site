// Illustrations des formations — générées par scripts/illustrations/render.cjs.
// `wide` pour les cartes (bandeau), `square` pour les blocs carrés.
import type { ImageMetadata } from 'astro';
import claudeWide from '../assets/illustrations/claude-wide.png';
import claudeSquare from '../assets/illustrations/claude-square.png';
import promptWide from '../assets/illustrations/prompt-wide.png';
import promptSquare from '../assets/illustrations/prompt-square.png';
import nocodeWide from '../assets/illustrations/nocode-wide.png';
import nocodeSquare from '../assets/illustrations/nocode-square.png';
import productWide from '../assets/illustrations/product-wide.png';
import productSquare from '../assets/illustrations/product-square.png';
import ethiqueWide from '../assets/illustrations/ethique-wide.png';
import ethiqueSquare from '../assets/illustrations/ethique-square.png';
import projetsSquare from '../assets/illustrations/projets-square.png';

type Illustration = { wide: ImageMetadata; square: ImageMetadata };

const claude: Illustration = { wide: claudeWide, square: claudeSquare };

const bySlug: Record<string, Illustration> = {
  'prompt-engineering': { wide: promptWide, square: promptSquare },
  'no-code-ia': { wide: nocodeWide, square: nocodeSquare },
  'product-manager-ia': { wide: productWide, square: productSquare },
  'ia-ethique': { wide: ethiqueWide, square: ethiqueSquare },
};

/** Illustration d'une formation. Les sessions « Maîtriser Claude » partagent le même visuel. */
export function formationIllustration(slug: string): Illustration {
  return bySlug[slug] ?? claude;
}

export const projetsIllustration = projetsSquare;

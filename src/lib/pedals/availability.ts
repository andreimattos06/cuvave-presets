/**
 * Quais pedaleiras do catálogo aparecem para o usuário escolher.
 *
 * O banco tem os painéis da Baby e da Papa Blues, mas só a Tank-G está
 * funcional de ponta a ponta — painel conferido contra o aparelho e troca de
 * preset pelo arquivo .tkg. Enquanto as outras não chegam lá, elas somem das
 * listas de escolha sem sair do banco: envios antigos que apontam para elas
 * continuam abrindo normalmente na página da música.
 *
 * Para liberar mais uma, basta acrescentar o slug aqui.
 */
export const AVAILABLE_PEDAL_SLUGS = ["tank-g"] as const;

export type AvailablePedalSlug = (typeof AVAILABLE_PEDAL_SLUGS)[number];

export function isPedalAvailable(slug: string): slug is AvailablePedalSlug {
  return (AVAILABLE_PEDAL_SLUGS as readonly string[]).includes(slug);
}

/** Filtra uma lista de modelos (do banco ou da demo) pelos slugs liberados. */
export function filterAvailablePedals<T extends { slug: string }>(models: T[]) {
  return models.filter((model) => isPedalAvailable(model.slug));
}

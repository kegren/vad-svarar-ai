// Umami på umami.kemero.io (PLAN.md avsnitt 13), utan kakor. Id:t kommer från
// webbplatsen för vad-svarar-ai.kegren.com i Umami. Tomt id betyder ingen mätning.
export const UMAMI_WEBBPLATS = "";
export const UMAMI_SKRIPT = "https://umami.kemero.io/script.js";

type Handelse =
  | "korning_startad"
  | "korning_klar"
  | "resultat_delat"
  | "klick_kegren"
  | "klick_kemero";

declare global {
  // biome-ignore lint/style/useConsistentTypeDefinitions: Window kan bara utökas med interface.
  interface Window {
    umami?: { track: (namn: string, data?: Record<string, string>) => void };
  }
}

export function mat(namn: Handelse, data?: Record<string, string>) {
  window.umami?.track(namn, data);
}

import { z } from "zod";

export const ForetagSchema = z.object({
  foretag: z.string().trim().min(1).max(80),
  bransch: z.string().trim().min(1).max(60),
  ort: z.string().trim().min(1).max(60),
});

export type Foretag = z.infer<typeof ForetagSchema>;

// De två kundfrågorna (PLAN.md avsnitt 5). Servern bygger dem själv ur fälten.
export function fragor({ foretag, bransch, ort }: Foretag) {
  return [
    `Jag behöver en ${bransch} i ${ort}. Vilka rekommenderar du och varför?`,
    `Vad vet du om ${foretag} i ${ort}? Vad säger kunderna?`,
  ] as const;
}

export type Kalla = { url: string; titel: string; doman: string };

import { z } from "zod";
import type { Kalla } from "./fragor";
import { TJANSTER, type Tjanst } from "./modeller";

// Analysen av de åtta svaren (PLAN.md avsnitt 5.4). Modellen bedömer det som
// kräver läsning. Det som går att räkna räknas i koden: hur många svar som
// nämner en konkurrent och vilka källor tjänsterna läste.
export const AnalysSchema = z.object({
  svar: z
    .array(
      z.object({
        nyckel: z
          .string()
          .meta({ description: "Svarets nyckel, till exempel chatgpt-0" }),
        kannerTill: z.boolean().meta({
          description:
            "Sant om svaret beskriver eller rekommenderar just det här företaget. Falskt om tjänsten säger att den inte hittar företaget, blandar ihop det med något annat eller inte nämner det.",
        }),
        plats: z.number().nullable().meta({
          description:
            "Företagets plats i svarets lista över rekommendationer, 1 för först. Null om företaget inte står i en sådan lista.",
        }),
        citat: z.string().nullable().meta({
          description:
            "En hel mening ordagrant ur svaret som säger något om företaget, utan ändringar. Null om svaret inte nämner företaget.",
        }),
        omdome: z.string().meta({
          description:
            "En kort mening på svenska om vad svaret säger om företaget. Om det inte nämns, säg det.",
        }),
      })
    )
    .meta({ description: "Ett element per svar, i samma ordning som svaren." }),
  konkurrenter: z.array(z.string()).meta({
    description:
      "Namnen på andra företag i samma bransch som svaren rekommenderar eller nämner, stavade som i svaren. Inte det analyserade företaget.",
  }),
  pastaenden: z
    .array(
      z.object({
        text: z.string().meta({
          description:
            "Ett sakpåstående om företaget, på svenska, med tjänsternas egna uppgifter (pris, adress, år, omdömen).",
        }),
        svar: z
          .array(z.string())
          .meta({ description: "Nycklarna till svaren som säger detta" }),
        kalla: z.string().nullable().meta({
          description:
            "Domänen som svaren hänvisar till för påståendet, till exempel hitta.se. Null om ingen källa anges.",
        }),
        kontrollera: z.boolean().meta({
          description:
            "Sant bara när tjänsterna säger emot varandra om uppgiften. Sant också när den kommer från en katalog eller en gammal sida. Falskt när uppgiften kommer från företagets egen hemsida och ingen tjänst säger emot den. Var sparsam: de flesta påståenden ska vara falska.",
        }),
      })
    )
    .meta({ description: "Högst åtta påståenden, de viktigaste först." }),
  attGora: z
    .array(
      z.object({
        gor: z.string().meta({
          description:
            "En åtgärd som ägaren av företaget själv gör för att AI-tjänsterna ska svara rätt om företaget: till exempel rätta en katalog, skriva en uppgift tydligt på hemsidan, samla omdömen eller publicera kundcase. Aldrig ett råd till en kund som funderar på att köpa. En uppmaning på svenska, högst tolv ord.",
        }),
        darfor: z.string().meta({
          description:
            "En mening om varför, som pekar på ett svar eller en källa, till exempel att två tjänster läste ett gammalt telefonnummer på eniro.se.",
        }),
        pekarPa: z.array(z.string()).meta({
          description:
            "Svarsnycklar (chatgpt-1), domäner (eniro.se) eller kontroller (robots.txt, llms.txt, html, strukturerad data) som saken bygger på.",
        }),
      })
    )
    .meta({
      description:
        "Exakt tre saker, de viktigaste först. Aldrig allmänna råd som går att ge alla företag.",
    }),
});

export type Analys = z.infer<typeof AnalysSchema>;

export type SparatSvar = {
  tjanst: Tjanst;
  fraga: 0 | 1;
  text: string;
  kallor: Kalla[];
  kostnad: number | null;
  fel: boolean;
};

export function svarsnyckel(tjanst: Tjanst, fraga: 0 | 1) {
  return `${tjanst}-${fraga}`;
}

// Det som visas och sparas: modellens bedömning plus det som räknas i koden.
export type Resultat = {
  svar: Analys["svar"];
  konkurrenter: { namn: string; antal: number; tjanster: Tjanst[] }[];
  pastaenden: Analys["pastaenden"];
  attGora: Analys["attGora"];
  kallor: { doman: string; url: string; titel: string; tjanster: Tjanst[] }[];
};

const TANKSTRECK = /\s[–—]\s/gu;
const KOMMA_FORE_OCH = /,\s(?<ord>och|eller)\s/gu;
const SVARSNYCKEL = /\b(?<tjanst>chatgpt|gemini|claude|perplexity)-[01]\b/giu;

// Modellerna skriver gärna tankstreck och komma före och. PLAN.md avsnitt 11
// vill inte ha dem. Ibland skriver de också svarsnycklar som chatgpt-0. De blir
// tjänsternas namn.
function stada(text: string) {
  return text
    .replace(TANKSTRECK, ", ")
    .replace(KOMMA_FORE_OCH, " $<ord> ")
    .replace(SVARSNYCKEL, (_, tjanst: string) => {
      const t = tjanst.toLowerCase() as Tjanst;
      return t in TJANSTER ? TJANSTER[t].namn : tjanst;
    })
    .trim();
}

function unika<T>(lista: T[]) {
  return [...new Set(lista)];
}

const MARKDOWN = /\*\*|__|\[(?<text>[^\]]*)\]\([^)]*\)/gu;
const BLANKSTEG = /\s+/gu;
const SLUTTECKEN = /[.!?]$/u;

function platt(text: string) {
  return text.replace(MARKDOWN, "$<text>").replace(BLANKSTEG, " ").trim();
}

// Ett citat visas bara om det står ordagrant i svaret. Annars är det inget citat.
function kontrolleratCitat(citat: string | null, svar: SparatSvar | undefined) {
  if (!(citat && svar)) {
    return null;
  }
  const rent = platt(citat).replace(/^["”“]|["”“]$/gu, "");
  return platt(svar.text).includes(rent) ? rent : null;
}

function meningsslut(text: string) {
  return SLUTTECKEN.test(text) ? text : `${text}.`;
}

export function bygg(analys: Analys, svar: SparatSvar[]): Resultat {
  const konkurrenter = unika(analys.konkurrenter.map((n) => n.trim()))
    .filter(Boolean)
    .map((namn) => {
      const traffar = svar.filter((s) =>
        s.text.toLowerCase().includes(namn.toLowerCase())
      );
      return {
        namn,
        antal: Math.max(1, traffar.length),
        tjanster: unika(traffar.map((s) => s.tjanst)),
      };
    })
    .sort((a, b) => b.antal - a.antal)
    .slice(0, 8);

  const perDoman = new Map<string, Resultat["kallor"][number]>();
  for (const s of svar) {
    for (const k of s.kallor) {
      const forra = perDoman.get(k.doman);
      if (forra) {
        forra.tjanster = unika([...forra.tjanster, s.tjanst]);
      } else {
        perDoman.set(k.doman, { ...k, tjanster: [s.tjanst] });
      }
    }
  }

  return {
    svar: analys.svar.map((s) => ({
      ...s,
      citat: kontrolleratCitat(
        s.citat,
        svar.find((x) => svarsnyckel(x.tjanst, x.fraga) === s.nyckel)
      ),
      omdome: stada(s.omdome),
    })),
    konkurrenter,
    pastaenden: analys.pastaenden
      .slice(0, 8)
      .map((p) => ({ ...p, text: stada(p.text) })),
    attGora: analys.attGora.slice(0, 3).map((a) => ({
      ...a,
      gor: meningsslut(stada(a.gor)),
      darfor: meningsslut(stada(a.darfor)),
    })),
    kallor: [...perDoman.values()].sort(
      (a, b) => b.tjanster.length - a.tjanster.length
    ),
  };
}

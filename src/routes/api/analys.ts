import { env } from "cloudflare:workers";
import {
  chat,
  chatParamsFromRequest,
  EventType,
  type StreamChunk,
  toServerSentEventsResponse,
} from "@tanstack/ai";
import { createOpenRouterText } from "@tanstack/ai-openrouter";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  AnalysSchema,
  bygg,
  type Resultat,
  type SparatSvar,
  svarsnyckel,
} from "#/lib/analys";
import { fragor } from "#/lib/fragor";
import {
  hamtaKorning,
  type SparadKorning,
  sparaAnalys,
} from "#/lib/korning.server";
import { ANALYSMODELL, TJANST_ORDNING, TJANSTER } from "#/lib/modeller";

const BegaranSchema = z.object({ korningId: z.string().min(1).max(64) });

function systemprompt(korning: SparadKorning) {
  return [
    `Du hjälper företagaren bakom ${korning.foretag} (${korning.bransch} i ${korning.ort}) att förstå vad AI-tjänster svarar när kunder frågar.`,
    "Du får åtta svar från fyra tjänster på två kundfrågor, med källorna varje tjänst läste.",
    "Bedöm bara det som står i svaren. Hitta inte på uppgifter om företaget.",
    "Du skriver till ägaren av företaget, inte till en kund. Svaren du läser är skrivna för kunder, men din läsare är den som driver företaget och vill att AI-tjänsterna ska beskriva det rätt.",
    "De tre sakerna att göra är åtgärder ägaren själv gör, till exempel rättar en katalog, skriver en uppgift tydligt på hemsidan eller samlar omdömen. Varje sak pekar på ett svar eller en källa. Inga råd till kunder och inga allmänna råd som passar alla företag.",
    "Ordna sakerna efter hur mycket de påverkar vad tjänsterna svarar om företaget, den viktigaste först.",
    "Om underlaget har en kontroll av hemsidan och en kontroll har fallerat, kan en av sakerna bygga på den. Peka då på kontrollen med robots.txt, llms.txt, html eller strukturerad data i pekarPa.",
    "Skriv tjänsternas namn (ChatGPT, Gemini, Claude, Perplexity) i texten, aldrig svarsnycklarna. Nycklarna hör bara hemma i fälten nyckel, svar och pekarPa.",
    "Skriv på svenska, varmt och rakt. Använd inga tankstreck och sätt inget komma före och eller eller.",
  ].join("\n");
}

function kontrollunderlag(korning: SparadKorning) {
  if (!korning.las) {
    return "";
  }
  const rader = korning.las.kontroller.map(
    (k) => `- ${k.rubrik} (${k.status}): ${k.text}`
  );
  return `\n\n## Kontroll av hemsidan ${korning.las.url}\n\n${rader.join("\n")}`;
}

function underlag(korning: SparadKorning, svar: SparatSvar[]) {
  return svar
    .map((s) => {
      const kallor = s.kallor.map((k) => `- ${k.doman}: ${k.titel}`).join("\n");
      return [
        `## ${svarsnyckel(s.tjanst, s.fraga)} (${TJANSTER[s.tjanst].namn})`,
        `Fråga: ${fragor(korning)[s.fraga]}`,
        s.fel ? "Tjänsten svarade inte." : s.text,
        kallor ? `Källor:\n${kallor}` : "Inga källor.",
      ].join("\n\n");
    })
    .join("\n\n")
    .concat(kontrollunderlag(korning));
}

function resultatHandelse(resultat: Resultat): StreamChunk {
  return {
    type: EventType.CUSTOM,
    name: "resultat",
    value: resultat,
    timestamp: Date.now(),
  };
}

// Spelar upp en analys som redan är sparad, utan nytt modellanrop.
// biome-ignore lint/suspicious/useAwait: SSE-svaret kräver en asynkron ström.
async function* sparad(resultat: Resultat, threadId: string, runId: string) {
  yield {
    type: EventType.RUN_STARTED,
    threadId,
    runId,
    timestamp: Date.now(),
  } satisfies StreamChunk;
  yield resultatHandelse(resultat);
  yield {
    type: EventType.RUN_FINISHED,
    threadId,
    runId,
    timestamp: Date.now(),
  } satisfies StreamChunk;
}

// Lägger till det beräknade resultatet och sparar det när analysen är klar.
async function* medResultat(
  strom: AsyncIterable<StreamChunk>,
  korningId: string,
  svar: SparatSvar[]
) {
  for await (const del of strom) {
    if (
      del.type === EventType.CUSTOM &&
      del.name === "structured-output.complete"
    ) {
      const tolkad = AnalysSchema.safeParse(
        (del.value as { object: unknown }).object
      );
      if (tolkad.success) {
        const resultat = bygg(tolkad.data, svar);
        await sparaAnalys(korningId, resultat);
        yield resultatHandelse(resultat);
      }
    }
    yield del;
  }
}

// Analysen av de åtta sparade svaren (PLAN.md avsnitt 5.4). Den läser svaren ur
// D1, så klienten kan inte skicka in egen text att analysera.
export const Route = createFileRoute("/api/analys")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { threadId, runId, forwardedProps } =
          await chatParamsFromRequest(request);
        const begaran = BegaranSchema.safeParse(forwardedProps);
        if (!begaran.success) {
          return Response.json({ fel: "Ogiltig fråga" }, { status: 400 });
        }
        const korning = await hamtaKorning(begaran.data.korningId);
        if (!korning) {
          return Response.json(
            { fel: "Körningen finns inte" },
            { status: 404 }
          );
        }
        if (korning.analys) {
          return toServerSentEventsResponse(
            sparad(korning.analys, threadId, runId)
          );
        }
        const svar = TJANST_ORDNING.flatMap((tjanst) =>
          ([0, 1] as const).flatMap((fraga) => {
            const s = korning.svar[svarsnyckel(tjanst, fraga)];
            return s ? [s] : [];
          })
        );
        if (svar.length < TJANST_ORDNING.length * 2) {
          return Response.json(
            { fel: "Alla svar är inte klara än" },
            { status: 409 }
          );
        }

        const abortController = new AbortController();
        const strom = chat({
          adapter: createOpenRouterText(ANALYSMODELL, env.OPENROUTER_API_KEY),
          threadId,
          abortController,
          systemPrompts: [systemprompt(korning)],
          messages: [{ role: "user", content: underlag(korning, svar) }],
          outputSchema: AnalysSchema,
          stream: true,
          // Utan tak ber adaptern om modellens högsta antal tokens, och OpenRouter
          // vägrar när nyckelns kredit inte räcker till det värsta fallet.
          modelOptions: { maxCompletionTokens: 8000 },
        });

        return toServerSentEventsResponse(
          medResultat(strom, korning.id, svar),
          { abortController }
        );
      },
    },
  },
});

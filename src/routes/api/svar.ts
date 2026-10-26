import { env } from "cloudflare:workers";
import {
  chat,
  chatParamsFromRequest,
  EventType,
  type StreamChunk,
  toServerSentEventsResponse,
} from "@tanstack/ai";
import { createOpenRouterText } from "@tanstack/ai-openrouter";
import { webSearchTool } from "@tanstack/ai-openrouter/tools";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { type SparatSvar, svarsnyckel } from "#/lib/analys";
import { fragor, type Kalla } from "#/lib/fragor";
import { kallFetcher, medKallor } from "#/lib/kallor.server";
import { hamtaKorning, sparaSvar } from "#/lib/korning.server";
import { TJANST_ORDNING, TJANSTER } from "#/lib/modeller";

const BegaranSchema = z.object({
  korningId: z.string().min(1).max(64),
  tjanst: z.enum(TJANST_ORDNING),
  fraga: z.union([z.literal(0), z.literal(1)]),
});

// Sparar svaret, källorna och kostnaden innan strömmen avslutas, så att
// analysen kan läsa dem ur D1.
async function* medSparning(
  strom: AsyncIterable<StreamChunk>,
  spara: (svar: Omit<SparatSvar, "tjanst" | "fraga">) => Promise<void>
) {
  let text = "";
  let kallor: Kalla[] = [];
  for await (const del of strom) {
    if (del.type === EventType.TEXT_MESSAGE_CONTENT) {
      text += del.delta;
    } else if (del.type === EventType.CUSTOM && del.name === "kallor") {
      kallor = del.value as Kalla[];
    } else if (del.type === EventType.RUN_FINISHED) {
      const kostnad = (del.usage as { cost?: number } | undefined)?.cost;
      await spara({ text, kallor, kostnad: kostnad ?? null, fel: false });
    } else if (del.type === EventType.RUN_ERROR) {
      await spara({ text, kallor, kostnad: null, fel: true });
    }
    yield del;
  }
}

// En av de åtta strömmarna: en tjänst och en fråga i en sparad körning. Frågan
// byggs här ur körningen i D1, så att endpointen bara kan ställa de två kundfrågorna.
export const Route = createFileRoute("/api/svar")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { threadId, forwardedProps } =
          await chatParamsFromRequest(request);
        const begaran = BegaranSchema.safeParse(forwardedProps);
        if (!begaran.success) {
          return Response.json({ fel: "Ogiltig fråga" }, { status: 400 });
        }
        const { korningId, tjanst, fraga } = begaran.data;
        const korning = await hamtaKorning(korningId);
        if (!korning) {
          return Response.json(
            { fel: "Körningen finns inte" },
            { status: 404 }
          );
        }
        const { modell, sok } = TJANSTER[tjanst];
        const { httpClient, kallor } = kallFetcher();
        const abortController = new AbortController();

        const strom = chat({
          adapter: createOpenRouterText(modell, env.OPENROUTER_API_KEY, {
            httpClient,
          }),
          messages: [{ role: "user", content: fragor(korning)[fraga] }],
          threadId,
          abortController,
          tools: sok
            ? [
                webSearchTool({
                  engine: "native",
                  userLocation: {
                    type: "approximate",
                    country: "SE",
                    city: korning.ort,
                  },
                }),
              ]
            : undefined,
        });

        return toServerSentEventsResponse(
          medSparning(
            medKallor(strom, kallor, tjanst === "perplexity"),
            (svar) =>
              sparaSvar(korningId, svarsnyckel(tjanst, fraga), {
                ...svar,
                tjanst,
                fraga,
              })
          ),
          { abortController }
        );
      },
    },
  },
});

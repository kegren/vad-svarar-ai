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
import { farAnropa, laggTillKostnad } from "#/lib/skydd.server";

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
      await laggTillKostnad(kostnad);
    } else if (del.type === EventType.RUN_ERROR) {
      await spara({ text, kallor, kostnad: null, fel: true });
    }
    yield del;
  }
}

// Spelar upp ett svar som redan är sparat, utan nytt modellanrop. Det händer när
// sidan laddas om under en körning.
// biome-ignore lint/suspicious/useAwait: SSE-svaret kräver en asynkron ström.
async function* sparat(svar: SparatSvar, threadId: string, runId: string) {
  const messageId = `${runId}-svar`;
  const tid = Date.now();
  yield {
    type: EventType.RUN_STARTED,
    threadId,
    runId,
    timestamp: tid,
  } satisfies StreamChunk;
  yield {
    type: EventType.TEXT_MESSAGE_START,
    messageId,
    role: "assistant",
    timestamp: tid,
  } satisfies StreamChunk;
  yield {
    type: EventType.TEXT_MESSAGE_CONTENT,
    messageId,
    delta: svar.text,
    timestamp: tid,
  } satisfies StreamChunk;
  yield {
    type: EventType.TEXT_MESSAGE_END,
    messageId,
    timestamp: tid,
  } satisfies StreamChunk;
  yield {
    type: EventType.CUSTOM,
    name: "kallor",
    value: svar.kallor,
    timestamp: tid,
  } satisfies StreamChunk;
  yield {
    type: EventType.RUN_FINISHED,
    threadId,
    runId,
    timestamp: tid,
  } satisfies StreamChunk;
}

// En av de åtta strömmarna: en tjänst och en fråga i en sparad körning. Frågan
// byggs här ur körningen i D1, så att endpointen bara kan ställa de två kundfrågorna.
export const Route = createFileRoute("/api/svar")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { threadId, runId, forwardedProps } =
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
        const tidigare = korning.svar[svarsnyckel(tjanst, fraga)];
        if (tidigare && !tidigare.fel) {
          return toServerSentEventsResponse(sparat(tidigare, threadId, runId));
        }
        // Taket för anrop per körning och tiden efter start, så att samma körning
        // inte kan anropas om och om igen.
        if (!(await farAnropa(korningId))) {
          return Response.json(
            { fel: "Körningen tar inte emot fler frågor" },
            { status: 429 }
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
          // Ett tak för svarets längd håller nere kostnaden och kreditbehovet.
          modelOptions: { maxCompletionTokens: 4000 },
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

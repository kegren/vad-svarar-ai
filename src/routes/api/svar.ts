import { env } from "cloudflare:workers";
import {
  chat,
  chatParamsFromRequest,
  toServerSentEventsResponse,
} from "@tanstack/ai";
import { createOpenRouterText } from "@tanstack/ai-openrouter";
import { webSearchTool } from "@tanstack/ai-openrouter/tools";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ForetagSchema, fragor } from "#/lib/fragor";
import { kallFetcher, medKallor } from "#/lib/kallor.server";
import { TJANST_ORDNING, TJANSTER } from "#/lib/modeller";

const BegaranSchema = ForetagSchema.extend({
  tjanst: z.enum(TJANST_ORDNING),
  fraga: z.union([z.literal(0), z.literal(1)]),
});

// En av de åtta strömmarna: en tjänst och en fråga. Frågan byggs här ur fälten,
// så att endpointen bara kan ställa de två kundfrågorna.
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
        const { tjanst, fraga, ...foretag } = begaran.data;
        const { modell, sok } = TJANSTER[tjanst];
        const { httpClient, kallor } = kallFetcher();
        const abortController = new AbortController();

        const strom = chat({
          adapter: createOpenRouterText(modell, env.OPENROUTER_API_KEY, {
            httpClient,
          }),
          messages: [{ role: "user", content: fragor(foretag)[fraga] }],
          threadId,
          abortController,
          tools: sok
            ? [
                webSearchTool({
                  engine: "native",
                  userLocation: {
                    type: "approximate",
                    country: "SE",
                    city: foretag.ort,
                  },
                }),
              ]
            : undefined,
        });

        return toServerSentEventsResponse(
          medKallor(strom, kallor, tjanst === "perplexity"),
          { abortController }
        );
      },
    },
  },
});

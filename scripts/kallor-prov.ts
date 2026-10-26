// Fas 1: visar att källorna går att få fram trots att @openrouter/sdk rensar
// bort `annotations`. Spelar upp sparade SSE-svar från scripts/verifiera.ts,
// så inget anrop går till OpenRouter.
// Kör med `bun scripts/kallor-prov.ts .verifiera/<stamp>-ravara.json`.

import { readFileSync } from "node:fs";
import { HTTPClient } from "@openrouter/sdk";
import { chat, EventType, type StreamChunk } from "@tanstack/ai";
import { createOpenRouterText } from "@tanstack/ai-openrouter";

type Kalla = { url: string; titel: string };

type Ravara = { begaran: { model: string; tools?: unknown }; sse: string };

// Läser `annotations` ur rå SSE medan strömmen går vidare oförändrad till SDK:n.
function kallFetcher(sparat: string, kallor: Map<string, Kalla>) {
  return new HTTPClient({
    fetcher: async () => {
      const svar = new Response(sparat, {
        headers: { "content-type": "text/event-stream" },
      });
      const [tillSdk, tillOss] = (svar.body as ReadableStream).tee();
      (async () => {
        const text = await new Response(tillOss).text();
        for (const rad of text.split("\n")) {
          if (!rad.startsWith("data: {")) {
            continue;
          }
          const del = JSON.parse(rad.slice(6));
          for (const val of del.choices ?? []) {
            for (const a of val.delta?.annotations ?? []) {
              const u = a.url_citation;
              if (u?.url && !kallor.has(u.url)) {
                kallor.set(u.url, { url: u.url, titel: u.title ?? u.url });
              }
            }
          }
        }
      })();
      return new Response(tillSdk, svar);
    },
  });
}

// Lägger in källorna som en CUSTOM-händelse före RUN_FINISHED.
async function* medKallor(
  strom: AsyncIterable<StreamChunk>,
  kallor: Map<string, Kalla>
) {
  for await (const del of strom) {
    if (del.type === EventType.RUN_FINISHED) {
      yield {
        type: EventType.CUSTOM,
        name: "kallor",
        value: [...kallor.values()],
        timestamp: Date.now(),
      } satisfies StreamChunk;
    }
    yield del;
  }
}

const ravaror: Record<string, Ravara> = JSON.parse(
  readFileSync(process.argv[2] ?? "", "utf8")
);

for (const [nyckel, post] of Object.entries(ravaror)) {
  if (!(post.begaran.tools || nyckel.startsWith("perplexity"))) {
    continue;
  }
  const kallor = new Map<string, Kalla>();
  const adapter = createOpenRouterText(
    post.begaran.model as "perplexity/sonar",
    "uppspelning",
    { httpClient: kallFetcher(post.sse, kallor) }
  );
  const strom = chat({
    adapter,
    messages: [{ role: "user", content: "uppspelning" }],
    threadId: nyckel,
  });
  let tecken = 0;
  for await (const del of medKallor(strom, kallor)) {
    if (del.type === EventType.TEXT_MESSAGE_CONTENT) {
      tecken += del.delta.length;
    }
    if (del.type === EventType.CUSTOM && del.name === "kallor") {
      const lista = del.value as Kalla[];
      console.log(
        `${nyckel}: ${tecken} tecken text, ${lista.length} källor, först ${lista[0]?.titel}`
      );
    }
  }
}

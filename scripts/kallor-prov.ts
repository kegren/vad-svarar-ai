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

type Annotation = { url_citation?: { url?: string; title?: string } };

type Del = { choices?: { delta?: { annotations?: Annotation[] } }[] };

function kallorIDel(del: Del) {
  return (del.choices ?? []).flatMap((val) =>
    (val.delta?.annotations ?? []).flatMap(({ url_citation: u }) =>
      u?.url ? [{ url: u.url, titel: u.title ?? u.url }] : []
    )
  );
}

function kallorISse(text: string) {
  const kallor = new Map<string, Kalla>();
  for (const rad of text.split("\n")) {
    if (rad.startsWith("data: {")) {
      for (const kalla of kallorIDel(JSON.parse(rad.slice(6)))) {
        kallor.set(kalla.url, kalla);
      }
    }
  }
  return [...kallor.values()];
}

// Delar svaret: SDK:n får strömmen oförändrad och vi läser källorna ur den
// andra grenen. `kallor` blir klar när hela svaret är läst.
function kallFetcher(sparat: string) {
  let kallor: Promise<Kalla[]> = Promise.resolve([]);
  const httpClient = new HTTPClient({
    fetcher: () => {
      const svar = new Response(sparat, {
        headers: { "content-type": "text/event-stream" },
      });
      const [tillSdk, tillOss] = (svar.body as ReadableStream).tee();
      kallor = new Response(tillOss).text().then(kallorISse);
      return Promise.resolve(new Response(tillSdk, svar));
    },
  });
  return { httpClient, kallor: () => kallor };
}

// Lägger in källorna som en CUSTOM-händelse före RUN_FINISHED.
async function* medKallor(
  strom: AsyncIterable<StreamChunk>,
  kallor: () => Promise<Kalla[]>
) {
  for await (const del of strom) {
    if (del.type === EventType.RUN_FINISHED) {
      yield {
        type: EventType.CUSTOM,
        name: "kallor",
        value: await kallor(),
        timestamp: Date.now(),
      } satisfies StreamChunk;
    }
    yield del;
  }
}

async function spelaUpp(nyckel: string, post: Ravara) {
  const { httpClient, kallor } = kallFetcher(post.sse);
  const adapter = createOpenRouterText(
    post.begaran.model as "perplexity/sonar",
    "uppspelning",
    { httpClient }
  );
  const strom = chat({
    adapter,
    messages: [{ role: "user", content: "uppspelning" }],
    threadId: nyckel,
  });
  let tecken = 0;
  let lista: Kalla[] = [];
  for await (const del of medKallor(strom, kallor)) {
    if (del.type === EventType.TEXT_MESSAGE_CONTENT) {
      tecken += del.delta.length;
    }
    if (del.type === EventType.CUSTOM && del.name === "kallor") {
      lista = del.value as Kalla[];
    }
  }
  return `${nyckel}: ${tecken} tecken text, ${lista.length} källor, först ${lista[0]?.titel}`;
}

const ravaror: Record<string, Ravara> = JSON.parse(
  readFileSync(process.argv[2] ?? "", "utf8")
);

const rader = await Promise.all(
  Object.entries(ravaror)
    .filter(
      ([nyckel, post]) => post.begaran.tools || nyckel.startsWith("perplexity")
    )
    .map(([nyckel, post]) => spelaUpp(nyckel, post))
);
console.log(rader.join("\n"));

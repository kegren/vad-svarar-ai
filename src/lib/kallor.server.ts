import { HTTPClient } from "@openrouter/sdk";
import { EventType, type StreamChunk } from "@tanstack/ai";
import type { Kalla } from "./fragor";

// @openrouter/sdk 0.13.20 rensar bort `delta.annotations` när den parsar
// strömmen, så källorna når aldrig TanStack-adaptern (docs/verifierat.md punkt 2).
// Den här fetchern delar svaret: SDK:n får strömmen oförändrad och vi läser
// källorna ur den andra grenen.

type Annotation = { url_citation?: { url?: string; title?: string } };

type Del = { choices?: { delta?: { annotations?: Annotation[] } }[] };

type RaKalla = { url: string; titel: string };

const GEMINI_OMDIRIGERING = "vertexaisearch.cloud.google.com";
const SPARNINGSPARAMETRAR = /^utm_/u;
const HANVISNING = /\[(?<nummer>\d{1,3})\]/gu;
const WWW = /^www\./u;

function kallorIDel(del: Del): RaKalla[] {
  return (del.choices ?? []).flatMap((val) =>
    (val.delta?.annotations ?? []).flatMap(({ url_citation: u }) =>
      u?.url ? [{ url: u.url, titel: u.title ?? "" }] : []
    )
  );
}

function kallorISse(text: string) {
  const kallor = new Map<string, RaKalla>();
  for (const rad of text.split("\n")) {
    if (rad.startsWith("data: {")) {
      for (const kalla of kallorIDel(JSON.parse(rad.slice(6)))) {
        kallor.set(kalla.url, kalla);
      }
    }
  }
  return [...kallor.values()];
}

export function kallFetcher() {
  let kallor: Promise<RaKalla[]> = Promise.resolve([]);
  const httpClient = new HTTPClient({
    fetcher: async (input, init) => {
      const svar = await fetch(input, init);
      if (!svar.body) {
        return svar;
      }
      const [tillSdk, tillOss] = svar.body.tee();
      kallor = new Response(tillOss).text().then(kallorISse);
      return new Response(tillSdk, svar);
    },
  });
  return { httpClient, kallor: () => kallor };
}

// Gemini länkar via en omdirigering hos Google. Platsen i svaret är den riktiga adressen.
async function losUpp(url: string) {
  if (!url.includes(GEMINI_OMDIRIGERING)) {
    return url;
  }
  try {
    const svar = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(3000),
    });
    return svar.headers.get("location") ?? url;
  } catch {
    return url;
  }
}

function stada(url: string) {
  try {
    const adress = new URL(url);
    for (const nyckel of [...adress.searchParams.keys()]) {
      if (SPARNINGSPARAMETRAR.test(nyckel)) {
        adress.searchParams.delete(nyckel);
      }
    }
    return adress;
  } catch {
    return null;
  }
}

// Perplexity skickar alla sökträffar. Behåll bara dem som texten hänvisar till med [n].
function hanvisade(text: string, kallor: RaKalla[]) {
  const nummer = new Set(
    [...text.matchAll(HANVISNING)].map((m) => Number(m.groups?.nummer))
  );
  return kallor.filter((_, i) => nummer.has(i + 1));
}

export async function forbered(
  raa: RaKalla[],
  text: string,
  baraHanvisade: boolean
): Promise<Kalla[]> {
  const urval = baraHanvisade ? hanvisade(text, raa) : raa;
  const losta = await Promise.all(
    urval.map(async (kalla) => ({ ...kalla, url: await losUpp(kalla.url) }))
  );
  const unika = new Map<string, Kalla>();
  for (const kalla of losta) {
    const adress = stada(kalla.url);
    if (!adress) {
      continue;
    }
    const doman = adress.hostname.replace(WWW, "");
    const url = adress.toString();
    if (!unika.has(url)) {
      unika.set(url, {
        url,
        doman,
        titel: kalla.titel && kalla.titel !== doman ? kalla.titel : doman,
      });
    }
  }
  return [...unika.values()];
}

// Lägger in källorna som en CUSTOM-händelse före RUN_FINISHED. Läsningen av
// den andra grenen måste vara klar, så omslaget väntar in den där.
export async function* medKallor(
  strom: AsyncIterable<StreamChunk>,
  kallor: () => Promise<RaKalla[]>,
  baraHanvisade: boolean
) {
  let text = "";
  for await (const del of strom) {
    if (del.type === EventType.TEXT_MESSAGE_CONTENT) {
      text += del.delta;
    }
    if (del.type === EventType.RUN_FINISHED) {
      yield {
        type: EventType.CUSTOM,
        name: "kallor",
        value: await forbered(await kallor(), text, baraHanvisade),
        timestamp: Date.now(),
      } satisfies StreamChunk;
    }
    yield del;
  }
}

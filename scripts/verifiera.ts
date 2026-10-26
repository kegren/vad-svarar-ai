// Fas 1: prövar avsnitt 8 i PLAN.md mot OpenRouter med en riktig körning.
// Kör med `bun scripts/verifiera.ts "<företag>" "<bransch>" "<ort>"`.
// Nyckeln läses från .dev.vars. Råa anrop och svar sparas i .verifiera/.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chat } from "@tanstack/ai";
import { openRouterText } from "@tanstack/ai-openrouter";
import { webSearchTool } from "@tanstack/ai-openrouter/tools";
import { z } from "zod";

const UT = ".verifiera";
const GENERATION_ID = /"id":"(?<id>gen-[^"]+)"/u;
const TJANSTER = {
  chatgpt: "openai/gpt-6-luna",
  gemini: "google/gemini-3.1-flash-lite",
  claude: "anthropic/claude-haiku-5.5",
  perplexity: "perplexity/sonar",
} as const;
const ANALYS = "anthropic/claude-haiku-5.5";

type Tjanst = keyof typeof TJANSTER;

type Ravara = {
  url: string;
  begaran: unknown;
  sse: string;
};

const [foretag = "kemero", bransch = "webbyrå", ort = "Västerås"] =
  process.argv.slice(2);

for (const rad of readFileSync(".dev.vars", "utf8").split("\n")) {
  const [nyckel, ...varde] = rad.split("=");
  if (nyckel?.trim()) {
    process.env[nyckel.trim()] = varde.join("=").trim();
  }
}

// Spara varje anrop till OpenRouter och hela SSE-strömmen tillbaka, så att
// vi ser vad adaptern skickar och vad som finns i svaret som den inte lämnar vidare.
const ravaror = new Map<string, Ravara>();
const lasningar: Promise<void>[] = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const begaran = input instanceof Request ? input : new Request(input, init);
  const kropp = await begaran.clone().text();
  const svar = await originalFetch(begaran);
  if (!begaran.url.includes("openrouter.ai")) {
    return svar;
  }
  const json = kropp ? JSON.parse(kropp) : null;
  const post: Ravara = { url: begaran.url, begaran: json, sse: "" };
  ravaror.set(`${json?.model ?? "okand"}#${ravaror.size}`, post);
  if (!svar.body) {
    return svar;
  }
  const [a, b] = svar.body.tee();
  lasningar.push(
    new Response(b).text().then((text) => {
      post.sse = text;
    })
  );
  return new Response(a, svar);
}) as typeof fetch;

const fragor = [
  `Jag behöver en ${bransch} i ${ort}. Vilka rekommenderar du och varför?`,
  `Vad vet du om ${foretag} i ${ort}? Vad säger kunderna?`,
];

type Svar = {
  tjanst: Tjanst;
  modell: string;
  fraga: string;
  text: string;
  handelser: Record<string, number>;
  kostnad?: number;
  tokens?: unknown;
  fel?: string;
  sekunder: number;
};

async function fraga(tjanst: Tjanst, text: string, index: number) {
  const modell = TJANSTER[tjanst];
  const start = Date.now();
  const svar: Svar = {
    tjanst,
    modell,
    fraga: text,
    text: "",
    handelser: {},
    sekunder: 0,
  };
  const strom = chat({
    adapter: openRouterText(modell),
    messages: [{ role: "user", content: text }],
    threadId: `verifiera-${tjanst}-${index}`,
    tools:
      tjanst === "perplexity"
        ? undefined
        : [
            webSearchTool({
              engine: "native",
              maxResults: 5,
              userLocation: { type: "approximate", country: "SE", city: ort },
            }),
          ],
  });
  for await (const del of strom) {
    svar.handelser[del.type] = (svar.handelser[del.type] ?? 0) + 1;
    if (del.type === "TEXT_MESSAGE_CONTENT") {
      svar.text += del.delta;
    }
    if (del.type === "RUN_FINISHED" && del.usage) {
      svar.tokens = del.usage;
      svar.kostnad = (del.usage as { cost?: number }).cost;
    }
    if (del.type === "RUN_ERROR") {
      svar.fel = del.message;
    }
  }
  svar.sekunder = (Date.now() - start) / 1000;
  return svar;
}

const AnalysSchema = z.object({
  namns: z.array(
    z.object({
      svar: z.number().meta({ description: "Svarets nummer, från 1" }),
      namns: z.boolean(),
      plats: z.number().nullable().meta({
        description: "Platsen i listan när företaget nämns i en lista",
      }),
    })
  ),
  konkurrenter: z.array(z.object({ namn: z.string(), antal: z.number() })),
  pastaenden: z.array(
    z.object({
      text: z.string(),
      kalla: z.string().nullable(),
      kanVaraFel: z.boolean(),
    })
  ),
  attGora: z
    .array(
      z.object({
        text: z.string().meta({
          description:
            "Något företagaren själv kan göra, inte ett råd till kunden",
        }),
        grund: z.string().meta({
          description: "Svaret, källan eller kontrollen som saken bygger på",
        }),
      })
    )
    .meta({ description: "Exakt tre saker, de viktigaste först" }),
});

const sparat: Record<string, unknown> = { foretag, bransch, ort };
const stamp = new Date().toISOString().replace(/[:.]/gu, "-");

function spara() {
  writeFileSync(`${UT}/${stamp}-svar.json`, JSON.stringify(sparat, null, 2));
  writeFileSync(
    `${UT}/${stamp}-ravara.json`,
    JSON.stringify(Object.fromEntries(ravaror), null, 2)
  );
}

// OpenRouters generation-post säger vilken leverantör som svarade, hur många
// sökningar som gjordes och vad anropet kostade.
async function hamtaGenerationer() {
  const ids = [...ravaror.values()].flatMap((post) => {
    const id = post.sse.match(GENERATION_ID)?.groups?.id;
    return id ? [id] : [];
  });
  await new Promise((resolve) => setTimeout(resolve, 5000));
  return Promise.all(
    ids.map(async (id) => {
      const svar = await originalFetch(
        `https://openrouter.ai/api/v1/generation?id=${id}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          },
        }
      );
      return { id, post: (await svar.json()) as unknown };
    })
  );
}

async function main() {
  mkdirSync(UT, { recursive: true });
  const tjanster = Object.keys(TJANSTER) as Tjanst[];
  const start = Date.now();
  const svar = await Promise.all(
    tjanster.flatMap((tjanst) =>
      fragor.map((text, index) => fraga(tjanst, text, index))
    )
  );
  sparat.svarSekunder = (Date.now() - start) / 1000;
  sparat.svar = svar;
  await Promise.all(lasningar);
  spara();

  const analysStart = Date.now();
  try {
    sparat.analys = await chat({
      adapter: openRouterText(ANALYS),
      threadId: "verifiera-analys",
      systemPrompts: [
        `Du hjälper företagaren bakom ${foretag} (${bransch}, ${ort}) att förstå vad AI-tjänster svarar när kunder frågar. Svara på svenska. Sakerna att göra riktar sig till företagaren och ska peka på ett svar, en källa eller en kontroll, aldrig allmänna råd.`,
      ],
      messages: [
        {
          role: "user",
          content: svar
            .map(
              (s, i) =>
                `## Svar ${i + 1}: ${s.tjanst}\nFråga: ${s.fraga}\n\n${s.text}`
            )
            .join("\n\n"),
        },
      ],
      outputSchema: AnalysSchema,
    });
  } catch (fel) {
    sparat.analysFel = String(fel);
  }
  sparat.analysSekunder = (Date.now() - analysStart) / 1000;
  await Promise.all(lasningar);
  sparat.generationer = await hamtaGenerationer();
  spara();
  console.log(`${UT}/${stamp}`);
}

await main();

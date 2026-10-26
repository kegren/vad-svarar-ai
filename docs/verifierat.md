# Verifierat i fas 1

26 oktober 2026. Prövat mot OpenRouter med `@tanstack/ai` 1.0.0,
`@tanstack/ai-openrouter` 1.0.0 och `@openrouter/sdk` 0.13.20.

Provkörningen är en hel körning enligt PLAN.md avsnitt 5: fyra tjänster gånger två
frågor och en analys med `outputSchema`. Provföretaget är kemero, webbyrå i Västerås.
Skriptet är `scripts/verifiera.ts`. Det sparar råa anrop och SSE-svar i
`.verifiera/`, som inte committas.

## Sammanfattning

| Punkt i avsnitt 8 | Utfall |
|---|---|
| 1. `webSearchTool({ engine: "native" })` | Fungerar. Alla tre modellerna med verktyg körde leverantörens egen sökning. |
| 2. Var källorna hamnar | Finns i svaret från OpenRouter men **når inte strömmen**. Går att lösa, se nedan. |
| 3. `outputSchema` och verktyg i samma anrop | Stöds för de tre modellerna med verktyg, inte för Sonar. Analysen som eget anrop fungerar. |
| 4. Modell-ID:n | Alla åtta finns och priserna stämmer med avsnitt 2. |
| 5. Egen sökning med de billiga modellerna | Ja för GPT-6 Luna, Gemini 3.1 Flash Lite och Claude Haiku 5.5. Ingen faller tillbaka på Exa. |
| 6. Perplexity Sonar utan `tools` | Fungerar. Inga verktyg skickas och svaret har källor. |
| Kostnad per körning | **0,176 dollar**, ungefär 1,8 till 1,9 kr. Två körningar kostade exakt lika mycket. |

## 1. Webbsökningens engine

- `webSearchTool()` i `@tanstack/ai-openrouter/tools` tar OpenRouters `WebSearchConfig`.
  `engine` är `"auto" | "native" | "exa" | "parallel" | "firecrawl" | "perplexity"`.
- Adaptern skickar verktyget som det ska:
  `{"type":"openrouter:web_search","parameters":{"engine":"native","max_results":5,"user_location":{...}}}`.
- `maxResults` gäller bara Exa, Parallel, Firecrawl och Perplexity och ignoreras vid
  egen sökning. `userLocation` med land SE och ort går att skicka med.

## 2. Var källorna hamnar

**Problemet.** Alla fyra modellerna skickar källorna som `annotations` med
`type: "url_citation"` i `choices[0].delta` i SSE-strömmen från OpenRouter. Perplexity
lägger dem också där och inte i ett eget `citations`-fält. Men `@openrouter/sdk`
0.13.20 parsar varje del med ett zod-schema (`ChatStreamDelta$inboundSchema`) som
saknar `annotations` och zod rensar bort okända fält. Källorna försvinner alltså
redan i SDK:n, innan TanStack-adaptern ser delen. Ingen händelse i strömmen bär dem.

**Lösningen, prövad.** Adapterns konfiguration skickas rakt in i SDK:n, så den tar
`httpClient: new HTTPClient({ fetcher })`. En egen `fetcher` delar svaret med
`body.tee()`: SDK:n får strömmen oförändrad och vi läser `annotations` ur den andra
grenen. Sedan läggs källorna in som en `CUSTOM`-händelse (`name: "kallor"`) före
`RUN_FINISHED` och klienten tar emot dem med `onCustomEvent` på `useChat`.
Läsningen av den andra grenen måste vara klar innan händelsen skickas, så
omslaget väntar in den vid `RUN_FINISHED`.
`scripts/kallor-prov.ts` spelar upp de sparade svaren genom den vägen: alla åtta svar
får sina källor och texten är oförändrad. `@openrouter/sdk` är nu ett direkt
beroende, låst till 0.13.20 som adaptern använder. Byter adaptern SDK-version måste
låsningen följa med, och om SDK:n börjar släppa igenom `annotations` kan omvägen tas bort.

**Källorna per tjänst i provkörningen:**

| Tjänst | Fråga 1 (rekommendationer) | Fråga 2 (om kemero) | Att tänka på |
|---|---|---|---|
| ChatGPT | 5 källor | 3 källor | Länkarna har `?utm_source=openai`, som bör tas bort i visningen. |
| Gemini | 6 källor | 5 källor | Länkarna går via `vertexaisearch.cloud.google.com`. Titeln är domänen. En `fetch` utan att följa omdirigeringen ger den riktiga adressen (302). |
| Claude | 5 källor | 2 källor | Rena länkar med titel och ett citat. |
| Perplexity | 20 källor | 48 källor | Skickar alla sökträffar, även sådana som inte gäller frågan (restauranger, AliExpress). Texten hänvisar med `[n]`, så vi bör visa bara de källor som texten hänvisar till. |

## 3. `outputSchema` och verktyg

- `OPENROUTER_COMBINED_TOOLS_AND_SCHEMA_MODELS` innehåller `openai/gpt-6-luna`,
  `google/gemini-3.1-flash-lite` och `anthropic/claude-haiku-5.5`, men inte
  `perplexity/sonar`.
- Analysen kördes som eget anrop med Haiku och ett zod-schema. Den skickas med
  `response_format` och gav ett giltigt objekt på 16 sekunder.
- **Längdkrav följs inte.** Med `.length(3)` på de tre sakerna att göra kom fem saker och
  valideringen föll. Längdkrav följer inte med till leverantörens schemaläge. Lösningen
  är att be om tre i beskrivningen och ta de tre första i koden.
- **Prompten styr vem råden gäller.** Utan tydlig systemprompt skrev analysen råd till
  en kund som ska välja byrå. Med en systemprompt som säger att sakerna gäller
  företagaren och ska peka på ett svar, en källa eller en kontroll blev alla tre
  konkreta och kopplade till svaren.
- **"Nämns" behöver en definition.** Analysen räknade Perplexitys svar på fråga 2 som att
  kemero nämns, fast svaret sa att det inte hittade företaget. Räknaren i gränssnittet
  bör skilja på att namnet står i texten och att tjänsten faktiskt känner till företaget.

## 4. Modell-ID:n och priser

Hämtat från `openrouter.ai/api/v1/models` den 26 oktober 2026. Alla ID:n finns också
i adapterns `model-meta`.

| Modell | In / ut per miljon tokens | Sökning | `tools` |
|---|---|---|---|
| `openai/gpt-6-luna` | 0,10 / 0,50 dollar | 0,01 dollar | ja |
| `google/gemini-3.1-flash-lite` | 0,25 / 1,50 dollar | 0,014 dollar | ja |
| `anthropic/claude-haiku-5.5` | 0,10 / 0,50 dollar | 0,01 dollar | ja |
| `perplexity/sonar` | 1 / 1 dollar | 0,005 dollar per anrop | nej |
| `openai/gpt-6.1-sol` | 2 / 10 dollar | 0,01 dollar | ja |
| `google/gemini-3.8-flash` | 0,825 / 4,125 dollar | 0,014 dollar | ja |
| `anthropic/claude-sonnet-5.5` | 2 / 10 dollar | 0,01 dollar | ja |
| `perplexity/sonar-pro` | 3 / 15 dollar | 0,005 dollar per anrop | nej |

## 5. Egen sökning med de billiga modellerna

OpenRouters generation-post (`/api/v1/generation?id=...`) säger `web_search_engine`
för varje anrop. Antalet sökningar står i `usage.server_tool_use_details`.

| Svar | Leverantör | `web_search_engine` | Sökningar | Kostnad | Tid |
|---|---|---|---|---|---|
| ChatGPT, fråga 1 | OpenAI | native | 3 | 0,0330 dollar | 15,1 s |
| ChatGPT, fråga 2 | OpenAI | native | 2 | 0,0220 dollar | 12,3 s |
| Gemini, fråga 1 | Google | native | 2 | 0,0294 dollar | 6,5 s |
| Gemini, fråga 2 | Google | native | 3 | 0,0429 dollar | 3,6 s |
| Claude, fråga 1 | Claude Platform on AWS | native | 1 | 0,0121 dollar | 11,2 s |
| Claude, fråga 2 | Claude Platform on AWS | native | 2 | 0,0224 dollar | 8,1 s |
| Perplexity, fråga 1 | Perplexity | (söker själv) | | 0,0058 dollar | 5,9 s |
| Perplexity, fråga 2 | Perplexity | (söker själv) | | 0,0054 dollar | 8,6 s |
| Analysen | Azure | ingen sökning | | 0,0028 dollar | 16,1 s |

Inget anrop föll tillbaka på Exa.

## 6. Perplexity Sonar utan `tools`

- Begäran till Sonar har inget `tools`-fält. Adaptern lägger inte till något när
  `tools` utelämnas.
- Svaret har källor som `annotations` (20 och 48 stycken), med samma problem och samma
  lösning som i punkt 2.
- Sonar hittade inte kemero alls på fråga 2. Det är ett giltigt utfall för verktyget,
  men visar att tjänsterna skiljer sig mycket åt.

## Kostnad per körning

- **En körning: 0,1758 dollar,** alltså ungefär 1,8 till 1,9 kr vid 10 till 11 kr per
  dollar. Den andra körningen kostade exakt lika mycket. Nyckelns förbrukning efter
  båda: 0,3516 dollar.
- **Sökavgifterna är ungefär 90 procent:** 13 sökningar för de tre modellerna med
  verktyg (0,15 dollar) och två Sonar-anrop. Tokens kostar under 0,02 dollar.
- **Gemini är dyrast** trots lägst tokenpris, eftersom varje sökning kostar 0,014 dollar
  och den söker två till tre gånger per svar.
- **Dygnstaket på 100 kr** räcker till ungefär 53 körningar.
- `usage.cost` i `RUN_FINISHED` innehåller sökavgiften och stämmer med OpenRouters
  `total_cost`. Den räcker för att räkna dygnsbudgeten i D1 utan extra anrop.
- **Tiden:** de åtta svaren tog 15 sekunder parallellt, det långsammaste var ChatGPT.
  Analysen tog 16 sekunder till.

## Annat som upptäcktes

- **Kreditgränsen på nyckeln är 10 dollar,** inte 800 kr i månaden som i avsnitt 0 och 7.
  Det räcker till ungefär 57 körningar.
- **Nyckeln läses i Workern.** Startsidan visar "OpenRouter-nyckeln: läses" lokalt. Adaptern
  läser `process.env.OPENROUTER_API_KEY`, som Workers fyller i med `nodejs_compat`.
- **Intent.** `@tanstack/devtools-event-client` har ett eget gammalt `intent`-kommando
  som skuggar `@tanstack/intent` i `node_modules/.bin`. En `postinstall` pekar om det.
  `intent install` kräver en interaktiv terminal tills `intent.skills` finns i
  `package.json`, så listan skrevs för hand.
- **workers.dev.** Fas 0 i avsnitt 12 nämner "hello" på workers.dev. Det är inte gjort,
  eftersom det kräver `wrangler login` och en D1-databas i Kennys Cloudflare-konto.

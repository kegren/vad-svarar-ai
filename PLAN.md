# Vad svarar AI? Plan för överlämning

Version 3, 26 oktober 2026, med Kennys beslut samma dag. Skriven av Claude i
kemero-sessionen och överlämnad till en egen session. Kenny Damgren äger projektet och
godkänner domän, rubriker, push och deploy.

## 0. Kennys beslut (26 oktober 2026)

- **Namnet** är "Vad svarar AI?". Rubriken på startsidan är "Syns ditt företag när
  kunderna frågar AI?". **Domänen** bestäms senare.
- **Repot** blir publikt som `kegren/vad-svarar-ai` med MIT-licens, men **ingenting
  pushas under utvecklingen.** Git används bara lokalt. Skapa inget repo på GitHub och
  lägg inte till någon remote förrän Kenny säger till.
- **Verktyget är fristående och säljer inte,** men Kenny betalar för API-anropen. Därför
  ska det ge kemero affärsnytta på två ställen och inga andra:
  - Avsändarraden i foten: **"Byggt av Kenny Damgren (kegren.com) · kemero.se"**, med
    båda som länkar.
  - Under "Kan AI läsa din hemsida?" i resultatet står en diskret, hjälpsam länk: **"Vill
    du pröva hela hemsidan på tjugo punkter? Besiktiga den gratis på kemero.se"**. Den
    går till `https://kemero.se/besiktigad-hemsida`.
- **Budgeten:** 100 kr per dygn i D1 och ett kreditlimit på 800 kr i månaden på
  OpenRouter-nyckeln, så att verktyget inte kostar mer än Google Ads-kampanjen.
- **Billiga modeller i fas 1,** se avsnitt 2. Kenny utvärderar sedan om svaren är bra
  nog eller om dyrare modeller behövs.
- **Commit-meddelanden** skrivs på engelska och följer skillen caveman-commit, till
  exempel `feat(svar): stream four engines`. Varje commit slutar med
  Co-Authored-By-raden.

## 1. Tanken

**För vem:** svenska företagare, alla branscher och orter. Det är ett fristående, gratis
verktyg och ingen kemero-produkt. Det säljer inget. kemero syns bara på de två ställen
som står i avsnitt 0.

**Problemet det löser:** allt fler kunder frågar ChatGPT, Gemini, Claude eller Perplexity
i stället för att googla, till exempel "Vilken rörmokare i Västerås rekommenderar du?".
Företagaren vet inte vad AI:n svarar, om företaget nämns, vilka konkurrenter som
föreslås eller om något som sägs om företaget är fel. Det går inte att se i någon
statistik.

**Vad besökaren gör:** skriver företagsnamn, bransch och ort, och om de vill sin
hemsida. Sedan trycker de på en knapp.

**Vad besökaren ser:**
1. Fyra AI-tjänster får samma två kundfrågor samtidigt, med webbsökning, som en riktig
   kund skulle få: ChatGPT, Gemini, Claude och Perplexity.
2. Svaren strömmar in i fyra kort. Varje gång företagets namn dyker upp lyser det upp,
   och räknaren överst går upp, till exempel "Nämns i 3 av 8 svar".
3. Källorna som varje AI-tjänst använde står som länkar under svaret: Google-profiler,
   kataloger, hemsidor och artiklar.
4. Sammanfattningen:
   - var företaget nämns och på vilken plats
   - vilka konkurrenter som nämns och hur ofta
   - vad AI-tjänsterna säger om företaget, med de påståenden som kan vara fel markerade
     för företagaren att kontrollera
5. **Kan AI läsa din hemsida?** Fyra kontroller utan modell:
   - om robots.txt släpper in AI-tjänsternas robotar
   - om /llms.txt finns
   - om texten står i HTML:en från servern eller bara kommer med JavaScript
   - om det finns strukturerad data om företaget
6. **Tre saker att göra,** som följer av svaren, källorna och kontrollerna. Till exempel:
   "Två av tjänsterna hämtade uppgifter från eniro.se, där telefonnumret är gammalt."
   Bara sådant som går att peka på, aldrig allmänna råd.
7. **Ett resultatkort att dela,** med en egen länk och delningsbild.

**Vad det ger företagaren:** en bild av hur AI-tjänsterna beskriver företaget i dag,
vilka källor som styr det och vad som går att rätta. Det är gratis och kräver ingen
mejladress.

**Vad det ger Kenny:**
- **Ett arbetsprov** som visar kunnandet i praktiken: flera AI-modeller som strömmar
  parallellt, webbsökning, strukturerad analys och en upplevelse i toppklass byggd med
  TanStack Start 1.0 och TanStack AI 1.0.
- **Trafik från två håll.** Företagare kommer för svaret om sitt företag, utvecklare för
  tekniken och den öppna koden.
- **Avsändaren står som en rad:** "Byggt av Kenny Damgren (kegren.com) · kemero.se".
- **Affärsnytta för kemero:** länken till besiktningen under läsbarhetskontrollen, där
  företagaren redan har sett att hemsidan kan ha brister.

**Vad det inte är:** ingen rankning, inget betyg och inget löfte. AI-svar varierar
mellan körningar. Resultatet säger alltid vilka modeller som svarade, hur många frågor
som ställdes och när, och att svaren från samma tjänst kan bli andra nästa gång.

## 2. Modeller och kostnad i fas 1

Priserna kommer från openrouter.ai/api/v1/models, hämtade 26 oktober 2026. Kontrollera
dem igen samma dag som bygget börjar.

| Tjänst | Modell | In / ut per miljon tokens | Sökning |
|---|---|---|---|
| ChatGPT | `openai/gpt-6-luna` | 0,10 / 0,50 dollar | 0,01 dollar per sökning |
| Gemini | `google/gemini-3.1-flash-lite` | 0,25 / 1,50 dollar | 0,014 dollar per sökning |
| Claude | `anthropic/claude-haiku-5.5` | 0,10 / 0,50 dollar | 0,01 dollar per sökning |
| Perplexity | `perplexity/sonar` | 1 / 1 dollar | 0,005 dollar per anrop. Söker själv och tar inte emot `tools` |
| Analysen | `anthropic/claude-haiku-5.5` med `outputSchema` | 0,10 / 0,50 dollar | används inte |

- **Per körning:** åtta svar (fyra tjänster gånger två frågor) och en analys. Sökavgiften
  är den största posten, en till två sökningar per svar. Det blir ungefär 0,15 till 0,25
  dollar, alltså cirka 1,5 till 2,5 kronor per körning.
- **Dygnstaket på 100 kr** räcker då till ungefär 40 till 65 körningar.
- **Mät den verkliga kostnaden** efter de första tjugo körningarna och skriv in den i
  `docs/verifierat.md`.
- **Utvärderingen efter fas 2:** samma tio företag körs med de billiga modellerna och
  med de dyrare (`openai/gpt-6.1-sol`, `google/gemini-3.8-flash`,
  `anthropic/claude-sonnet-5.5`, `perplexity/sonar-pro`). Kenny jämför svaren och
  bestämmer.
- **Modellerna ska vara utbytbara** i en konfigurationsfil, `src/lib/modeller.ts`, så att
  bytet inte kräver att något annat skrivs om.

## 3. Fasta beslut

- **TanStack Start 1.x och TanStack AI 1.0.**
  - Start: `@tanstack/react-start`, 1.169 eller senare.
  - AI: `@tanstack/ai` 1.0.0.
- **OpenRouter-adaptern, `@tanstack/ai-openrouter` 1.0.0.** Den bygger på
  `@openrouter/sdk` och läser `OPENROUTER_API_KEY`. Kenny lägger in nyckeln.
  - Inga andra adaptrar.
  - Modellerna anges som `leverantör/modell`.
- **TanStack Intent ska finnas i projektet från start,** se avsnitt 4.
- **Cloudflare Workers med D1.**
- **kemero syns bara på två ställen:** avsändarraden och länken till besiktningen, se
  avsnitt 0.
- **Git bara lokalt.** Ingen remote och ingen push förrän Kenny säger till.

## 4. Uppsättning, i den här ordningen

1. **Skapa projektet** i den här mappen, `/Users/kegren/Code/projects/vad-svarar-ai`,
   där PLAN.md ligger.
   - Skapa det i en tillfällig undermapp med kommandot nedan och flytta upp filerna.
     Alternativt sätter du upp Start för hand enligt Cloudflares guide.
     ```bash
     npm create cloudflare@latest -- app --framework=tanstack-start
     ```
   - Kör `git init` och committa. Lägg inte till någon remote.
   - I `vite.config` står `cloudflare({ viteEnvironment: { name: "ssr" } })` först, före
     `tanstackStart()` och `react()`.
   - I `wrangler.jsonc` står `"main": "@tanstack/react-start/server-entry"` och
     `"compatibility_flags": ["nodejs_compat"]`.
   - Källa: developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/
2. **Installera paketen.**
   ```bash
   bun add @tanstack/ai @tanstack/ai-openrouter @tanstack/ai-react zod
   ```
   - Zod måste vara 4.2 eller senare.
3. **TanStack Intent.**
   ```bash
   bunx @tanstack/intent@latest install
   ```
   - Kommandot skriver ett `intent-skills`-block i `AGENTS.md`. Committa blocket.
   - Kör `bunx @tanstack/intent@latest hooks install` för Claude Code.
   - Kör `install` igen när ett paket med skills läggs till.
   - Läs skillsen innan koden skrivs:
     - `@tanstack/ai#ai-core`
     - `ai-core/adapter-configuration`
     - `ai-core/structured-outputs`
     - `ai-core/tool-calling`
     - `ai-core/chat-experience`
     - `@tanstack/react-start#react-start`
     - `@tanstack/start-client-core#start-core/server-functions`
     - `start-core/server-routes`
     - `start-core/deployment`
   - Källa: tanstack.com/intent/latest/docs/overview
4. **Hemligheter.**
   - Lokalt i `.dev.vars`, i produktion med `wrangler secret put OPENROUTER_API_KEY`.
   - D1 läses med `import { env } from "cloudflare:workers"`.
5. **Kodstil.** Bun, Biome via ultracite, `type` före `interface`. Commit-meddelanden på
   engelska i caveman-stil, till exempel `feat(svar): stream four engines`.

## 5. Flödet, tekniskt

1. **Formuläret.** Företagsnamn, bransch och ort krävs, hemsidan är valfri. En
   Turnstile-kontroll körs innan något annat.
2. **Frågorna.** Två frågor byggs ur fälten:
   - "Jag behöver en {bransch} i {ort}. Vilka rekommenderar du och varför?"
   - "Vad vet du om {företag} i {ort}? Vad säger kunderna?"
3. **Åtta strömmar,** fyra tjänster gånger två frågor.
   - Varje strömning är en egen `useChat` med ett eget `threadId`. Alla går mot
     server-routen `/api/svar` med `forwardedProps: { tjanst, fraga }`.
   - Servern kör:
     ```ts
     chat({ adapter: openRouterText(MODELL[tjanst]), tools: [webSearchTool({ engine: "native", maxResults: 5 })], threadId })
     ```
     `webSearchTool` kommer från `@tanstack/ai-openrouter/tools`.
   - Perplexity Sonar anropas utan `tools`, eftersom modellen söker själv. Kontrollera
     att adaptern inte skickar med något verktyg till den.
   - Servern svarar med `toServerSentEventsResponse(stream)`.
   - Gränssnittet visar två svar per kort, ett per fråga, som flikar eller under
     varandra.
4. **Analysen** startar när alla åtta svaren är klara.
   - `chat({ adapter: openRouterText("anthropic/claude-haiku-5.5"), outputSchema })`
     utan verktyg, med svaren och källorna som indata.
   - Schemat ger:
     - om företaget nämns, per svar och på vilken plats
     - vilka konkurrenter som nämns och hur många gånger
     - påståenden om företaget, med källan när den finns
     - de tre sakerna att göra, var och en kopplad till ett svar, en källa eller en
       kontroll
5. **Läsbarhetskontrollen** körs i en server-funktion med fetch, utan modell.
6. **Resultatsidan** (`/r/$id`):
   - Sparas i D1 och renderas på servern.
   - Har `noindex`.
   - Delningsbilden skapas på servern med Satori eller workers-og och visar "Nämns i 3
     av 8 AI-svar", företagsnamnet och datumet.

## 6. Datamodell (D1)

- `korning`:
  - `id`, `skapad`, `foretag`, `bransch`, `ort`, `hemsida`
  - `modeller_json`, `svar_json`, `kallor_json`, `analys_json`, `las_json`
  - `ip_hash`, med salt
- `budget`: `dag`, `kronor`. Taket är 100 kr per dygn och står i en konstant.
- Allt raderas efter 30 dagar med en cron-trigger.

## 7. Kostnad och skydd

Modellerna, priserna och uppskattningen per körning står i avsnitt 2. I korthet blir det
ungefär 1,5 till 2,5 kronor per körning med de billiga modellerna, och dygnstaket på 100
kr räcker till ungefär 40 till 65 körningar.

**Skydden:**
- Turnstile på formuläret.
- Tre körningar per IP-adress och dygn.
- Samma företag, bransch och ort inom ett dygn visar det sparade resultatet med datumet.
- Taket i `budget` stänger formuläret med "Dagens frågor är slut, prova i morgon".
- Kreditlimitet på OpenRouter-nyckeln, 800 kr i månaden, är den sista spärren. Kenny
  sätter det på openrouter.ai.

Mät den verkliga kostnaden per körning efter de första tjugo körningarna. Justera antal
frågor, modell eller tak efter det.

## 8. Måste verifieras först, i fas 1

1. **`webSearchTool({ engine: "native" })`.**
   - TanStacks docs visar bara `engine: "exa"`. Kontrollera typen i
     `@tanstack/ai-openrouter/tools`.
   - OpenRouter kallar verktyget `openrouter:web_search`, där engine `auto` betyder
     leverantörens egen sökning när den finns, annars Exa. Pluginen `web` och
     `:online` är avvecklade.
   - Kontrollera att alla fyra modellerna faktiskt kör sin egen sökning.
2. **Var källorna hamnar** i meddelandet för varje modell. De ska visas.
3. **Om `outputSchema` och verktyg fungerar i samma anrop.** Kontrollera
   `OPENROUTER_COMBINED_TOOLS_AND_SCHEMA_MODELS` från `@tanstack/ai-openrouter/model-meta`.
   Planen kör analysen som ett eget anrop, så det spelar mindre roll.
4. **Modell-ID:n** mot openrouter.ai/models samma dag som bygget börjar.
5. **Sökningen med de billiga modellerna.** Kontrollera att GPT-6 Luna, Gemini 3.1 Flash
   Lite och Claude Haiku 5.5 faktiskt kör leverantörens egen sökning via OpenRouter och
   inte faller tillbaka på Exa.
6. **Perplexity Sonar utan `tools`.** Kontrollera att svaret får med källor.

Skriv ned utfallet i `docs/verifierat.md` med datum.

## 9. Breaking changes i AI 1.0

- `threadId` krävs överallt.
- `body` heter `forwardedProps`.
- Inga färdiga UI-komponenter. Använd `useChat` eller `createChatHook`.
- Klient och server måste båda vara 1.0.

Källa: TanStack/ai `docs/migration/v1.md`.

## 10. Design: modern och interaktiv, i toppklass

**Läget är "Persuade", som impeccable kallar det:** besökaren ska fastna, prova och
dela. Designen är en egen värld. Den följer varken kegren.com eller kemero, men
avsändaren syns diskret i foten. Kör impeccable (`new-work`) innan första vyn byggs, och
spara riktningen i projektets `DESIGN.md`.

**Riktningen, "Svarsteatern":** en mörk scen där fyra AI-tjänster svarar i realtid.
Besökaren tittar på när svaren kommer, och spänningen ligger i om namnet dyker upp.

1. **Första skärmen.**
   - En lugn bakgrund i WebGL, till exempel React Bits *Silk*, *Aurora* eller *Threads*,
     i en egen dov färgton. Den laddas först efter första målningen och står stilla vid
     reducerad rörelse.
   - Rubriken kommer in med *Split Text* eller *Blur Text*.
   - Ett enda stort fält i pillerform för företagsnamnet. Bransch och ort kommer fram
     som chips när namnet är skrivet.
   - Knappen "Fråga AI" är magnetisk, med React Bits *Magnet*.
2. **Körningen.**
   - Fyra kort med *Spotlight Card*, där ljuset följer pekaren.
   - Varje kort har tjänstens namn i text, inga logotyper, och svaret strömmar in ord
     för ord.
   - När företagsnamnet kommer markeras det med ett glödande understreck och en kort
     gnista, *Click Spark*.
   - Räknaren överst ("Nämns i 0 av 8 svar") räknar upp med *Count Up*.
   - Källorna tonar in som chips med favicon, med *Animated List*.
   - Ingen yta är tom: varje kort visar vilken fråga som ställs och en pulserande
     markör tills första ordet kommer.
3. **Resultatet.**
   - Det stora talet.
   - Konkurrenterna som staplar som växer fram.
   - Citat ur svaren om företaget.
   - Läsbarhetskontrollen som en lista där bockarna ritas.
   - De tre sakerna att göra.
   - Ett resultatkort i glas, *Glass Surface*, med "Kopiera länk" och delningsbilden.
   - Under läsbarhetskontrollen står den diskreta länken från avsnitt 0 i dämpad text
     med en pil. Ingen knapp, ingen ram och ingen färg som skriker.
   - Foten har avsändarraden från avsnitt 0.
4. **Typografi.** En distinkt sans för rubriker och en neutral för text. Välj i
   impeccable. Rubrikerna ska vara stora och täta.
5. **Rörelsen har ett syfte.** Allt animerat säger något: väntan, träff, källa eller
   resultat. Ingen rörelse bara för att det ska röra sig.
6. **Krav som inte får brytas:**
   - Mobil först, eftersom de flesta kommer från sociala medier.
   - Helt användbar vid `prefers-reduced-motion`.
   - `aria-live` meddelar bara räknaren och när ett svar är klart, inte varje ord.
   - Snabb laddning: WebGL och tunga komponenter laddas först efter LCP.
   - Kontrasten klarar WCAG AA.

**React Bits.** Komponenterna installeras med den CLI som reactbits.dev anger, till
exempel via shadcn- eller jsrepo-registret, och anpassas efter projektets tokens.
Kontrollera namnen ovan mot reactbits.dev innan de används, eftersom katalogen ändras
ofta. Använd högst en tung bakgrund per sida.

## 11. Text

- **Svenska, varm och rak.** Säg vad som händer, inga punch lines.
- **Inga tankstreck och inget komma före "och" eller "eller".**
- **Ord.** Skriv "AI-tjänster" i allmänhet och tjänsternas egna namn där de svarar.
  Skriv aldrig att verktyget "ser vad ChatGPT säger till dina kunder". Det visar vad
  tjänsterna svarar på de här frågorna i dag.
- **Rubriker** godkänns av Kenny. Startsidans rubrik är redan godkänd: "Syns ditt
  företag när kunderna frågar AI?".

## 12. Faser och när de är klara

| Fas | Klart när |
|---|---|
| 0. Uppsättning | Intent installerat och blocket committat, "hello" på workers.dev, OpenRouter-nyckeln läses |
| 1. Verifiering | Avsnitt 8 prövat, utfallet nedskrivet och kostnaden för en körning mätt |
| 2. Strömmarna | Åtta svar strömmar lokalt med källor och företagsnamnet markerat |
| 3. Analysen | Sammanfattningen och de tre sakerna att göra visas och sparas |
| 4. Läsbarheten | De fyra kontrollerna fungerar, med kemero.se som rätt facit |
| 5. Designen | Svarsteatern byggd med impeccable och React Bits, kontrollerad i mobil och vid reducerad rörelse |
| 6. Delning och skydd | `/r/$id`, delningsbilden, Turnstile, IP-taket, de sparade svaren och dygnsbudgeten |
| 7. Lansering | Kennys ja till domän, rubriker, push och deploy |

## 13. Lanseringen dag ett

- **kegren.com:**
  - Projektet under Selected och Utvalt.
  - En anteckning på engelska, "How I built it with TanStack Start 1.0 and TanStack AI
    1.0", för utvecklare.
  - En anteckning på svenska för företagare.
- **Utvecklare:**
  - TanStacks Discord, i kanalen för visade projekt.
  - X och r/reactjs.
  - Repot öppet från första dagen.
- **Företagare:**
  - Ett inlägg på Kennys LinkedIn och Facebook, med ett exempel där företaget har sagt ja
    till att visas, eller utan namn.
- **Mätningen.** Umami på domänen, med egna händelser:
  - `korning_startad`
  - `korning_klar`
  - `resultat_delat`
  - `klick_kegren`

## 14. Uppdrag till nästa agent

> Bygg "Vad svarar AI?" enligt PLAN.md i den här mappen, fas för fas. Kennys beslut står
> i avsnitt 0 och går före allt annat i planen. Börja med fas 0 och fas 1 och stanna och
> rapportera utfallet av avsnitt 8 och kostnaden per körning innan fas 2. Läs TanStack
> Intents skills innan du skriver kod för Start eller AI. Använd bara OpenRouter-adaptern
> och de billiga modellerna i avsnitt 2. Designen görs med skillen impeccable och React
> Bits enligt avsnitt 10. Git bara lokalt: ingen remote, ingen push. Deploya bara till en
> workers.dev-adress för prov, aldrig till egen domän utan Kennys ja. Svara Kenny på
> svenska. Commit-meddelanden på engelska enligt skillen caveman-commit.

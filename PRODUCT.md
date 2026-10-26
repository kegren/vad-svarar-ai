# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Svenska företagare i alla branscher och på alla orter. De flesta kommer från ett
inlägg i sociala medier och öppnar sidan i mobilen. De vill veta vad ChatGPT, Gemini,
Claude och Perplexity svarar när en kund frågar efter ett företag som deras, och om
deras eget företag kommer med. De har sällan sett AI-svar om sitt företag förut och
har inget sätt att se dem i någon statistik.

Utvecklare kommer också, för tekniken och den öppna koden, men företagarna går först.

## Product Purpose

Företagaren skriver företagsnamn, bransch och ort, och om de vill sin hemsida. Fyra
AI-tjänster får samma två kundfrågor med webbsökning. Svaren strömmar in medan
företagaren tittar. Sedan visar verktyget var företaget nämns, vilka konkurrenter som
nämns, vilka källor tjänsterna läste, vad som sägs om företaget och om AI kan läsa
hemsidan. Det slutar med tre saker att göra som pekar på ett svar, en källa eller en
kontroll.

Verktyget har lyckats när företagaren förstår hur tjänsterna beskriver företaget i dag
och vet vad som går att rätta.

## Positioning

Verktyget ställer riktiga kundfrågor till fyra tjänster med webbsökning och visar
svaren som de kommer, med källorna. Det är en körning som går att se, inte ett betyg.

## Operating Context

- Gratis, kräver ingen mejladress och säljer inget.
- Byggt av Kenny Damgren. Kenny betalar för anropen, med ett tak på 100 kr per dygn.
- Resultatet får en egen länk och en delningsbild, så att det går att dela vidare.
- Svaren tar ungefär 15 sekunder parallellt, och analysen ungefär 15 sekunder till.

## Capabilities and Constraints

- TanStack Start på Cloudflare Workers med D1. TanStack AI med OpenRouter-adaptern.
- Billiga modeller i fas 1 och 2 (se PLAN.md avsnitt 2). Modellerna står i
  `src/lib/modeller.ts`.
- AI-svar varierar mellan körningar. Resultatet säger alltid vilka modeller som
  svarade, vilka frågor som ställdes och när.
- Inget betyg, ingen rankning och inget löfte om placering.
- kemero syns bara på två ställen: avsändarraden i foten och en diskret länk till
  besiktningen under "Kan AI läsa din hemsida?" (PLAN.md avsnitt 0).

## Brand Commitments

- Namnet är "Vad svarar AI?". Rubriken på startsidan är "Syns ditt företag när
  kunderna frågar AI?" och är godkänd av Kenny.
- Avsändarraden: "Byggt av Kenny Damgren (kegren.com) · kemero.se".
- Designen är en egen värld som varken följer kegren.com eller kemero.
- Rösten är svensk, varm och rak. Inga tankstreck och inget komma före "och" eller
  "eller". Skriv "AI-tjänster" i allmänhet och tjänstens namn där den svarar.
- Rubriker godkänns av Kenny.

## Evidence on Hand

- En riktig provkörning för kemero, webbyrå i Västerås, från 26 oktober 2026
  (`docs/verifierat.md`). Kenny har sagt ja till att kemero används som exempel innan
  besökaren har kört själv.
- Inga kundomdömen, användarsiffror eller pressomnämnanden finns. Inget sådant får
  hittas på.

## Product Principles

- Visa det tjänsterna faktiskt svarade, med källorna, och låt företagaren dra
  slutsatsen.
- Varje påstående i resultatet går att peka på: ett svar, en källa eller en kontroll.
- Väntan är en del av upplevelsen. Det ska synas vad som händer medan svaren kommer.
- Säg tydligt vad verktyget inte vet, till exempel att svaren kan bli andra nästa gång.

## Accessibility & Inclusion

- Mobil först.
- Fullt användbart med `prefers-reduced-motion`.
- `aria-live` meddelar bara räknaren och när ett svar är klart, inte varje ord.
- Kontrasten klarar WCAG AA.

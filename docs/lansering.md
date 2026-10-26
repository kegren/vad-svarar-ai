# Lanseringen (fas 7)

## Gjort

- **D1:** databasen `vad-svarar-ai` finns i Västeuropa (WEUR) och båda migreringarna är
  körda mot den. Id:t står i `wrangler.jsonc`.
- **Turnstile:** widgeten "Vad svarar AI?" godkänner bara vad-svarar-ai.kegren.com och står
  i läget Managed. Webbplatsnyckeln står i `wrangler.jsonc`. Dev-servern använder Cloudflares
  testnycklar, eftersom widgeten inte godkänner localhost eller Tailscale-adressen.
- **Hemligheter:** `TURNSTILE_SECRET` och `IP_SALT` ligger i workern. Turnstile-hemligheten
  gick från Cloudflares kopieringsknapp direkt till `wrangler secret put` och syntes aldrig
  i text. `IP_SALT` är 32 slumpade byte från `openssl rand`. För att kunna spara
  hemligheterna skapade wrangler ett tomt Worker-skal som heter `vad-svarar-ai`. Appen är
  inte driftsatt.
- **Domänen:** `vad-svarar-ai.kegren.com` är satt som egen domän i `wrangler.jsonc`.
  Adresserna på workers.dev och förhandsadresserna är avstängda.
- **Umami:** händelserna `korning_startad`, `korning_klar`, `resultat_delat`, `klick_kegren`
  och `klick_kemero` finns i koden. Skriptet laddas först när ett webbplats-id står i
  `src/lib/umami.ts`.
- **Repot:** README och MIT-licens finns. Ingen remote och ingen push.
- **kegren.com:** projektet och två inlägg finns i den lokala kopian (se nedan).

## Kvar, i den här ordningen

1. **OpenRouter-nyckeln i workern.** Bestäm om produktionen ska ha en egen nyckel med
   kreditgränsen 800 kr i månaden. Lägg den sedan med `wrangler secret put OPENROUTER_API_KEY`.
2. **Umami.** Skapa webbplatsen vad-svarar-ai.kegren.com på umami.kemero.io och klistra in
   id:t i `src/lib/umami.ts`.
3. **Driftsättning.** `bun run deploy`. Wrangler kopplar då domänen och ersätter det tomma
   skalet med appen. Prova en riktig körning efteråt (ungefär 2 kr).
4. **GitHub.** Skapa `kegren/vad-svarar-ai` som publikt repo, lägg till det som remote och
   pusha. Inlägget på kegren.com länkar dit.
5. **kegren.com.** Lägg in projektet och inläggen i produktionens admin. Det går också att
   köra `emdash content create` mot produktionen med filerna nedan. Slå ihop grenen
   `vad-svarar-ai` i kegren-repot (den lägger projektet under Selected och Utvalt) och sätt
   status `live` för `vad-svarar-ai` i `identity.projectStatus` när verktyget är ute.

## Texterna på kegren.com

Projektet och inläggen skapades i den lokala EmDash-databasen med CLI:t, alltid med
`--url http://localhost:4321`, så att inget hamnade i produktionen:

```bash
bunx emdash content create projects --url http://localhost:4321 --locale en --slug vad-svarar-ai --file projekt_en.json
bunx emdash content create projects --url http://localhost:4321 --locale sv --slug vad-svarar-ai --translation-of <engelska id:t> --file projekt_sv.json
bunx emdash content create posts --url http://localhost:4321 --locale en --slug how-i-built-vad-svarar-ai --file post_en.json
bunx emdash content create posts --url http://localhost:4321 --locale sv --slug vad-svarar-ai-om-ditt-foretag --file post_sv.json
```

- **Projektet** `/work/vad-svarar-ai` finns på engelska och svenska, som översättningar av
  varandra.
- **"How I built Vad svarar AI? with TanStack Start and TanStack AI 1.0"** är inlägget för
  utvecklare. Det finns bara på engelska och visas på den svenska sidan med notisen om att
  texten saknar översättning.
- **"Vad svarar AI om ditt företag?"** är inlägget för företagare. Det finns bara på
  svenska och syns därför bara under `/sv`.

JSON-filerna ligger i `docs/kegren/`.

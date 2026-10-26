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

## Lanserat 27 oktober 2026

1. **OpenRouter-nyckeln** från `.dev.vars` ligger i workern. Produktionen delar nyckel med
   utvecklingen.
2. **Umami:** webbplatsen vad-svarar-ai.kegren.com finns på umami.kemero.io och id:t står i
   `src/lib/umami.ts`.
3. **Driftsatt** på https://vad-svarar-ai.kegren.com. En riktig körning för kemero gav åtta
   svar, analysen och läsbarhetskontrollen med nio modellanrop, och budgeten räknade 1,92 kr.
   Delningssidan och delningsbilden fungerar. Dev-sidorna ger 404 i produktion.
4. **GitHub:** https://github.com/kegren/vad-svarar-ai är publikt och pushat.
5. **kegren.com:** projektet och inläggen ligger i produktionens databas och sajten är
   driftsatt med projektet under Selected och Utvalt, med status "live".

Projektet och inläggen skrevs till produktionen genom en tillfällig dev-server med
`remoteBindings` i en kopia av kegren-repot. EmDash cachar listorna i KV-namnrymden `CACHE`,
som den servern inte nådde, så listorna för `projects` och `posts` togs bort ur cachen
efteråt. Nästa gång går det enklast att lägga in innehåll i produktionens admin, som tömmer
cachen själv.

## Texterna på kegren.com

Projektet och inläggen skapades först i den lokala EmDash-databasen med CLI:t:

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

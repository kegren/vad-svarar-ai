# Delning och skydd (fas 6)

Det här byggdes i fas 6 och provades lokalt den 26 oktober 2026 utan några modellanrop.

## Delningssidan och bilden

- **`/r/$id`** visar en sparad körning: de åtta svaren i mottagaren, sammanfattningen och
  läsbarhetskontrollen. Sidan renderas på servern ur D1 och har `noindex`. Läsbarheten
  kan inte köras om därifrån, så den som får länken kan inte ändra resultatet.
- **Delningsbilden** ligger på `/api/bild/$id`. Den är 1200 × 630 pixlar och byggs med
  workers-og (Satori och resvg). Inter läses som woff, eftersom Satori inte klarar woff2.
- **"Dela resultatet"** finns under sammanfattningen och på delningssidan. I mobilen
  öppnas delningsmenyn och på datorn kopieras länken.
- En adress som inte är ett id ger 404. Det gör även ett id som saknas.

## Skydden

Ordningen när någon trycker på "Fråga AI":

1. **Turnstile.** Kontrollen syns bara om Cloudflare behöver fråga något. Servern
   kontrollerar token mot Cloudflare innan något annat händer.
2. **Sparade svar.** Samma företag, bransch och ort inom ett dygn skickar besökaren
   till den sparade körningen. Stora och små bokstäver spelar ingen roll.
3. **Dygnsbudgeten.** När 100 kr är förbrukade samma dygn (UTC) stängs formuläret med
   "Dagens frågor är slut, prova i morgon." Kostnaden kommer från OpenRouters `usage.cost`
   för varje svar och analys och räknas om med 10,5 kr per dollar.
4. **IP-taket.** Tre körningar per IP-adress och dygn.

Två spärrar till, som inte fanns i planen:

- **Varje körning får högst 16 modellanrop** och bara de första 15 minuterna. Det räcker
  till åtta svar, analysen och några nya försök. Utan spärren kunde samma körning anropas
  om och om igen genom `/api/svar`.
- **Ett svar som redan är sparat spelas upp** i stället för att frågas igen, till exempel
  när någon laddar om sidan.

**Rensningen.** En cron-trigger (`17 3 * * *`) tar bort körningar och budgetrader som är
äldre än 30 dagar. Den ligger i `src/server.ts`. Därför pekar `main` i
`wrangler.jsonc` dit.

## Provat lokalt

| Prov | Utfall |
|---|---|
| Turnstile med testnycklarna | Token kom utan synlig ruta och godkändes av servern |
| kemero, webbyrå, Västerås igen | Skickades till `/r/a8c5…` utan ny körning |
| Nytt företag från en IP-adress med elva körningar | "Du har ställt frågor om tre företag i dag." Ingen körning skapades |
| Budgeten satt till 100 kr | Formuläret stängt med rätt text, knappen avstängd |
| `/api/svar` för en körning som är en timme gammal | 429, inget modellanrop |
| `/api/svar` för en körning med 16 anrop | 429 |
| `/api/svar` för ett sparat svar | Svaret spelades upp ur D1 |
| Cron-triggern | Körningen som var 40 dagar gammal togs bort, de nya fanns kvar |
| Delningsbilden | PNG på 40 kB |
| `wrangler deploy --dry-run` | 5,9 MB, 1,5 MB med gzip, under gränsen på 3 MB |

## Klart inför lanseringen (26 oktober 2026)

Turnstile-widgeten för vad-svarar-ai.kegren.com, hemligheterna `TURNSTILE_SECRET` och
`IP_SALT` och D1-databasen med båda migreringarna är på plats. Det som återstår står i
[lansering.md](lansering.md).

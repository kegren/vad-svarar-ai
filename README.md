# Vad svarar AI?

A Swedish tool for small business owners. You type your company's name, trade and town, and four AI services (ChatGPT, Gemini, Claude and Perplexity) each get two customer questions with web search turned on:

- "Jag behöver en {bransch} i {ort}. Vilka rekommenderar du och varför?"
- "Vad vet du om {företag} i {ort}? Vad säger kunderna?"

The eight answers stream in while you watch, with the sources each service read. A ninth call summarises them: which services know the company, whether any recommend it, which competitors come up, what the services claim about the company and three things to fix. A fetch-only check shows whether AI crawlers can read the website (robots.txt, llms.txt, text in the HTML and structured data).

Built by Kenny Damgren. Live at [vad-svarar-ai.kegren.com](https://vad-svarar-ai.kegren.com).

## Stack

- [TanStack Start](https://tanstack.com/start) 1.169 on Cloudflare Workers, with D1 for runs and the daily budget
- [TanStack AI](https://tanstack.com/ai) 1.0 with the OpenRouter adapter. Each answer is its own `useChat` stream against `/api/svar`; the summary uses `outputSchema` and streams partial objects
- `@openrouter/sdk` is pinned to 0.13.20. It drops `annotations` from the stream, so sources are read from a tee of the raw SSE through a custom `HTTPClient` (`src/lib/kallor.server.ts`)
- workers-og (Satori and resvg) for the share image, Turnstile, Tailwind 4, Biome via ultracite

The cheap models are set in `src/lib/modeller.ts`. One run costs about 0.18 dollars.

## How the cost stays bounded

Pressing "Fråga AI" goes through these checks in order (`src/lib/korning.functions.ts`):

1. Turnstile, verified on the server.
2. The same company, trade and town within a day redirects to the saved run.
3. A daily budget of 100 kronor in D1, summed from OpenRouter's `usage.cost`.
4. Three runs per IP address and day. Addresses are stored as salted hashes.

Each run also allows at most 16 model calls, all within 15 minutes of the start, and answers already saved are replayed instead of asked again. A daily cron deletes runs older than 30 days.

## Running it locally

```bash
bun install
bun run db:migrate
bun run dev
```

Put `OPENROUTER_API_KEY` in `.dev.vars`. The dev server uses Cloudflare's Turnstile test keys, so no other secrets are needed. A full run costs real money; `/dev/resultat/<id>` and `/dev/lasbarhet/<id>` show saved runs for free.

```bash
bun run test
bunx tsc --noEmit
bunx biome check src
```

## Deploying

The Worker needs three secrets: `OPENROUTER_API_KEY`, `IP_SALT` and `TURNSTILE_SECRET`. Apply migrations with `wrangler d1 migrations apply vad-svarar-ai --remote`, then run `bun run deploy`. The custom domain is set in `wrangler.jsonc`.

## License

MIT

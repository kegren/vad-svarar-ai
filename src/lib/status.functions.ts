import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";

// Fas 0: visar att Workern läser OpenRouter-nyckeln och når D1.
export const hamtaStatus = createServerFn({ method: "GET" }).handler(
  async () => {
    const tabeller = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('korning', 'budget') ORDER BY name"
    ).all<{ name: string }>();

    return {
      nyckel: Boolean(env.OPENROUTER_API_KEY),
      tabeller: tabeller.results.map((rad) => rad.name),
    };
  }
);

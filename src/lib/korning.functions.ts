import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { ForetagSchema } from "./fragor";
import { hamtaKorning, hashaIp, skapaKorning } from "./korning.server";
import {
  budgetSlut,
  godkandTurnstile,
  KORNINGAR_PER_IP,
  korningarFranIp,
  sparadKorning,
  webbplatsnyckel,
} from "./skydd.server";

const StartSchema = ForetagSchema.extend({
  hemsida: z.string().trim().max(200).optional(),
  turnstile: z.string().max(2048),
});

export const SLUT_IDAG = "Dagens frågor är slut, prova i morgon.";

export type Start =
  | { typ: "ny"; id: string; skapad: string }
  | { typ: "sparad"; id: string }
  | { typ: "stopp"; meddelande: string };

// Startar en körning: Turnstile först, sedan sparade svar för samma fråga, sedan
// dygnsbudgeten och IP-taket (PLAN.md avsnitt 7). Bara en ny körning kostar något.
export const startaKorning = createServerFn({ method: "POST" })
  .validator(StartSchema)
  .handler(async ({ data }): Promise<Start> => {
    const ip = getRequestHeader("cf-connecting-ip") ?? "lokal";
    if (!(await godkandTurnstile(data.turnstile, ip))) {
      return {
        typ: "stopp",
        meddelande:
          "Kontrollen att du är en människa gick inte igenom. Ladda om sidan och försök igen.",
      };
    }
    const sparad = await sparadKorning(data);
    if (sparad) {
      return { typ: "sparad", id: sparad };
    }
    if (await budgetSlut()) {
      return { typ: "stopp", meddelande: SLUT_IDAG };
    }
    if ((await korningarFranIp(await hashaIp(ip))) >= KORNINGAR_PER_IP) {
      return {
        typ: "stopp",
        meddelande:
          "Du har ställt frågor om tre företag i dag. Prova igen i morgon.",
      };
    }
    const { turnstile: _, ...foretag } = data;
    const { id, skapad } = await skapaKorning(
      { ...foretag, hemsida: foretag.hemsida || null },
      ip
    );
    return { typ: "ny", id, skapad };
  });

// Det startsidan behöver innan formuläret visas.
export const hamtaLage = createServerFn({ method: "GET" }).handler(
  async () => ({ webbplatsnyckel: webbplatsnyckel(), slut: await budgetSlut() })
);

// Den sparade körningen för delningssidan. IP-hashen lämnar aldrig servern.
export const hamtaResultat = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().regex(/^[0-9a-f]{32}$/u) }))
  .handler(async ({ data }) => {
    const korning = await hamtaKorning(data.id);
    if (!korning?.analys) {
      throw notFound();
    }
    // Bakom tailscale serve eller en proxy står den riktiga adressen i x-forwarded-*.
    const url = new URL(getRequest().url);
    const vard = getRequestHeader("x-forwarded-host") ?? url.host;
    const protokoll =
      getRequestHeader("x-forwarded-proto") ?? url.protocol.slice(0, -1);
    const origin = `${protokoll}://${vard}`;
    return { korning, origin };
  });

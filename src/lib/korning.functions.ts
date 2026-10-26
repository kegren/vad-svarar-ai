import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { ForetagSchema } from "./fragor";
import { skapaKorning } from "./korning.server";

const StartSchema = ForetagSchema.extend({
  hemsida: z.string().trim().max(200).optional(),
});

// Startar en körning: sparar den i D1 och ger tillbaka id:t som strömmarna
// och analysen hämtar frågorna med. Turnstile, IP-taket och dygnsbudgeten
// kommer hit i fas 6.
export const startaKorning = createServerFn({ method: "POST" })
  .validator(StartSchema)
  .handler(({ data }) => {
    const ip = getRequestHeader("cf-connecting-ip") ?? "lokal";
    return skapaKorning({ ...data, hemsida: data.hemsida || null }, ip);
  });

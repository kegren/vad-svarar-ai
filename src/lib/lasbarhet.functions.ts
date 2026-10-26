import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { hamtaKorning, sparaLasbarhet } from "./korning.server";
import { tolkaHemsida } from "./lasbarhet";
import { kontrollera } from "./lasbarhet.server";

const BegaranSchema = z.object({
  korningId: z.string().min(1).max(64),
  hemsida: z.string().trim().max(200),
});

// Kontrollerar hemsidan för en körning och sparar utfallet. En hemsida som redan
// är kontrollerad i körningen hämtas inte igen.
export const kontrolleraHemsida = createServerFn({ method: "POST" })
  .validator(BegaranSchema)
  .handler(async ({ data }) => {
    const hemsida = tolkaHemsida(data.hemsida);
    if (!hemsida) {
      throw new Error("Det där ser inte ut som en adress till en hemsida.");
    }
    const korning = await hamtaKorning(data.korningId);
    if (!korning) {
      throw new Error("Körningen finns inte.");
    }
    if (korning.las?.url === hemsida) {
      return korning.las;
    }
    const las = await kontrollera(hemsida);
    await sparaLasbarhet(korning.id, las);
    return las;
  });

import { useServerFn } from "@tanstack/react-start";
import { useCallback, useState } from "react";
import type { Lasbarhet as LasbarhetData } from "./lasbarhet";
import { kontrolleraHemsida } from "./lasbarhet.functions";

export type LasbarhetTillstand = {
  data: LasbarhetData | null;
  laddar: boolean;
  fel: string | null;
  kor: (hemsida: string) => Promise<void>;
};

// Kör kontrollen och håller utfallet. Scenen startar den direkt när besökaren har
// fyllt i hemsidan, så att analysen kan bygga på den.
export function useLasbarhet(
  korningId: string,
  start: LasbarhetData | null = null
): LasbarhetTillstand {
  const kontrollera = useServerFn(kontrolleraHemsida);
  const [data, setData] = useState<LasbarhetData | null>(start);
  const [laddar, setLaddar] = useState(false);
  const [fel, setFel] = useState<string | null>(null);

  const kor = useCallback(
    async (hemsida: string) => {
      setLaddar(true);
      setFel(null);
      try {
        setData(await kontrollera({ data: { korningId, hemsida } }));
      } catch (e) {
        setFel(
          e instanceof Error && e.message.startsWith("Det där")
            ? e.message
            : "Hemsidan gick inte att kontrollera just nu. Försök igen om en stund."
        );
      } finally {
        setLaddar(false);
      }
    },
    [kontrollera, korningId]
  );

  return { data, laddar, fel, kor };
}

import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { Resultat } from "#/components/resultat";
import { useLasbarhet } from "#/lib/use-lasbarhet";

// Bara i utvecklingsläget: sammanfattningen för en sparad kemero-körning. Analysen
// spelas upp ur databasen och läsbarhetskontrollen kostar inget.
export const Route = createFileRoute("/dev/resultat/$id")({
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw notFound();
    }
  },
  component: Provsida,
});

function Provsida() {
  const { id } = Route.useParams();
  const las = useLasbarhet(id);
  const { kor } = las;
  useEffect(() => {
    const t = setTimeout(() => kor("kemero.se"), 0);
    return () => clearTimeout(t);
  }, [kor]);
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <Resultat
        korning={{
          id,
          foretag: "kemero",
          bransch: "webbyrå",
          ort: "Västerås",
          hemsida: "kemero.se",
          startad: new Date().toISOString(),
        }}
        las={las}
        namns={4}
      />
    </main>
  );
}

import { createFileRoute, notFound } from "@tanstack/react-router";
import { Lasbarhet, LasbarhetIngress } from "#/components/lasbarhet";
import { Rida } from "#/components/rida";
import { useLasbarhet } from "#/lib/use-lasbarhet";

// Bara i utvecklingsläget: läsbarhetssektionen för en sparad körning, så att
// lägena kan provas utan en ny körning mot AI-tjänsterna. Kontrollen kostar inget.
export const Route = createFileRoute("/dev/lasbarhet/$id")({
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
  return (
    <>
      <Rida slackt />
      <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <h3 className="font-display text-text text-[1.6rem] leading-[1.05] font-semibold tracking-[-0.03em] sm:text-[2rem]">
          Kan AI läsa din hemsida?
        </h3>
        <LasbarhetIngress />
        <Lasbarhet forslag="kemero.se" tillstand={las} />
      </main>
    </>
  );
}

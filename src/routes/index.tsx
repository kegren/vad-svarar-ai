import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Formular } from "#/components/formular";
import { Rida } from "#/components/rida";
import { type Korning, Scen } from "#/components/scen";
import { startaKorning } from "#/lib/korning.functions";

const RUBRIK = "Syns ditt företag när kunderna frågar AI?";

export const Route = createFileRoute("/")({
  component: Startsida,
});

function Startsida() {
  const [korning, setKorning] = useState<Korning | null>(null);
  const [andrar, setAndrar] = useState(false);
  const [skickar, setSkickar] = useState(false);
  const [serverfel, setServerfel] = useState<string>();
  const scenRef = useRef<HTMLDivElement>(null);
  const starta = useServerFn(startaKorning);

  const fraga = async (falt: Omit<Korning, "id" | "startad">) => {
    setSkickar(true);
    setServerfel(undefined);
    try {
      const { id, skapad } = await starta({ data: falt });
      setKorning({ ...falt, id, startad: skapad });
      setAndrar(false);
      requestAnimationFrame(() =>
        scenRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    } catch {
      setServerfel(
        "Det gick inte att ställa frågorna just nu. Försök igen om en stund."
      );
    } finally {
      setSkickar(false);
    }
  };

  const visaFormular = !korning || andrar;

  return (
    <>
      <Rida slackt={Boolean(korning) && !andrar} />
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        {visaFormular ? (
          <section className="flex min-h-[100svh] flex-col justify-center py-16 sm:py-24">
            <h1 className="font-display text-text max-w-[13ch] text-[clamp(2.75rem,11vw,6rem)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance">
              {RUBRIK.split(" ").map((ord, i) => (
                <span
                  className="ord-in inline-block"
                  // biome-ignore lint/suspicious/noArrayIndexKey: orden i rubriken byter aldrig plats.
                  key={i}
                  style={{ animationDelay: `${120 + i * 70}ms` }}
                >
                  {ord}&nbsp;
                </span>
              ))}
            </h1>
            <div className="mt-10 max-w-2xl sm:mt-14">
              <Formular
                onFraga={fraga}
                serverfel={serverfel}
                skickar={skickar}
                start={korning ?? undefined}
              />
            </div>
          </section>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-6 pb-2">
            <p className="text-dov">
              <span className="font-display text-text font-semibold">
                {korning.foretag}
              </span>{" "}
              · {korning.bransch} · {korning.ort}
            </p>
            <button
              className="text-text hover:border-ljus rounded-full border border-[var(--linje-stark)] px-4 py-2 text-sm transition-colors"
              onClick={() => setAndrar(true)}
              type="button"
            >
              Fråga om ett annat företag
            </button>
          </div>
        )}

        {korning && !andrar && (
          <div className="scroll-mt-4 pb-20" ref={scenRef}>
            <Scen key={korning.id} korning={korning} />
          </div>
        )}
      </main>
      <footer className="text-svag mx-auto w-full max-w-6xl px-4 pb-10 text-sm sm:px-6">
        Byggt av{" "}
        <a
          className="text-dov hover:text-text underline"
          href="https://kegren.com"
        >
          Kenny Damgren (kegren.com)
        </a>{" "}
        ·{" "}
        <a
          className="text-dov hover:text-text underline"
          href="https://kemero.se"
        >
          kemero.se
        </a>
      </footer>
    </>
  );
}

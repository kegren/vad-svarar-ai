import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Exempel } from "#/components/exempel";
import { Formular } from "#/components/formular";
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
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-5 sm:px-6">
        <p className="flex items-center gap-2.5 text-[0.95rem] font-semibold tracking-[-0.01em]">
          <span aria-hidden="true" className="topplampa size-2 rounded-full" />
          Vad svarar AI?
        </p>
        {korning && !andrar ? (
          <button
            className="hover:border-bakelit rounded-full border border-[var(--linje-stark)] px-4 py-2 text-sm transition-colors"
            onClick={() => setAndrar(true)}
            type="button"
          >
            Fråga om ett annat företag
          </button>
        ) : null}
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        {visaFormular ? (
          <section className="grid grid-cols-1 items-center gap-x-14 gap-y-8 pt-6 pb-16 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] lg:pt-20">
            <div>
              <h1 className="font-display max-w-[13ch] text-[clamp(2.75rem,10vw,4.5rem)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance">
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
              <div className="mt-6 max-w-xl sm:mt-10">
                <Formular
                  onFraga={fraga}
                  serverfel={serverfel}
                  skickar={skickar}
                  start={korning ?? undefined}
                />
              </div>
            </div>
            <Exempel />
          </section>
        ) : (
          <div className="pt-6 pb-2">
            <p className="text-dov">
              <span className="text-bakelit font-semibold">
                {korning.foretag}
              </span>{" "}
              · {korning.bransch} · {korning.ort}
            </p>
          </div>
        )}

        {korning && !andrar && (
          <div
            className="mx-auto max-w-4xl scroll-mt-4 pt-4 pb-20"
            ref={scenRef}
          >
            <Scen key={korning.id} korning={korning} />
          </div>
        )}
      </main>
      <footer className="text-svag mx-auto w-full max-w-6xl border-t border-[var(--linje)] px-4 py-8 text-sm sm:px-6">
        Byggt av{" "}
        <a
          className="text-dov hover:text-bakelit underline"
          href="https://kegren.com"
        >
          Kenny Damgren (kegren.com)
        </a>{" "}
        ·{" "}
        <a
          className="text-dov hover:text-bakelit underline"
          href="https://kemero.se"
        >
          kemero.se
        </a>
      </footer>
    </>
  );
}

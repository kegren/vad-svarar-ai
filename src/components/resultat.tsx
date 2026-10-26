import { fetchServerSentEvents, useChat } from "@tanstack/ai-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  AnalysSchema,
  type Resultat as ResultatData,
  svarsnyckel,
} from "#/lib/analys";
import { hallIhop } from "#/lib/hall-ihop";
import { gissaHemsida } from "#/lib/lasbarhet";
import { TJANST_ORDNING, TJANSTER, type Tjanst } from "#/lib/modeller";
import { namnMonster } from "#/lib/svarstext";
import type { LasbarhetTillstand } from "#/lib/use-lasbarhet";
import { useSyns } from "#/lib/use-syns";
import { Favicon } from "./favicon";
import { Lasbarhet, LasbarhetIngress } from "./lasbarhet";
import type { Korning } from "./scen";

type Svarsbedomning = ResultatData["svar"][number];

function uppraknat(delar: string[]) {
  return delar.length > 1
    ? `${delar.slice(0, -1).join(", ")} och ${delar.at(-1)}`
    : (delar[0] ?? "");
}

function namnPa(tjanster: Tjanst[]) {
  return uppraknat(tjanster.map((t) => TJANSTER[t].namn));
}

// Huvudmeningarna: vilka tjänster som känner till företaget och om någon
// rekommenderar det. Byggs ur modellens bedömning per svar.
function slutsats(korning: Korning, svar: Partial<Svarsbedomning>[]) {
  const om = (tjanst: Tjanst, fraga: 0 | 1) =>
    svar.find((s) => s.nyckel === svarsnyckel(tjanst, fraga));
  const kanner = TJANST_ORDNING.filter((t) => om(t, 1)?.kannerTill);
  const kannerInte = TJANST_ORDNING.filter(
    (t) => om(t, 1)?.kannerTill === false
  );
  const rekommenderar = TJANST_ORDNING.filter(
    (t) => typeof om(t, 0)?.plats === "number"
  );

  let kannerText = `Ingen av AI-tjänsterna känner till ${korning.foretag}.`;
  if (kanner.length === TJANST_ORDNING.length) {
    kannerText = `Alla fyra AI-tjänsterna känner till ${korning.foretag}.`;
  } else if (kanner.length > 0) {
    kannerText = `${namnPa(kanner)} känner till ${korning.foretag}.`;
  }
  const kannerInteText =
    kanner.length > 0 && kannerInte.length > 0
      ? ` ${namnPa(kannerInte)} hittar inget.`
      : "";
  const rekText =
    rekommenderar.length > 0
      ? `${namnPa(rekommenderar)} rekommenderar ${korning.foretag} när en kund frågar efter en ${korning.bransch} i ${korning.ort}.`
      : `Ingen rekommenderar ${korning.foretag} när en kund frågar efter en ${korning.bransch} i ${korning.ort}.`;
  return { forsta: kannerText + kannerInteText, andra: rekText };
}

// Den stora meningen: företagets namn tänds i sändningsrött som i svaren.
function stortText(text: string, namn: string) {
  return text.split(namnMonster(namn)).flatMap((del, i): ReactNode[] =>
    i % 2 === 1
      ? [
          // biome-ignore lint/suspicious/noArrayIndexKey: delarna byter aldrig plats.
          <mark className="namn" key={`namn-${i}`}>
            {del}
          </mark>,
        ]
      : hallIhop(del, `del-${i}`)
  );
}

function Rubrik({ children }: { children: string }) {
  return (
    <h3 className="font-display text-bakelit text-[1.6rem] leading-[1.05] font-semibold tracking-[-0.03em] sm:text-[2rem]">
      {children}
    </h3>
  );
}

function Rekommendation({
  bedomning,
}: {
  bedomning: Partial<Svarsbedomning> | undefined;
}) {
  if (bedomning === undefined) {
    return <span className="text-svag">…</span>;
  }
  if (typeof bedomning.plats === "number") {
    return (
      <span className="text-sandning font-semibold whitespace-nowrap">
        Rekommenderar, plats {bedomning.plats}
      </span>
    );
  }
  return "Rekommenderar inte";
}

function PerTjanst({ svar }: { svar: Partial<Svarsbedomning>[] }) {
  const om = (tjanst: Tjanst, fraga: 0 | 1) =>
    svar.find((s) => s.nyckel === svarsnyckel(tjanst, fraga));
  return (
    <ul className="divide-y divide-[var(--linje)] border-t border-[var(--linje)]">
      {TJANST_ORDNING.map((tjanst) => {
        const rek = om(tjanst, 0);
        const kan = om(tjanst, 1);
        return (
          <li
            className="grid gap-x-6 gap-y-2 py-4 last:pb-0 sm:grid-cols-[9rem_13rem_1fr] sm:items-baseline"
            key={tjanst}
          >
            <p className="font-display text-bakelit flex items-center gap-2.5 text-[1.15rem] font-semibold">
              <span
                className={`size-2 shrink-0 rounded-full ${typeof rek?.plats === "number" ? "bg-sandning" : "bg-bakelit/25"}`}
              />
              {TJANSTER[tjanst].namn}
            </p>
            <p className="text-dov text-[0.95rem] tabular-nums">
              <Rekommendation bedomning={rek} />
            </p>
            {kan?.citat ? (
              <blockquote className="text-dov text-[1rem] leading-relaxed italic">
                ”{kan.citat}”
              </blockquote>
            ) : (
              <p className="text-dov text-[1rem] leading-relaxed">
                {kan?.omdome ?? <span className="text-svag">…</span>}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Staplar({
  korning,
  namns,
  konkurrenter,
}: {
  korning: Korning;
  namns: number;
  konkurrenter: ResultatData["konkurrenter"];
}) {
  const rader = [
    { namn: korning.foretag, antal: namns, eget: true },
    ...konkurrenter.map((k) => ({ ...k, eget: false })),
  ].sort((a, b) => b.antal - a.antal || Number(b.eget) - Number(a.eget));
  const total = TJANST_ORDNING.length * 2;
  const listaRef = useRef<HTMLUListElement>(null);
  const syns = useSyns(listaRef);

  return (
    <ul className="space-y-3" ref={listaRef}>
      {rader.map((rad, i) => (
        <li key={rad.namn}>
          <div className="flex items-baseline justify-between gap-4 text-[0.95rem]">
            <span
              className={
                rad.eget ? "text-sandning font-semibold" : "text-bakelit"
              }
            >
              {rad.namn}
            </span>
            <span className="text-svag shrink-0 text-sm tabular-nums">
              i {rad.antal} av {total} svar
            </span>
          </div>
          <div className="bg-glas-2 mt-1.5 h-2 overflow-hidden rounded-full">
            <div
              className={`stapel h-full rounded-full ${syns ? "syns" : ""} ${rad.eget ? "bg-sandning" : "bg-bakelit/70"}`}
              style={{
                width: `${Math.max(2, (rad.antal / total) * 100)}%`,
                transitionDelay: `${i * 90}ms`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Pastaenden({
  pastaenden,
}: {
  pastaenden: Partial<ResultatData["pastaenden"][number]>[];
}) {
  return (
    <ul className="space-y-5 sm:space-y-6">
      {pastaenden.map((p, i) =>
        p.text ? (
          <li
            className="kalla-in grid gap-y-1 sm:grid-cols-[minmax(0,52ch)_minmax(1.5rem,1fr)_13rem] sm:gap-x-3"
            // biome-ignore lint/suspicious/noArrayIndexKey: påståendena strömmar in i ordning och byter aldrig plats.
            key={i}
          >
            <p className="text-bakelit text-[1.02rem] leading-relaxed">
              {p.kontrollera ? (
                <span className="border-bakelit/50 text-bakelit mr-2 inline-block translate-y-[-1px] rounded-full border px-2 py-0.5 align-middle text-[0.75rem] font-medium">
                  Kontrollera
                </span>
              ) : null}
              {p.text}
            </p>
            {/* Hänvisningslinjen från påståendet till källan. */}
            <span
              aria-hidden="true"
              className="mt-[0.85em] hidden h-px self-start bg-[var(--linje-stark)] sm:block"
            />
            <p className="text-svag text-[0.95rem] leading-snug sm:pt-[0.2em]">
              {p.kalla ? (
                <span className="text-bakelit sm:block">{p.kalla}</span>
              ) : null}
              {p.kalla ? <span className="sm:hidden"> · </span> : null}
              <span className="sm:block sm:text-[0.8rem]">
                {uppraknat(
                  (p.svar ?? [])
                    .map((n) => n?.split("-")[0])
                    .filter((t): t is Tjanst => Boolean(t && t in TJANSTER))
                    .filter((t, j, alla) => alla.indexOf(t) === j)
                    .map((t) => TJANSTER[t].namn)
                )}
              </span>
            </p>
          </li>
        ) : null
      )}
    </ul>
  );
}

function AttGora({
  saker,
}: {
  saker: Partial<ResultatData["attGora"][number]>[];
}) {
  return (
    <ol className="space-y-8">
      {saker.slice(0, 3).map((sak, i) =>
        sak.gor ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: sakerna strömmar in i ordning och byter aldrig plats.
          <li className="kalla-in grid grid-cols-[2.5rem_1fr] gap-x-3" key={i}>
            <span className="font-display text-bakelit text-[2.4rem] leading-none font-semibold tabular-nums">
              {i + 1}
            </span>
            <div>
              <p className="font-display text-bakelit max-w-[34ch] text-[1.35rem] leading-[1.15] font-semibold tracking-[-0.02em] sm:text-[1.6rem]">
                {sak.gor}
              </p>
              {sak.darfor ? (
                <p className="text-dov mt-2 max-w-[62ch] leading-relaxed">
                  {sak.darfor}
                </p>
              ) : null}
            </div>
          </li>
        ) : null
      )}
    </ol>
  );
}

// Domslutet på glas, som mottagarens front: huvudmeningarna och en rad per
// station med samma prick som på skalan.
function Domslut({
  korning,
  klar,
  svar,
}: {
  korning: Korning;
  klar: boolean;
  svar: Partial<Svarsbedomning>[];
}) {
  const { forsta, andra } = slutsats(korning, svar);
  const { foretag } = korning;
  return (
    <div className="bg-glas border-bakelit rounded-[20px] border-[1.5px] px-5 py-6 sm:px-8 sm:py-8">
      {klar ? (
        <div className="kalla-in mb-8">
          <p className="font-display text-bakelit max-w-[20ch] text-[clamp(1.9rem,7vw,3.4rem)] leading-[1.04] font-semibold tracking-[-0.035em] text-balance">
            {stortText(forsta, foretag)}
          </p>
          <p className="font-display text-dov mt-4 max-w-[30ch] text-[clamp(1.3rem,4.5vw,2rem)] leading-[1.1] font-semibold tracking-[-0.025em] text-balance">
            {stortText(andra, foretag)}
          </p>
        </div>
      ) : null}
      <PerTjanst svar={svar} />
    </div>
  );
}

export function Resultat({
  korning,
  namns,
  las,
}: {
  korning: Korning;
  namns: number;
  las: LasbarhetTillstand;
}) {
  const [resultat, setResultat] = useState<ResultatData | null>(null);
  const { sendMessage, partial, error, reload, isLoading, messages } = useChat({
    connection: fetchServerSentEvents("/api/analys"),
    threadId: `${korning.id}-analys`,
    forwardedProps: { korningId: korning.id },
    outputSchema: AnalysSchema,
    onCustomEvent: (typ, data) => {
      if (typ === "resultat") {
        setResultat(data as ResultatData);
      }
    },
  });

  const skicka = useRef(sendMessage);
  skicka.current = sendMessage;
  useEffect(() => {
    const id = setTimeout(() => skicka.current("Sammanfatta svaren."), 0);
    return () => clearTimeout(id);
  }, []);

  const svar = (resultat?.svar ??
    partial.svar ??
    []) as Partial<Svarsbedomning>[];
  const pastaenden = (resultat?.pastaenden ??
    partial.pastaenden ??
    []) as Partial<ResultatData["pastaenden"][number]>[];
  const attGora = (resultat?.attGora ?? partial.attGora ?? []) as Partial<
    ResultatData["attGora"][number]
  >[];
  const klarSvar = svar.length >= TJANST_ORDNING.length * 2;

  return (
    <section
      aria-labelledby="resultat-rubrik"
      className="mt-16 scroll-mt-44 sm:mt-24"
      id="sammanfattning"
    >
      <h2 className="sr-only" id="resultat-rubrik">
        Sammanfattning
      </h2>

      {error ? (
        <div className="text-fel flex flex-wrap items-center gap-3">
          <p>Sammanfattningen gick inte att göra den här gången.</p>
          <button
            className="text-bakelit hover:border-bakelit rounded-full border border-[var(--linje-stark)] px-4 py-1.5 text-sm transition-colors"
            onClick={() => reload()}
            type="button"
          >
            Försök igen
          </button>
        </div>
      ) : null}

      {svar.length === 0 && !error ? (
        <p className="text-dov flex items-center gap-3">
          <span aria-hidden="true" className="markor" />
          Läser de åtta svaren och sammanställer vad de säger.
        </p>
      ) : null}

      {svar.length > 0 ? (
        <Domslut klar={klarSvar} korning={korning} svar={svar} />
      ) : null}

      {resultat ? (
        <div className="mt-16 grid gap-16 lg:grid-cols-2 lg:gap-12">
          <div>
            <Rubrik>Vilka som nämns</Rubrik>
            <p className="text-dov mt-2 mb-6 max-w-[48ch]">
              Företagen som AI-tjänsterna tar upp i sina svar. Stapeln visar i
              hur många av de åtta svaren.
            </p>
            <Staplar
              konkurrenter={resultat.konkurrenter}
              korning={korning}
              namns={namns}
            />
          </div>
          <div>
            <Rubrik>Källorna de läste</Rubrik>
            <p className="text-dov mt-2 mb-6 max-w-[48ch]">
              Sidorna som styr vad tjänsterna säger. Det som står där är det som
              går att rätta.
            </p>
            <ul className="flex flex-wrap gap-2">
              {resultat.kallor.slice(0, 14).map((k, i) => (
                <li
                  className="kalla-in"
                  key={k.doman}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <a
                    className="bg-glas-2 hover:text-bakelit text-dov flex items-center gap-2 rounded-xl py-2 pr-3.5 pl-2.5 text-[0.85rem] transition-colors hover:bg-[#ddd4c3]"
                    href={k.url}
                    rel="noopener noreferrer nofollow"
                    target="_blank"
                    title={k.titel}
                  >
                    <Favicon doman={k.doman} />
                    <span className="text-bakelit">{k.doman}</span>
                    <span className="text-svag tabular-nums">
                      {k.tjanster.length === 1
                        ? TJANSTER[k.tjanster[0] as Tjanst].namn
                        : `${k.tjanster.length} tjänster`}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {pastaenden.some((p) => p.text) ? (
        <div className="mt-16">
          <Rubrik>{`Vad de säger om ${korning.foretag}`}</Rubrik>
          <p className="text-dov mt-2 mb-6 max-w-[56ch]">
            Uppgifterna som tjänsterna ger om företaget. Det som är markerat bör
            du kontrollera.
          </p>
          <Pastaenden pastaenden={pastaenden} />
        </div>
      ) : null}

      {resultat || las.data ? (
        <div className="mt-16">
          <Rubrik>Kan AI läsa din hemsida?</Rubrik>
          <LasbarhetIngress />
          <Lasbarhet
            forslag={
              korning.hemsida ||
              gissaHemsida(
                korning.foretag,
                resultat?.kallor.map((k) => k.doman) ?? []
              )
            }
            tillstand={las}
          />
        </div>
      ) : null}

      {attGora.some((a) => a.gor) ? (
        <div className="mt-16 sm:mt-20">
          <Rubrik>Tre saker att göra</Rubrik>
          <div className="mt-8">
            <AttGora saker={attGora} />
          </div>
        </div>
      ) : null}

      {!(isLoading || resultat || error) &&
      messages.some((m) => m.role === "assistant") ? (
        <div className="text-fel mt-10 flex flex-wrap items-center gap-3">
          <p>Sammanfattningen blev inte klar den här gången.</p>
          <button
            className="text-bakelit hover:border-bakelit rounded-full border border-[var(--linje-stark)] px-4 py-1.5 text-sm transition-colors"
            onClick={() => reload()}
            type="button"
          >
            Försök igen
          </button>
        </div>
      ) : null}

      {isLoading && svar.length > 0 ? (
        <p className="text-svag mt-10 flex items-center gap-3 text-sm">
          <span aria-hidden="true" className="markor" />
          Sammanställer…
        </p>
      ) : null}
    </section>
  );
}

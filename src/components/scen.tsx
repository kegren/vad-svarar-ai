import { fetchServerSentEvents, useChat } from "@tanstack/ai-react";
import {
  createContext,
  type KeyboardEvent,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import ClickSpark, {
  type ClickSparkHandle,
} from "#/components/reactbits/ClickSpark";
import CountUp from "#/components/reactbits/CountUp";
import SpotlightCard from "#/components/reactbits/SpotlightCard";
import { type Foretag, fragor, type Kalla } from "#/lib/fragor";
import { TJANST_ORDNING, TJANSTER, type Tjanst } from "#/lib/modeller";
import { namnsI, Svarstext } from "#/lib/svarstext";

export type Korning = Foretag & { id: string; startad: string };

type Lage = { klar: boolean; namns: boolean; fel: boolean };

const TOMT: Lage = { klar: false, namns: false, fel: false };

// Gnistan när namnet tänds. Scenen äger en ClickSpark och korten pekar ut var.
const GnistaContext = createContext<(el: Element) => void>(() => undefined);

function Svar({
  korning,
  tjanst,
  fraga,
  synlig,
  panelId,
  flikId,
  onLage,
}: {
  korning: Korning;
  tjanst: Tjanst;
  fraga: 0 | 1;
  synlig: boolean;
  panelId: string;
  flikId: string;
  onLage: (lage: Lage) => void;
}) {
  const gnista = useContext(GnistaContext);
  const textRef = useRef<HTMLDivElement>(null);
  const gnistad = useRef(false);
  const [kallor, setKallor] = useState<Kalla[]>([]);
  const fragetext = fragor(korning)[fraga];

  const { messages, sendMessage, status, error, reload } = useChat({
    connection: fetchServerSentEvents("/api/svar"),
    threadId: `${korning.id}-${tjanst}-${fraga}`,
    forwardedProps: {
      tjanst,
      fraga,
      foretag: korning.foretag,
      bransch: korning.bransch,
      ort: korning.ort,
    },
    onCustomEvent: (typ, data) => {
      if (typ === "kallor") {
        setKallor(data as Kalla[]);
      }
    },
  });

  // Skicka i nästa tick och städa vid avmontering. StrictMode monterar två gånger,
  // och bara den andra monteringen får skicka frågan.
  const skicka = useRef(sendMessage);
  skicka.current = sendMessage;
  useEffect(() => {
    const id = setTimeout(() => skicka.current(fragetext), 0);
    return () => clearTimeout(id);
  }, [fragetext]);

  const text = messages
    .filter((m) => m.role === "assistant")
    .flatMap((m) => m.parts)
    .map((p) => (p.type === "text" ? p.content : ""))
    .join("");
  const arbetar = status === "submitted" || status === "streaming";
  const klar = !arbetar && text.length > 0;
  const namns = namnsI(text, korning.foretag);
  const fel = Boolean(error);

  useEffect(() => {
    onLage({ klar, namns, fel });
  }, [onLage, klar, namns, fel]);

  // Gnistan kommer första gången namnet syns: när det sägs i den öppna fliken,
  // eller när besökaren öppnar fliken där det redan har sagts.
  useEffect(() => {
    if (!(namns && synlig) || gnistad.current) {
      return;
    }
    const forsta = textRef.current?.querySelector("mark.namn");
    if (forsta) {
      gnistad.current = true;
      requestAnimationFrame(() => gnista(forsta));
    }
  }, [namns, synlig, gnista]);

  return (
    <div aria-labelledby={flikId} hidden={!synlig} id={panelId} role="tabpanel">
      <p className="text-svag text-[0.95rem] italic">”{fragetext}”</p>
      <div
        className="text-dov mt-4 text-[1rem] leading-[1.65] [overflow-wrap:anywhere]"
        ref={textRef}
      >
        {text ? (
          <Svarstext namn={korning.foretag} text={text} />
        ) : (
          !error && (
            <p className="my-3">
              <span className="sr-only">
                {TJANSTER[tjanst].namn} söker och skriver
              </span>
              <span aria-hidden="true" className="markor" />
            </p>
          )
        )}
        {arbetar && text ? (
          <span aria-hidden="true" className="markor ml-1" />
        ) : null}
      </div>
      {error ? (
        <div className="text-fel mt-4 flex flex-wrap items-center gap-3">
          <p>{TJANSTER[tjanst].namn} svarade inte den här gången.</p>
          <button
            className="text-text hover:border-ljus rounded-full border border-[var(--linje-stark)] px-4 py-1.5 text-sm transition-colors"
            onClick={() => reload()}
            type="button"
          >
            Fråga igen
          </button>
        </div>
      ) : null}
      {kallor.length > 0 && (
        <div className="mt-6 border-t border-[var(--linje)] pt-4">
          <p className="text-svag text-sm">
            {TJANSTER[tjanst].namn} läste {kallor.length}{" "}
            {kallor.length === 1 ? "källa" : "källor"}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {kallor.map((kalla, i) => (
              <li
                className="kalla-in"
                key={kalla.url}
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <a
                  className="bg-sammet-2 text-dov hover:text-text flex max-w-[17rem] items-center gap-2.5 rounded-xl py-2 pr-3.5 pl-2.5 text-[0.8rem] transition-colors hover:bg-[#331c22]"
                  href={kalla.url}
                  rel="noopener noreferrer nofollow"
                  target="_blank"
                  title={kalla.titel}
                >
                  <img
                    alt=""
                    className="size-4 shrink-0 rounded-sm"
                    height={16}
                    loading="lazy"
                    src={`https://icons.duckduckgo.com/ip3/${kalla.doman}.ico`}
                    width={16}
                  />
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="text-text truncate">{kalla.titel}</span>
                    {kalla.titel === kalla.doman ? null : (
                      <span className="text-svag truncate text-[0.72rem]">
                        {kalla.doman}
                      </span>
                    )}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Kort({
  korning,
  tjanst,
  lagen,
  onLage,
}: {
  korning: Korning;
  tjanst: Tjanst;
  lagen: [Lage, Lage];
  onLage: (fraga: 0 | 1, lage: Lage) => void;
}) {
  const [flik, setFlik] = useState<0 | 1>(0);
  const id = useId();
  const flikRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { namn, modellnamn } = TJANSTER[tjanst];
  const flikar = ["Vem rekommenderas?", `Om ${korning.foretag}`] as const;
  const lage0 = useCallback((l: Lage) => onLage(0, l), [onLage]);
  const lage1 = useCallback((l: Lage) => onLage(1, l), [onLage]);
  // Kortet står i strålkastarljuset så länge tjänsten svarar.
  const talar = lagen.some((l) => !(l.klar || l.fel));

  const tangent = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const ny = flik === 0 ? 1 : 0;
      setFlik(ny);
      flikRefs.current[ny]?.focus();
    }
  };

  return (
    <SpotlightCard
      className="p-5 sm:p-7"
      intensity={0.12}
      spotlightColor="#ffe2b8"
      spotlightSize={420}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(55%_100%_at_50%_0%,rgb(255_226_184/0.16),transparent)] transition-opacity duration-1000 ${
          talar ? "opacity-100" : "opacity-0"
        }`}
      />
      <article aria-label={namn} className="relative">
        <header className="flex items-baseline justify-between gap-4">
          <h3 className="font-display text-text text-[1.75rem] leading-none font-semibold tracking-[-0.03em]">
            {namn}
          </h3>
          <p className="text-svag truncate text-xs">{modellnamn}</p>
        </header>
        <div
          aria-label={`Frågor till ${namn}`}
          className="bg-salong/60 mt-5 flex gap-1 rounded-full p-1"
          role="tablist"
        >
          {flikar.map((etikett, i) => {
            const l = lagen[i as 0 | 1];
            const vald = flik === i;
            return (
              <button
                aria-controls={`${id}-panel-${i}`}
                aria-selected={vald}
                className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full px-3 text-[0.85rem] transition-colors ${
                  vald ? "bg-sammet-2 text-text" : "text-svag hover:text-dov"
                }`}
                id={`${id}-flik-${i}`}
                key={etikett}
                onClick={() => setFlik(i as 0 | 1)}
                onKeyDown={tangent}
                ref={(el) => {
                  flikRefs.current[i] = el;
                }}
                role="tab"
                tabIndex={vald ? 0 : -1}
                type="button"
              >
                <span className="truncate">{etikett}</span>
                <Prick lage={l} />
              </button>
            );
          })}
        </div>
        <div className="mt-6">
          <Svar
            flikId={`${id}-flik-0`}
            fraga={0}
            korning={korning}
            onLage={lage0}
            panelId={`${id}-panel-0`}
            synlig={flik === 0}
            tjanst={tjanst}
          />
          <Svar
            flikId={`${id}-flik-1`}
            fraga={1}
            korning={korning}
            onLage={lage1}
            panelId={`${id}-panel-1`}
            synlig={flik === 1}
            tjanst={tjanst}
          />
        </div>
      </article>
    </SpotlightCard>
  );
}

function Prick({ lage }: { lage: Lage }) {
  if (lage.namns) {
    return (
      <span className="bg-ramp size-2 shrink-0 rounded-full shadow-[0_0_10px_rgb(255_181_71/0.8)]">
        <span className="sr-only">namnet nämns</span>
      </span>
    );
  }
  if (lage.fel) {
    return <span className="bg-fel size-2 shrink-0 rounded-full" />;
  }
  if (!lage.klar) {
    return (
      <span className="bg-ljus/80 size-2 shrink-0 animate-pulse rounded-full" />
    );
  }
  return null;
}

function uppraknat(delar: string[]) {
  return delar.length > 1
    ? `${delar.slice(0, -1).join(", ")} och ${delar.at(-1)}`
    : (delar[0] ?? "");
}

function klockslag(iso: string) {
  return new Date(iso).toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Scen({ korning }: { korning: Korning }) {
  const sparkRef = useRef<ClickSparkHandle>(null);
  const rotRef = useRef<HTMLDivElement>(null);
  const [lagen, setLagen] = useState<Record<string, Lage>>({});
  const [meddelande, setMeddelande] = useState("");

  const gnista = useCallback((el: Element) => {
    const rot = rotRef.current?.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    const spark = sparkRef.current;
    if (rot && spark) {
      spark.spark(
        box.left - rot.left + box.width / 2,
        box.top - rot.top + box.height / 2
      );
    }
  }, []);

  const lageFor = useCallback(
    (tjanst: Tjanst) => (fraga: 0 | 1, lage: Lage) => {
      const nyckel = `${tjanst}-${fraga}`;
      setLagen((forra) => {
        const gammalt = forra[nyckel] ?? TOMT;
        if (
          gammalt.klar === lage.klar &&
          gammalt.namns === lage.namns &&
          gammalt.fel === lage.fel
        ) {
          return forra;
        }
        if (lage.klar && !gammalt.klar) {
          setMeddelande(
            `${TJANSTER[tjanst].namn} har svarat på fråga ${fraga + 1}${lage.namns ? ` och nämner ${korning.foretag}` : ""}.`
          );
        }
        return { ...forra, [nyckel]: lage };
      });
    },
    [korning.foretag]
  );

  const [hanterare] = useState(() =>
    Object.fromEntries(TJANST_ORDNING.map((t) => [t, lageFor(t)]))
  );

  const alla = Object.values(lagen);
  const namns = alla.filter((l) => l.namns).length;
  const klara = alla.filter((l) => l.klar || l.fel).length;
  const total = TJANST_ORDNING.length * 2;

  return (
    <section aria-labelledby="scen-rubrik" className="relative">
      <div className="bg-salong/80 sticky top-2 z-20 rounded-2xl border border-[var(--linje)] px-5 py-3.5 backdrop-blur-md sm:top-3 sm:px-7 sm:py-4">
        <h2
          className="font-display text-text text-[clamp(1.6rem,6.5vw,2.6rem)] leading-[1.05] font-semibold tracking-[-0.03em]"
          id="scen-rubrik"
        >
          <span className="sr-only">
            {korning.foretag} nämns i {namns} av {total} svar
          </span>
          <span aria-hidden="true">
            {korning.foretag} nämns i{" "}
            <span
              className={`tabular-nums ${namns > 0 ? "tal-tands text-ramp" : ""}`}
              key={namns}
            >
              <CountUp
                duration={0.6}
                from={Math.max(0, namns - 1)}
                to={namns}
                trigger="load"
              />
            </span>{" "}
            av {total} svar
          </span>
        </h2>
        <p className="text-svag mt-1.5 text-sm tabular-nums">
          {klara < total
            ? `${klara} av ${total} svar klara · frågorna ställdes ${klockslag(korning.startad)}`
            : `Alla svar klara · frågorna ställdes ${klockslag(korning.startad)}`}
        </p>
      </div>
      <p aria-live="polite" className="sr-only">
        {meddelande}
      </p>
      <p aria-live="polite" className="sr-only">
        {korning.foretag} nämns i {namns} av {total} svar
      </p>

      <div className="relative mt-4" ref={rotRef}>
        <ClickSpark
          className="pointer-events-none absolute! inset-0 z-30"
          duration={700}
          glow={0.8}
          manual
          ref={sparkRef}
          sparkColor={["#ffb547", "#ffe2b8"]}
          sparkCount={12}
          sparkRadius={34}
          sparkSize={12}
        />
        <GnistaContext.Provider value={gnista}>
          <div className="grid gap-4 lg:grid-cols-2">
            {TJANST_ORDNING.map((tjanst) => (
              <Kort
                key={tjanst}
                korning={korning}
                lagen={[
                  lagen[`${tjanst}-0`] ?? TOMT,
                  lagen[`${tjanst}-1`] ?? TOMT,
                ]}
                onLage={hanterare[tjanst] as (f: 0 | 1, l: Lage) => void}
                tjanst={tjanst}
              />
            ))}
          </div>
        </GnistaContext.Provider>
      </div>

      {klara === total && (
        <p className="text-svag mt-8 max-w-[62ch] text-sm leading-relaxed">
          Svaren kom {klockslag(korning.startad)} från{" "}
          {uppraknat(TJANST_ORDNING.map((t) => TJANSTER[t].modellnamn))}. Varje
          tjänst fick två frågor med webbsökning. Samma tjänst kan svara
          annorlunda nästa gång.
        </p>
      )}
    </section>
  );
}

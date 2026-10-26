import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import ClickSpark, {
  type ClickSparkHandle,
} from "#/components/reactbits/ClickSpark";
import type { Kalla } from "#/lib/fragor";
import { TJANST_ORDNING, TJANSTER, type Tjanst } from "#/lib/modeller";
import { Svarstext } from "#/lib/svarstext";
import { Favicon } from "./favicon";

export type SvarStatus = "vantar" | "strommar" | "klar" | "fel";

export type SvarVy = {
  fragetext: string;
  text: string;
  kallor: Kalla[];
  status: SvarStatus;
  namns: boolean;
  omForsok?: () => void;
};

export type Station = { tjanst: Tjanst; svar: [SvarVy, SvarVy] };

type Val = { tjanst: Tjanst; fraga: 0 | 1 };

// Stationernas plats på skalan, i procent från vänster.
const PLATS: Record<Tjanst, number> = {
  chatgpt: 14,
  gemini: 38,
  claude: 62,
  perplexity: 86,
};

function Prick({ svar }: { svar: SvarVy[] }) {
  if (svar.some((s) => s.namns)) {
    return (
      <span className="bg-sandning size-2 rounded-full">
        <span className="sr-only">nämner företaget</span>
      </span>
    );
  }
  if (svar.some((s) => s.status === "fel")) {
    return <span className="bg-fel/70 size-2 rounded-full" />;
  }
  if (svar.some((s) => s.status === "strommar" || s.status === "vantar")) {
    return <span className="bg-bakelit/60 size-2 animate-pulse rounded-full" />;
  }
  return <span className="bg-bakelit/25 size-2 rounded-full" />;
}

function Kallor({ tjanst, kallor }: { tjanst: Tjanst; kallor: Kalla[] }) {
  return (
    <div className="mt-6 border-t border-[var(--linje-vav)] pt-4">
      <p className="text-vavdov text-sm">
        {TJANSTER[tjanst].namn} läste {kallor.length}{" "}
        {kallor.length === 1 ? "källa" : "källor"}
      </p>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {kallor.map((kalla, i) => (
          <li
            className="kalla-in min-w-0"
            key={kalla.url}
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <a
              className="bg-vav-2 text-vavdov hover:text-vavtext flex items-center gap-2.5 rounded-xl py-2 pr-3.5 pl-2.5 text-[0.8rem] transition-colors hover:bg-[#25201c]"
              href={kalla.url}
              rel="noopener noreferrer nofollow"
              target="_blank"
              title={kalla.titel}
            >
              <Favicon doman={kalla.doman} />
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="text-vavtext truncate">{kalla.titel}</span>
                {kalla.titel === kalla.doman ? null : (
                  <span className="text-vavdov truncate text-[0.75rem]">
                    {kalla.doman}
                  </span>
                )}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Mottagaren: frekvensskalan med fyra stationer, frågeväljaren och väven där
// svaret textas. Nålen följer den station som säger namnet tills besökaren
// själv vrider på skalan.
export function Mottagare({
  foretag,
  stationer,
  rubrik,
  status,
  sander,
}: {
  foretag: string;
  stationer: Station[];
  rubrik: ReactNode;
  status: ReactNode;
  sander: boolean;
}) {
  const id = useId();
  const [val, setVal] = useState<Val>({ tjanst: "chatgpt", fraga: 0 });
  const [styrd, setStyrd] = useState(false);
  const vavRef = useRef<HTMLDivElement>(null);
  const sparkRef = useRef<ClickSparkHandle>(null);
  const foljer = useRef(true);
  const gnistade = useRef(new Set<string>());
  const stationRefs = useRef<Partial<Record<Tjanst, HTMLButtonElement | null>>>(
    {}
  );

  const station =
    stationer.find((s) => s.tjanst === val.tjanst) ?? stationer[0];
  const visat = station?.svar[val.fraga];

  // Nålen svänger till en tjänst första gången den säger namnet, tills
  // besökaren själv har valt station.
  const namnLage = stationer
    .flatMap((s) => s.svar.map((v, f) => (v.namns ? `${s.tjanst}-${f}` : "")))
    .join(",");
  const forra = useRef("");
  useEffect(() => {
    const nya = namnLage
      .split(",")
      .filter((n) => n && !forra.current.split(",").includes(n));
    forra.current = namnLage;
    const [forsta] = nya;
    if (!(forsta && !styrd)) {
      return;
    }
    const [tjanst, fraga] = forsta.split("-") as [Tjanst, string];
    setVal({ tjanst, fraga: Number(fraga) as 0 | 1 });
  }, [namnLage, styrd]);

  // Väven följer texten nedåt medan den strömmar, om besökaren inte har
  // scrollat upp själv.
  const textLangd = visat?.text.length ?? 0;
  const lage = visat?.status;
  useEffect(() => {
    const vav = vavRef.current;
    if (vav && foljer.current && lage === "strommar" && textLangd > 0) {
      vav.scrollTop = vav.scrollHeight;
    }
  }, [textLangd, lage]);

  // När svaret är klart, eller när besökaren byter till ett klart svar, visar
  // väven första stället där namnet sägs, en tredjedel ner. Annars början.
  const nyckel = `${val.tjanst}-${val.fraga}`;
  // biome-ignore lint/correctness/useExhaustiveDependencies: nyckel flyttar väven när besökaren byter svar.
  useEffect(() => {
    const vav = vavRef.current;
    if (!vav || lage !== "klar") {
      return;
    }
    const namn = vav.querySelector("mark.namn");
    vav.scrollTop = namn
      ? namn.getBoundingClientRect().top -
        vav.getBoundingClientRect().top +
        vav.scrollTop -
        vav.clientHeight / 3
      : 0;
  }, [lage, nyckel]);

  // Gnistan första gången namnet syns i väven för ett svar.
  const namnsNu = visat?.namns ?? false;
  useEffect(() => {
    if (!namnsNu || gnistade.current.has(nyckel)) {
      return;
    }
    const vav = vavRef.current;
    const forsta = vav?.querySelector("mark.namn");
    const spark = sparkRef.current;
    if (vav && forsta && spark) {
      gnistade.current.add(nyckel);
      const ram = vav.getBoundingClientRect();
      const box = forsta.getBoundingClientRect();
      requestAnimationFrame(() =>
        spark.spark(
          box.left - ram.left + box.width / 2,
          box.top - ram.top + box.height / 2
        )
      );
    }
  }, [namnsNu, nyckel]);

  const valj = (tjanst: Tjanst, fraga: 0 | 1 = val.fraga) => {
    setStyrd(true);
    foljer.current = true;
    setVal({ tjanst, fraga });
  };

  const tangent = (e: KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") {
      return;
    }
    e.preventDefault();
    const i = TJANST_ORDNING.indexOf(val.tjanst);
    const steg = e.key === "ArrowRight" ? 1 : -1;
    const ny =
      TJANST_ORDNING[
        (i + steg + TJANST_ORDNING.length) % TJANST_ORDNING.length
      ] ?? "chatgpt";
    valj(ny);
    stationRefs.current[ny]?.focus();
  };

  if (!(station && visat)) {
    return null;
  }

  return (
    <section
      aria-label="Mottagaren"
      className="bg-glas border-bakelit overflow-hidden rounded-[20px] border-[1.5px]"
      data-sander={sander}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-5 pt-4 pb-3 sm:px-6">
        <div className="min-w-0">{rubrik}</div>
        <div className="text-dov shrink-0 text-[0.8rem] sm:pt-1">{status}</div>
      </header>

      <div className="px-5 sm:px-6">
        <div
          aria-label="Välj tjänst"
          className="relative h-[5.25rem] rounded-xl border border-[var(--linje-stark)] bg-[length:100%_14px] bg-[position:0_12px] bg-[repeating-linear-gradient(90deg,var(--color-bakelit)_0_1px,transparent_1px_12px)] bg-no-repeat"
          role="tablist"
        >
          {stationer.map((s) => {
            const vald = s.tjanst === val.tjanst;
            return (
              <button
                aria-controls={`${id}-vav`}
                aria-selected={vald}
                className={`absolute top-[34px] flex -translate-x-1/2 flex-col items-center gap-1.5 rounded-md px-1.5 py-1 text-[0.8rem] transition-colors sm:text-[0.85rem] ${
                  vald
                    ? "text-bakelit font-semibold"
                    : "text-dov hover:text-bakelit"
                }`}
                id={`${id}-${s.tjanst}`}
                key={s.tjanst}
                onClick={() => valj(s.tjanst)}
                onKeyDown={tangent}
                ref={(el) => {
                  stationRefs.current[s.tjanst] = el;
                }}
                role="tab"
                style={{ left: `${PLATS[s.tjanst]}%` }}
                tabIndex={vald ? 0 : -1}
                type="button"
              >
                {TJANSTER[s.tjanst].namn}
                <Prick svar={s.svar} />
              </button>
            );
          })}
          <span
            aria-hidden="true"
            className="nal bg-sandning absolute top-1.5 h-[26px] w-[3px] -translate-x-1/2 rounded-full"
            style={{ left: `${PLATS[val.tjanst]}%` }}
          />
        </div>

        <div className="mt-3 flex gap-1 rounded-full bg-[var(--linje)] p-1">
          {(["Vem rekommenderas?", `Om ${foretag}`] as const).map(
            (etikett, i) => {
              const vald = val.fraga === i;
              return (
                <button
                  aria-pressed={vald}
                  className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full px-3 text-[0.85rem] transition-colors ${
                    vald
                      ? "bg-glas text-bakelit shadow-[0_1px_2px_rgb(26_23_20/0.12)]"
                      : "text-dov hover:text-bakelit"
                  }`}
                  key={etikett}
                  onClick={() => valj(val.tjanst, i as 0 | 1)}
                  type="button"
                >
                  <span className="truncate">{etikett}</span>
                  {station.svar[i as 0 | 1].namns ? (
                    <span className="bg-sandning size-1.5 shrink-0 rounded-full" />
                  ) : null}
                </button>
              );
            }
          )}
        </div>
      </div>

      <div
        aria-labelledby={`${id}-${station.tjanst}`}
        className="vav bg-vav relative mt-4 bg-[length:6px_6px] bg-[radial-gradient(rgb(255_255_255/0.05)_1px,transparent_1.5px)]"
        id={`${id}-vav`}
        role="tabpanel"
      >
        <ClickSpark
          className="pointer-events-none absolute! inset-0 z-10"
          duration={700}
          manual
          ref={sparkRef}
          sparkColor={["#ff8a6e", "#f3ece1"]}
          sparkCount={10}
          sparkRadius={30}
          sparkSize={11}
        />
        <div
          aria-live="off"
          className="h-[24rem] overflow-y-auto overscroll-contain [mask-image:linear-gradient(to_bottom,transparent,#000_1.25rem)] px-5 py-5 sm:h-[26rem] sm:px-6"
          onScroll={(e) => {
            const el = e.currentTarget;
            foljer.current =
              el.scrollHeight - el.scrollTop - el.clientHeight < 40;
          }}
          ref={vavRef}
        >
          <p className="text-vavdov text-[0.95rem] italic">
            ”{visat.fragetext}”
          </p>
          <div className="text-vavtext/90 mt-4 text-[1rem] leading-[1.65] [overflow-wrap:anywhere]">
            {visat.text ? <Svarstext namn={foretag} text={visat.text} /> : null}
            {visat.status === "vantar" ||
            (visat.status === "strommar" && !visat.text) ? (
              <p className="text-vavtext my-3">
                <span className="sr-only">
                  {TJANSTER[station.tjanst].namn} söker och skriver
                </span>
                <span aria-hidden="true" className="markor" />
              </p>
            ) : null}
            {visat.status === "strommar" && visat.text ? (
              <span aria-hidden="true" className="markor text-vavtext ml-1" />
            ) : null}
          </div>
          {visat.status === "fel" ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="text-sandning-ljus">
                {TJANSTER[station.tjanst].namn} svarade inte den här gången.
              </p>
              {visat.omForsok ? (
                <button
                  className="text-vavtext hover:border-vavtext rounded-full border border-[var(--linje-vav)] px-4 py-1.5 text-sm transition-colors"
                  onClick={visat.omForsok}
                  type="button"
                >
                  Fråga igen
                </button>
              ) : null}
            </div>
          ) : null}
          {visat.kallor.length > 0 ? (
            <Kallor kallor={visat.kallor} tjanst={station.tjanst} />
          ) : null}
        </div>
      </div>
    </section>
  );
}

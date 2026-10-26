import { useEffect, useState } from "react";
import type { SparatSvar } from "#/lib/analys";
import { fragor } from "#/lib/fragor";
import { TJANST_ORDNING } from "#/lib/modeller";
import { namnsI } from "#/lib/svarstext";
import { Mottagare, type Station, type SvarVy } from "./mottagare";

type Exempeldata = {
  foretag: string;
  bransch: string;
  ort: string;
  skapad: string;
  svar: Omit<SparatSvar, "kostnad">[];
};

const TECKEN_PER_STEG = 18;
const STEG_MS = 70;

function datum(iso: string) {
  return new Date(iso).toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Spelar upp en riktig, sparad körning (kemero, webbyrå i Västerås) innan
// besökaren frågar själv. Inga anrop görs. Vid reducerad rörelse visas allt direkt.
export function Exempel() {
  const [data, setData] = useState<Exempeldata | null>(null);
  const [steg, setSteg] = useState(0);
  const [omgang, setOmgang] = useState(0);

  useEffect(() => {
    import("#/data/exempel-kemero.json").then((m) =>
      setData(m.default as unknown as Exempeldata)
    );
  }, []);

  const langst = data ? Math.max(...data.svar.map((s) => s.text.length)) : 0;
  const slutsteg = Math.ceil(langst / TECKEN_PER_STEG) + 40;

  // biome-ignore lint/correctness/useExhaustiveDependencies: omgang startar uppspelningen igen när besökaren väljer Spela igen.
  useEffect(() => {
    if (!data) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSteg(slutsteg);
      return;
    }
    setSteg(0);
    const id = setInterval(() => {
      setSteg((s) => {
        if (s >= slutsteg) {
          clearInterval(id);
        }
        return s + 1;
      });
    }, STEG_MS);
    return () => clearInterval(id);
  }, [data, slutsteg, omgang]);

  if (!data) {
    return (
      <div className="bg-glas border-bakelit h-[38rem] rounded-[20px] border-[1.5px]" />
    );
  }

  const { foretag } = data;
  const stationer: Station[] = TJANST_ORDNING.map((tjanst, t) => {
    const vyer = ([0, 1] as const).map((fraga): SvarVy => {
      const sparat = data.svar.find(
        (s) => s.tjanst === tjanst && s.fraga === fraga
      );
      // Tjänsterna börjar svara lite efter varandra, som i en riktig körning.
      const start = t * 6 + fraga * 14;
      const tecken = Math.max(0, (steg - start) * TECKEN_PER_STEG);
      const hela = sparat?.text ?? "";
      const text = hela.slice(0, tecken);
      const klar = tecken >= hela.length && hela.length > 0;
      let status: SvarVy["status"] = "vantar";
      if (klar) {
        status = "klar";
      } else if (text) {
        status = "strommar";
      }
      return {
        fragetext: fragor(data)[fraga],
        text,
        kallor: klar ? (sparat?.kallor ?? []) : [],
        status,
        namns: namnsI(text, foretag),
      };
    }) as [SvarVy, SvarVy];
    return { tjanst, svar: vyer };
  });
  const spelar = steg < slutsteg;
  const namns = stationer.flatMap((s) => s.svar).filter((s) => s.namns).length;

  return (
    <div>
      <Mottagare
        foretag={foretag}
        rubrik={
          <div>
            <p className="text-[1.05rem] leading-tight font-semibold tracking-[-0.01em]">
              {foretag} nämns i <span className="tabular-nums">{namns}</span> av
              8 svar
            </p>
            <p className="text-dov mt-1 text-[0.8rem]">
              Exempel: {foretag}, {data.bransch} i {data.ort}
            </p>
          </div>
        }
        sander={spelar}
        stationer={stationer}
        status={
          spelar ? (
            "Spelas upp"
          ) : (
            <button
              className="text-bakelit underline decoration-[var(--linje-stark)] underline-offset-4"
              onClick={() => setOmgang((o) => o + 1)}
              type="button"
            >
              Spela igen
            </button>
          )
        }
      />
      <p className="text-svag mt-3 text-sm">
        En riktig körning från {datum(data.skapad)}. Svaren kan bli andra nästa
        gång.
      </p>
    </div>
  );
}

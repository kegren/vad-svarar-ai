import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Dela } from "#/components/dela";
import { Mottagare, type Station, type SvarVy } from "#/components/mottagare";
import { Fot, Ordmarke } from "#/components/ram";
import { SparatResultat } from "#/components/resultat";
import { svarsnyckel } from "#/lib/analys";
import { fragor } from "#/lib/fragor";
import { hamtaResultat } from "#/lib/korning.functions";
import { TJANST_ORDNING, TJANSTER } from "#/lib/modeller";
import { namnsI } from "#/lib/svarstext";
import { useLasbarhet } from "#/lib/use-lasbarhet";

const ID = /^[0-9a-f]{32}$/u;

// Datum och tid i svensk tid, så att servern och webbläsaren skriver samma sak.
function nar(iso: string) {
  const d = new Date(iso);
  const datum = d.toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Stockholm",
  });
  const tid = d.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Stockholm",
  });
  return { datum, tid };
}

function antalNamns(
  korning: Awaited<ReturnType<typeof hamtaResultat>>["korning"]
) {
  return Object.values(korning.svar).filter(
    (s) => !s.fel && namnsI(s.text, korning.foretag)
  ).length;
}

// Delningssidan (PLAN.md avsnitt 5.6): den sparade körningen, renderad på
// servern och utan nya anrop. Den indexeras inte.
export const Route = createFileRoute("/r/$id")({
  loader: ({ params }) => {
    if (!ID.test(params.id)) {
      throw notFound();
    }
    return hamtaResultat({ data: { id: params.id } });
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ name: "robots", content: "noindex" }] };
    }
    const { korning, origin } = loaderData;
    const titel = `${korning.foretag} nämns i ${antalNamns(korning)} av 8 AI-svar`;
    const beskrivning = `Vad ChatGPT, Gemini, Claude och Perplexity svarade om ${korning.foretag}, ${korning.bransch} i ${korning.ort}, den ${nar(korning.skapad).datum}.`;
    const bild = `${origin}/api/bild/${korning.id}`;
    return {
      meta: [
        { title: `${titel} · Vad svarar AI?` },
        { name: "robots", content: "noindex" },
        { name: "description", content: beskrivning },
        { property: "og:title", content: titel },
        { property: "og:description", content: beskrivning },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `${origin}/r/${korning.id}` },
        { property: "og:image", content: bild },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: bild },
      ],
    };
  },
  notFoundComponent: Saknas,
  component: Delningssida,
});

function Saknas() {
  return (
    <>
      <header className="mx-auto flex w-full max-w-6xl items-center px-4 pt-5 sm:px-6">
        <Ordmarke />
      </header>
      <main className="mx-auto w-full max-w-4xl px-4 pt-16 pb-24 sm:px-6">
        <h1 className="font-display text-[clamp(2rem,7vw,3rem)] leading-[1.05] font-semibold tracking-[-0.03em]">
          Resultatet finns inte längre
        </h1>
        <p className="text-dov mt-4 max-w-[52ch]">
          Svaren sparas i 30 dagar. Du kan ställa frågorna igen, det tar en
          minut.
        </p>
        <Link
          className="bg-bakelit text-glas mt-8 inline-flex h-12 items-center rounded-full px-6 font-semibold"
          to="/"
        >
          Fråga AI om ett företag
        </Link>
      </main>
      <Fot />
    </>
  );
}

function Delningssida() {
  const { korning } = Route.useLoaderData();
  const las = useLasbarhet(korning.id, korning.las);
  const { datum, tid } = nar(korning.skapad);
  const namns = antalNamns(korning);
  const fragetexter = fragor(korning);

  const stationer: Station[] = TJANST_ORDNING.map((tjanst) => ({
    tjanst,
    svar: ([0, 1] as const).map((fraga): SvarVy => {
      const sparat = korning.svar[svarsnyckel(tjanst, fraga)];
      return {
        fragetext: fragetexter[fraga],
        text: sparat?.text ?? "",
        kallor: sparat?.kallor ?? [],
        status: !sparat || sparat.fel ? "fel" : "klar",
        namns: Boolean(sparat && namnsI(sparat.text, korning.foretag)),
      };
    }) as [SvarVy, SvarVy],
  }));

  return (
    <>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 pt-5 sm:px-6">
        <Ordmarke />
        <Link
          className="hover:border-bakelit rounded-full border border-[var(--linje-stark)] px-4 py-2 text-sm transition-colors"
          to="/"
        >
          Fråga om ditt företag
        </Link>
      </header>
      <main className="mx-auto w-full max-w-4xl px-4 pt-8 pb-20 sm:px-6 sm:pt-12">
        <p className="text-dov">
          <span className="text-bakelit font-semibold">{korning.foretag}</span>{" "}
          · {korning.bransch} · {korning.ort}
        </p>
        <p className="text-svag mt-1 text-sm">
          Frågorna ställdes den {datum} klockan {tid}.
        </p>

        <div className="mt-6">
          <Mottagare
            foretag={korning.foretag}
            rubrik={
              <h1 className="text-[clamp(1.35rem,5.5vw,1.9rem)] leading-[1.08] font-semibold tracking-[-0.03em]">
                {korning.foretag} nämns i{" "}
                <span className="tabular-nums">{namns}</span> av 8 svar
              </h1>
            }
            sander={false}
            stationer={stationer}
            status={<span className="tabular-nums">Sparad {datum}</span>}
          />
        </div>
        <p className="text-svag mt-3 text-sm">
          Frågorna ställdes till{" "}
          {TJANST_ORDNING.map((t) => TJANSTER[t].modellnamn).join(", ")} med
          webbsökning. Svaren kan bli andra nästa gång.
        </p>

        <div className="mt-8">
          <Dela foretag={korning.foretag} id={korning.id} />
        </div>

        {korning.analys ? (
          <SparatResultat
            korning={{
              ...korning,
              hemsida: korning.hemsida ?? undefined,
              startad: korning.skapad,
            }}
            las={las}
            namns={namns}
            resultat={korning.analys}
          />
        ) : null}

        <div className="mt-20 border-t border-[var(--linje)] pt-10">
          <p className="font-display text-[1.6rem] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[2rem]">
            Vad svarar AI om ditt företag?
          </p>
          <p className="text-dov mt-3 max-w-[52ch]">
            Fyra AI-tjänster får två kundfrågor var. Svaren kommer medan du
            tittar.
          </p>
          <Link
            className="bg-bakelit text-glas mt-6 inline-flex h-14 items-center rounded-full px-9 text-[1.15rem] font-semibold transition-colors hover:bg-[#2e2a26]"
            to="/"
          >
            Fråga AI
          </Link>
        </div>
      </main>
      <Fot />
    </>
  );
}

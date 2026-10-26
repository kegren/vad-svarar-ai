import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { hallIhop } from "#/lib/hall-ihop";
import type { Kontroll, Status } from "#/lib/lasbarhet";
import type { LasbarhetTillstand } from "#/lib/use-lasbarhet";
import { useSyns } from "#/lib/use-syns";

const FARG: Record<Status, string> = {
  ok: "text-bakelit",
  varning: "text-dov",
  fel: "text-fel",
  okand: "text-svag",
};

const ETIKETT: Record<Status, string> = {
  ok: "Klarar",
  varning: "Varning",
  fel: "Klarar inte",
  okand: "Okänt",
};

// Bocken ritas när listan syns. Kryss för fel, streck för varning och okänt.
function Tecken({
  status,
  syns,
  fordrojning,
  storlek = 28,
}: {
  status: Status;
  syns: boolean;
  fordrojning: number;
  storlek?: number;
}) {
  const banor: Record<Status, string[]> = {
    ok: ["M6 14.5l5 5L22 8.5"],
    fel: ["M8 8l12 12", "M20 8L8 20"],
    varning: ["M7 14h14"],
    // Okänt får bara ringen: kontrollen kunde inte göras.
    okand: [],
  };
  return (
    <svg
      aria-hidden="true"
      className={`shrink-0 ${FARG[status]}`}
      fill="none"
      height={storlek}
      viewBox="0 0 28 28"
      width={storlek}
    >
      <circle
        className="opacity-25"
        cx="14"
        cy="14"
        r="13"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {banor[status].map((d, i) => (
        <path
          className={`rita ${syns ? "syns" : ""}`}
          d={d}
          key={d}
          pathLength={1}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.25"
          style={{ transitionDelay: `${fordrojning + i * 120}ms` }}
        />
      ))}
    </svg>
  );
}

function Rad({
  kontroll,
  syns,
  index,
}: {
  kontroll: Kontroll;
  syns: boolean;
  index: number;
}) {
  return (
    <li className="grid grid-cols-[28px_1fr] gap-x-4 py-5">
      <Tecken fordrojning={index * 160} status={kontroll.status} syns={syns} />
      <div>
        <p className="text-bakelit text-[1.15rem] leading-snug font-semibold">
          <span className="sr-only">{ETIKETT[kontroll.status]}: </span>
          {hallIhop(kontroll.rubrik, "rubrik")}
        </p>
        <p className="text-dov mt-1 max-w-[60ch] leading-relaxed">
          {hallIhop(kontroll.text, "text")}
        </p>
        {kontroll.detaljer.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {kontroll.detaljer.map((d) => (
              <li
                className="text-dov flex items-center gap-1.5 text-sm"
                key={d.etikett}
              >
                <Tecken
                  fordrojning={index * 160 + 300}
                  status={d.status}
                  storlek={16}
                  syns={syns}
                />
                <span>
                  <span className="sr-only">{ETIKETT[d.status]}: </span>
                  {d.etikett}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}

function Formular({
  forslag,
  tillstand,
  onAvbryt,
  onSkicka,
}: {
  forslag: string | null;
  tillstand: LasbarhetTillstand;
  onAvbryt?: () => void;
  onSkicka: () => void;
}) {
  const id = useId();
  const [varde, setVarde] = useState(forslag ?? "");
  const skicka = (e: FormEvent) => {
    e.preventDefault();
    onSkicka();
    tillstand.kor(varde);
  };
  return (
    <form className="max-w-xl" noValidate onSubmit={skicka}>
      <p className="text-dov max-w-[52ch] leading-relaxed">
        {hallIhop(
          forslag
            ? `Vi hittade ${forslag} bland källorna. Om det är företagets hemsida kan vi kontrollera om AI-tjänsterna kan läsa den.`
            : "Fyll i hemsidan så kontrollerar vi om AI-tjänsterna kan läsa den."
        )}
      </p>
      <div className="mt-4 flex flex-wrap gap-2.5">
        <label className="sr-only" htmlFor={id}>
          Hemsida
        </label>
        <input
          aria-describedby={tillstand.fel ? `${id}-fel` : undefined}
          aria-invalid={Boolean(tillstand.fel)}
          autoComplete="url"
          className={`bg-glas text-bakelit h-12 min-w-0 flex-1 basis-[14rem] rounded-full border px-5 transition-colors focus:outline-none ${
            tillstand.fel
              ? "border-fel focus:border-fel"
              : "focus:border-bakelit border-[var(--linje-stark)]"
          }`}
          id={id}
          inputMode="url"
          onChange={(e) => setVarde(e.target.value)}
          placeholder="Hemsida, t.ex. foretaget.se"
          type="url"
          value={varde}
        />
        <button
          className="bg-bakelit text-glas h-12 rounded-full px-6 font-semibold transition-colors hover:bg-[#2e2a26] disabled:cursor-wait disabled:opacity-70"
          disabled={tillstand.laddar}
          type="submit"
        >
          {tillstand.laddar ? "Kontrollerar…" : "Kontrollera"}
        </button>
        {onAvbryt ? (
          <button
            className="text-dov hover:text-bakelit h-12 rounded-full px-4 transition-colors"
            onClick={onAvbryt}
            type="button"
          >
            Avbryt
          </button>
        ) : null}
      </div>
      {tillstand.fel ? (
        <p className="text-fel mt-3" id={`${id}-fel`} role="alert">
          {tillstand.fel}
        </p>
      ) : null}
    </form>
  );
}

const WWW = /^www\./u;

// Svensk tid, så att servern och webbläsaren skriver samma klockslag på delningssidan.
function klockslag(iso: string) {
  return new Date(iso).toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Stockholm",
  });
}

export function LasbarhetIngress() {
  return (
    <p className="text-dov mt-2 mb-6 max-w-[56ch]">
      {hallIhop(
        "Fyra kontroller av vad AI-tjänsternas robotar ser när de hämtar hemsidan."
      )}
    </p>
  );
}

function Lista({ kontroller }: { kontroller: Kontroll[] }) {
  const listaRef = useRef<HTMLUListElement>(null);
  const syns = useSyns(listaRef);
  return (
    <ul
      className="mt-2 divide-y divide-[var(--linje)] border-y border-[var(--linje)]"
      ref={listaRef}
    >
      {kontroller.map((k, i) => (
        <Rad index={i} key={k.id} kontroll={k} syns={syns} />
      ))}
    </ul>
  );
}

export function Lasbarhet({
  tillstand,
  forslag,
  sparad = false,
}: {
  tillstand: LasbarhetTillstand;
  forslag: string | null;
  // På delningssidan visas den sparade kontrollen och kan inte köras om.
  sparad?: boolean;
}) {
  const { data, laddar } = tillstand;
  const [andrar, setAndrar] = useState(false);
  // Har besökaren använt formuläret står det kvar medan kontrollen körs, så att
  // det som skrevs finns kvar om något går fel.
  const [franFormular, setFranFormular] = useState(false);

  // En ny kontroll stänger formuläret för en annan adress.
  const kontrollerad = data?.kontrollerad;
  useEffect(() => {
    if (kontrollerad) {
      setAndrar(false);
    }
  }, [kontrollerad]);

  if (!data || andrar) {
    if (laddar && !franFormular && !andrar) {
      return (
        <p className="text-dov flex items-center gap-3">
          <span aria-hidden="true" className="markor" />
          Hämtar robots.txt, llms.txt och startsidan.
        </p>
      );
    }
    return (
      <Formular
        forslag={andrar ? null : forslag}
        onAvbryt={andrar ? () => setAndrar(false) : undefined}
        onSkicka={() => setFranFormular(true)}
        tillstand={tillstand}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-svag text-sm">
          {new URL(data.url).hostname.replace(WWW, "")}, kontrollerad{" "}
          {klockslag(data.kontrollerad)}
        </p>
        {sparad ? null : (
          <button
            className="text-svag hover:text-dov text-sm underline decoration-[var(--linje-stark)] underline-offset-4 transition-colors"
            onClick={() => setAndrar(true)}
            type="button"
          >
            Kontrollera en annan adress
          </button>
        )}
      </div>
      <Lista kontroller={data.kontroller} />
      <p className="mt-6 max-w-[64ch] text-[0.95rem] leading-relaxed">
        <a
          className="text-svag hover:text-dov group transition-colors"
          data-umami-event="klick_kemero"
          data-umami-event-plats="besiktning"
          href="https://kemero.se/besiktigad-hemsida"
        >
          Vill du pröva hela hemsidan på tjugo punkter? Besiktiga den gratis på
          kemero.se
          <svg
            aria-hidden="true"
            className="ml-1.5 inline-block translate-y-[-1px] transition-transform group-hover:translate-x-0.5"
            fill="none"
            height="14"
            viewBox="0 0 16 16"
            width="14"
          >
            <path
              d="M3 8h9M8.5 4.5L12 8l-3.5 3.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        </a>
      </p>
    </div>
  );
}

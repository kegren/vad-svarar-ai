import { type FormEvent, useId, useRef, useState } from "react";
import Magnet from "#/components/reactbits/Magnet";
import { type Foretag, ForetagSchema } from "#/lib/fragor";
import { Turnstile, type TurnstileHandle } from "./turnstile";

type Falt = Foretag & { hemsida: string };

export type Fraga = Falt & { turnstile: string };

const FALT_FEL: Record<keyof Foretag, string> = {
  foretag: "Skriv företagets namn.",
  bransch: "Skriv vad företaget gör, till exempel rörmokare.",
  ort: "Skriv orten där kunderna finns.",
};

function Chip({
  etikett,
  varde,
  onChange,
  platshallare,
  fel,
  typ = "text",
  autoComplete,
  bred = false,
}: {
  etikett: string;
  varde: string;
  onChange: (v: string) => void;
  platshallare: string;
  fel?: string;
  typ?: "text" | "url";
  autoComplete?: string;
  bred?: boolean;
}) {
  const id = useId();
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col ${bred ? "basis-full sm:basis-[14rem]" : "basis-[9.5rem]"}`}
    >
      <label className="sr-only" htmlFor={id}>
        {etikett}
      </label>
      <input
        aria-describedby={fel ? `${id}-fel` : undefined}
        aria-invalid={Boolean(fel)}
        autoComplete={autoComplete}
        className={`bg-glas text-bakelit h-12 w-full rounded-full border px-5 text-[1rem] transition-colors focus:outline-none ${
          fel
            ? "border-fel focus:border-fel"
            : "focus:border-bakelit border-[var(--linje-stark)]"
        }`}
        id={id}
        inputMode={typ === "url" ? "url" : "text"}
        onChange={(e) => onChange(e.target.value)}
        placeholder={platshallare}
        type={typ}
        value={varde}
      />
      {fel ? (
        <p className="text-fel mt-1.5 px-5 text-sm" id={`${id}-fel`}>
          {fel}
        </p>
      ) : null}
    </div>
  );
}

export function Formular({
  start,
  onFraga,
  skickar = false,
  serverfel,
  webbplatsnyckel,
  slut = null,
}: {
  start?: Partial<Falt>;
  onFraga: (fraga: Fraga) => Promise<void>;
  skickar?: boolean;
  serverfel?: string;
  webbplatsnyckel: string;
  // Meddelandet när dygnsbudgeten är slut. Då går det inte att fråga.
  slut?: string | null;
}) {
  const namnId = useId();
  const [falt, setFalt] = useState<Falt>({
    foretag: start?.foretag ?? "",
    bransch: start?.bransch ?? "",
    ort: start?.ort ?? "",
    hemsida: start?.hemsida ?? "",
  });
  const [fel, setFel] = useState<Partial<Record<keyof Foretag, string>>>({});
  const oppen = falt.foretag.trim().length >= 2;
  const [token, setToken] = useState("");
  const [utanToken, setUtanToken] = useState(false);
  const turnstile = useRef<TurnstileHandle>(null);

  const satt = (nyckel: keyof Falt) => (v: string) => {
    setFalt((f) => ({ ...f, [nyckel]: v }));
    setFel((f) => ({ ...f, [nyckel]: undefined }));
  };

  const skicka = async (e: FormEvent) => {
    e.preventDefault();
    const resultat = ForetagSchema.safeParse(falt);
    if (!resultat.success) {
      const nya: Partial<Record<keyof Foretag, string>> = {};
      for (const fraga of resultat.error.issues) {
        const nyckel = fraga.path[0] as keyof Foretag;
        nya[nyckel] = FALT_FEL[nyckel];
      }
      setFel(nya);
      return;
    }
    if (!token) {
      setUtanToken(true);
      return;
    }
    setUtanToken(false);
    await onFraga({
      ...resultat.data,
      hemsida: falt.hemsida.trim(),
      turnstile: token,
    });
    // En token gäller bara en gång. Formuläret kan redan ha avmonterats.
    // biome-ignore lint/suspicious/noUnnecessaryConditions: ref.current är null efter avmontering.
    turnstile.current?.aterstall();
  };

  return (
    <form className="w-full" noValidate onSubmit={skicka}>
      <label className="sr-only" htmlFor={namnId}>
        Företagets namn
      </label>
      <input
        aria-describedby={fel.foretag ? `${namnId}-fel` : undefined}
        aria-invalid={Boolean(fel.foretag)}
        autoComplete="organization"
        className={`bg-glas font-display text-bakelit h-14 w-full rounded-full border px-6 text-[1.25rem] tracking-[-0.01em] transition-colors focus:outline-none sm:h-[4.5rem] sm:px-7 sm:text-[1.5rem] ${
          fel.foretag
            ? "border-fel focus:border-fel"
            : "focus:border-bakelit border-[var(--linje-stark)]"
        }`}
        id={namnId}
        onChange={(e) => satt("foretag")(e.target.value)}
        placeholder="Företagets namn"
        type="text"
        value={falt.foretag}
      />
      {fel.foretag ? (
        <p className="text-fel mt-1.5 px-7 text-sm" id={`${namnId}-fel`}>
          {fel.foretag}
        </p>
      ) : null}

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-ut)] ${
          oppen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
        inert={!oppen}
      >
        <div className="overflow-hidden">
          <div className="flex flex-wrap gap-2.5 pt-3">
            <Chip
              bred
              etikett="Bransch"
              fel={fel.bransch}
              onChange={satt("bransch")}
              platshallare="Bransch, t.ex. rörmokare"
              varde={falt.bransch}
            />
            <Chip
              autoComplete="address-level2"
              etikett="Ort"
              fel={fel.ort}
              onChange={satt("ort")}
              platshallare="Ort"
              varde={falt.ort}
            />
            <Chip
              autoComplete="url"
              etikett="Hemsida, valfri"
              onChange={satt("hemsida")}
              platshallare="Hemsida (valfri)"
              typ="url"
              varde={falt.hemsida}
            />
          </div>
          {oppen ? (
            <Turnstile
              onToken={(t) => {
                setToken(t);
                if (t) {
                  setUtanToken(false);
                }
              }}
              ref={turnstile}
              webbplatsnyckel={webbplatsnyckel}
            />
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-x-4 sm:mt-6 sm:gap-x-5">
        <Magnet magnetStrength={3} padding={60}>
          <button
            aria-busy={skickar}
            className={`bg-bakelit font-display text-glas h-14 rounded-full px-9 text-[1.15rem] font-semibold tracking-[-0.01em] whitespace-nowrap transition-[background-color,transform,opacity] hover:bg-[#2e2a26] active:scale-[0.98] disabled:opacity-70 ${slut ? "disabled:cursor-not-allowed" : "disabled:cursor-wait"}`}
            disabled={skickar || Boolean(slut)}
            type="submit"
          >
            {skickar ? "Ställer frågorna…" : "Fråga AI"}
          </button>
        </Magnet>
        <p className="text-dov max-w-[30ch] min-w-0 text-[0.8rem] leading-snug sm:text-[0.95rem]">
          Fyra AI-tjänster får två kundfrågor var. Svaren kommer medan du
          tittar.
        </p>
      </div>
      {slut || serverfel || utanToken ? (
        <p
          className={`mt-4 ${slut ? "text-bakelit" : "text-fel"}`}
          role="alert"
        >
          {slut ??
            serverfel ??
            "Kontrollen att du är en människa är inte klar än. Vänta några sekunder och försök igen."}
        </p>
      ) : null}
    </form>
  );
}

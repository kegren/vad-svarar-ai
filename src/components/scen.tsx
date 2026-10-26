import { fetchServerSentEvents, useChat } from "@tanstack/ai-react";
import { useEffect, useRef, useState } from "react";
import CountUp from "#/components/reactbits/CountUp";
import { type Foretag, fragor, type Kalla } from "#/lib/fragor";
import { TJANST_ORDNING, TJANSTER, type Tjanst } from "#/lib/modeller";
import { namnsI } from "#/lib/svarstext";
import { useLasbarhet } from "#/lib/use-lasbarhet";
import { Mottagare, type Station, type SvarVy } from "./mottagare";
import { Resultat } from "./resultat";

export type Korning = Foretag & {
  id: string;
  startad: string;
  hemsida?: string;
};

// Ett av de åtta svaren: en tjänst och en fråga, strömmat från /api/svar.
function useSvar(korning: Korning, tjanst: Tjanst, fraga: 0 | 1): SvarVy {
  const [kallor, setKallor] = useState<Kalla[]>([]);
  const fragetext = fragor(korning)[fraga];
  const { messages, sendMessage, status, error, reload } = useChat({
    connection: fetchServerSentEvents("/api/svar"),
    threadId: `${korning.id}-${tjanst}-${fraga}`,
    forwardedProps: { korningId: korning.id, tjanst, fraga },
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
  let lage: SvarVy["status"] = "klar";
  if (error) {
    lage = "fel";
  } else if (arbetar || !text) {
    lage = text ? "strommar" : "vantar";
  }
  return {
    fragetext,
    text,
    kallor,
    status: lage,
    namns: namnsI(text, korning.foretag),
    omForsok: () => reload(),
  };
}

function klockslag(iso: string) {
  return new Date(iso).toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function uppraknat(delar: string[]) {
  return delar.length > 1
    ? `${delar.slice(0, -1).join(", ")} och ${delar.at(-1)}`
    : (delar[0] ?? "");
}

export function Scen({ korning }: { korning: Korning }) {
  // Åtta hooks i fast ordning: fyra tjänster gånger två frågor.
  const svar: Record<Tjanst, [SvarVy, SvarVy]> = {
    chatgpt: [useSvar(korning, "chatgpt", 0), useSvar(korning, "chatgpt", 1)],
    gemini: [useSvar(korning, "gemini", 0), useSvar(korning, "gemini", 1)],
    claude: [useSvar(korning, "claude", 0), useSvar(korning, "claude", 1)],
    perplexity: [
      useSvar(korning, "perplexity", 0),
      useSvar(korning, "perplexity", 1),
    ],
  };
  const stationer: Station[] = TJANST_ORDNING.map((tjanst) => ({
    tjanst,
    svar: svar[tjanst],
  }));
  const alla = stationer.flatMap((s) => s.svar);
  const namns = alla.filter((s) => s.namns).length;
  const klara = alla.filter(
    (s) => s.status === "klar" || s.status === "fel"
  ).length;
  const total = alla.length;
  const sander = klara < total;

  const las = useLasbarhet(korning.id);
  const korLas = useRef(las.kor);
  korLas.current = las.kor;
  const { hemsida } = korning;
  useEffect(() => {
    if (!hemsida) {
      return;
    }
    const id = setTimeout(() => korLas.current(hemsida), 0);
    return () => clearTimeout(id);
  }, [hemsida]);

  // aria-live meddelar bara räknaren och när ett svar blir klart.
  const [meddelande, setMeddelande] = useState("");
  const klaraNycklar = stationer
    .flatMap((s) =>
      s.svar.map((v, f) => (v.status === "klar" ? `${s.tjanst}-${f}` : ""))
    )
    .filter(Boolean)
    .join(",");
  const forraKlara = useRef("");
  useEffect(() => {
    const nya = klaraNycklar
      .split(",")
      .filter((n) => n && !forraKlara.current.split(",").includes(n));
    forraKlara.current = klaraNycklar;
    const senaste = nya.at(-1);
    if (senaste) {
      const [tjanst, fraga] = senaste.split("-") as [Tjanst, string];
      setMeddelande(
        `${TJANSTER[tjanst].namn} har svarat på fråga ${Number(fraga) + 1}.`
      );
    }
  }, [klaraNycklar]);

  return (
    <section aria-label="Körningen">
      <p aria-live="polite" className="sr-only">
        {meddelande}
      </p>
      <p aria-live="polite" className="sr-only">
        {korning.foretag} nämns i {namns} av {total} svar
      </p>

      <Mottagare
        foretag={korning.foretag}
        rubrik={
          <h2 className="text-[clamp(1.35rem,5.5vw,1.9rem)] leading-[1.08] font-semibold tracking-[-0.03em]">
            <span className="sr-only">
              {korning.foretag} nämns i {namns} av {total} svar
            </span>
            <span aria-hidden="true">
              {korning.foretag} nämns i{" "}
              <span
                className={`tabular-nums ${namns > 0 ? "tal-tands" : ""}`}
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
        }
        sander={sander}
        stationer={stationer}
        status={
          <span className="tabular-nums">
            {sander ? `I sändning · ${klara} av ${total}` : "Klart"}
          </span>
        }
      />

      <p className="text-svag mt-3 text-sm">
        Frågorna ställdes {klockslag(korning.startad)} till{" "}
        {uppraknat(TJANST_ORDNING.map((t) => TJANSTER[t].modellnamn))}, med
        webbsökning.
      </p>

      {sander ? null : <Resultat korning={korning} las={las} namns={namns} />}

      {sander ? null : (
        <p className="text-svag mt-16 max-w-[62ch] text-sm leading-relaxed">
          Varje tjänst fick två frågor. Samma tjänst kan svara annorlunda nästa
          gång.
        </p>
      )}
    </section>
  );
}

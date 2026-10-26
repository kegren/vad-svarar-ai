import type { ReactNode } from "react";

// Svaren kommer som markdown. Den här renderaren klarar det tjänsterna faktiskt
// skickar (rubriker, listor, fetstil, länkar, [n]-hänvisningar och enkla tabeller)
// och tänder företagets namn i den löpande texten. Svaren visas alltid i
// högtalarväven, så färgerna är vävens.

const INLINE =
  /\[(?<lanktext>[^\]]+)\]\((?<lank>https?:\/\/[^)\s]+)\)|\*\*(?<fet>[^*]+?)\*\*|\[(?<nummer>\d{1,3})\]|(?<adress>https?:\/\/[^\s)\]]+)/gu;
const RUBRIK = /^(?<nivå>#{1,4})\s+(?<text>.*)$/u;
const PUNKT = /^\s*[-*•]\s+(?<text>.*)$/u;
const NUMRERAD = /^\s*\d+[.)]\s+(?<text>.*)$/u;
const TABELLRAD = /^\s*\|(?<celler>.*)\|\s*$/u;
const TABELLSTRECK = /^[\s|:-]+$/u;
const SPECIALTECKEN = /[.*+?^${}()|[\]\\]/gu;
const WWW = /^www\./u;

export function namnMonster(namn: string) {
  return new RegExp(`(${namn.trim().replace(SPECIALTECKEN, "\\$&")})`, "giu");
}

export function namnsI(text: string, namn: string) {
  return namnMonster(namn).test(text);
}

function doman(url: string) {
  try {
    return new URL(url).hostname.replace(WWW, "");
  } catch {
    return url;
  }
}

function tand(text: string, monster: RegExp, nyckel: string) {
  return text.split(monster).map((del, i) =>
    i % 2 === 1 ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: delarna kommer från split och byter aldrig plats.
      <mark className="namn" key={`${nyckel}-${i}`}>
        {del}
      </mark>
    ) : (
      del
    )
  );
}

function inline(text: string, monster: RegExp, nyckel: string): ReactNode[] {
  const delar: ReactNode[] = [];
  let senast = 0;
  for (const traff of text.matchAll(INLINE)) {
    const start = traff.index ?? 0;
    delar.push(
      ...tand(text.slice(senast, start), monster, `${nyckel}-${start}t`)
    );
    const g = traff.groups ?? {};
    const k = `${nyckel}-${start}`;
    if (g.lank) {
      delar.push(
        <a
          className="text-vavdov hover:text-vavtext underline decoration-[var(--linje-vav)]"
          href={g.lank}
          key={k}
          rel="noopener noreferrer nofollow"
          target="_blank"
        >
          {tand(g.lanktext ?? "", monster, k)}
        </a>
      );
    } else if (g.fet) {
      delar.push(
        <strong className="text-vavtext font-semibold" key={k}>
          {inline(g.fet, monster, k)}
        </strong>
      );
    } else if (g.nummer) {
      delar.push(
        <sup className="text-vavdov px-0.5 text-[0.7em] tabular-nums" key={k}>
          {g.nummer}
        </sup>
      );
    } else if (g.adress) {
      delar.push(
        <a
          className="text-vavdov hover:text-vavtext underline decoration-[var(--linje-vav)]"
          href={g.adress}
          key={k}
          rel="noopener noreferrer nofollow"
          target="_blank"
        >
          {doman(g.adress)}
        </a>
      );
    }
    senast = start + traff[0].length;
  }
  delar.push(...tand(text.slice(senast), monster, `${nyckel}-slut`));
  return delar;
}

type Block =
  | { typ: "rubrik"; text: string }
  | { typ: "stycke"; text: string }
  | { typ: "lista"; numrerad: boolean; punkter: string[] }
  | { typ: "tabell"; rader: string[][] };

function laggTillPunkt(ut: Block[], text: string, numrerad: boolean) {
  const forra = ut.at(-1);
  if (forra?.typ === "lista") {
    forra.punkter.push(text);
  } else {
    ut.push({ typ: "lista", numrerad, punkter: [text] });
  }
}

function laggTillTabellrad(ut: Block[], rad: string, celler: string) {
  if (TABELLSTRECK.test(rad)) {
    return;
  }
  const delar = celler.split("|").map((c) => c.trim());
  const forra = ut.at(-1);
  if (forra?.typ === "tabell") {
    forra.rader.push(delar);
  } else {
    ut.push({ typ: "tabell", rader: [delar] });
  }
}

function laggTillText(ut: Block[], rad: string) {
  const forra = ut.at(-1);
  if (forra?.typ === "stycke" && forra.text) {
    forra.text += ` ${rad.trim()}`;
  } else {
    ut.push({ typ: "stycke", text: rad.trim() });
  }
}

function block(text: string): Block[] {
  const ut: Block[] = [];
  for (const rad of text.split("\n")) {
    const rubrik = rad.match(RUBRIK)?.groups;
    const punkt = rad.match(PUNKT)?.groups;
    const numrerad = rad.match(NUMRERAD)?.groups;
    const tabell = rad.match(TABELLRAD)?.groups;
    if (!rad.trim()) {
      ut.push({ typ: "stycke", text: "" });
    } else if (rubrik) {
      ut.push({ typ: "rubrik", text: rubrik.text ?? "" });
    } else if (punkt || numrerad) {
      laggTillPunkt(ut, (punkt ?? numrerad)?.text ?? "", !punkt);
    } else if (tabell) {
      laggTillTabellrad(ut, rad, tabell.celler ?? "");
    } else {
      laggTillText(ut, rad);
    }
  }
  return ut.filter((b) => b.typ !== "stycke" || b.text);
}

export function Svarstext({ text, namn }: { text: string; namn: string }) {
  const monster = namnMonster(namn);
  return block(text).map((b, i) => {
    const k = `b${i}`;
    if (b.typ === "rubrik") {
      return (
        <h4
          className="font-display text-vavtext mt-5 mb-1.5 text-[1.05rem] font-semibold tracking-[-0.01em]"
          key={k}
        >
          {inline(b.text, monster, k)}
        </h4>
      );
    }
    if (b.typ === "lista") {
      const Lista = b.numrerad ? "ol" : "ul";
      return (
        <Lista
          className={`my-3 space-y-2 pl-5 ${b.numrerad ? "list-decimal" : "list-disc"} marker:text-vavdov`}
          key={k}
        >
          {b.punkter.map((p, j) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: punkterna har ingen egen nyckel och byter aldrig plats.
            <li className="pl-1" key={j}>
              {inline(p, monster, `${k}-${j}`)}
            </li>
          ))}
        </Lista>
      );
    }
    if (b.typ === "tabell") {
      return (
        <div className="my-3 space-y-1.5 text-[0.95em]" key={k}>
          {b.rader.map((rad, j) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: raderna har ingen egen nyckel och byter aldrig plats.
            <p className={j === 0 ? "text-vavdov" : ""} key={j}>
              {inline(rad.filter(Boolean).join(" · "), monster, `${k}-${j}`)}
            </p>
          ))}
        </div>
      );
    }
    return (
      <p className="my-3" key={k}>
        {inline(b.text, monster, k)}
      </p>
    );
  });
}

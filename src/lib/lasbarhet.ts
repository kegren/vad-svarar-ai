import type { Tjanst } from "./modeller";

// "Kan AI läsa din hemsida?" (PLAN.md avsnitt 1 punkt 5). Fyra kontroller utan
// modell. Funktionerna här tolkar det som hämtats och går att testa utan nätverk.

export type Status = "ok" | "varning" | "fel" | "okand";

export type Detalj = { etikett: string; status: Status };

export type Kontroll = {
  id: "robotar" | "llms" | "html" | "struktur";
  status: Status;
  rubrik: string;
  text: string;
  detaljer: Detalj[];
};

export type Lasbarhet = {
  url: string;
  kontrollerad: string;
  kontroller: Kontroll[];
};

// Robotarna som AI-tjänsterna läser webben med. Sök- och användarrobotarna
// hämtar sidor när någon frågar. Tränings- och grundningsrobotarna står sist.
export const ROBOTAR: Record<Tjanst, string[]> = {
  chatgpt: ["OAI-SearchBot", "ChatGPT-User", "GPTBot"],
  gemini: ["Googlebot", "Google-Extended"],
  claude: ["Claude-SearchBot", "Claude-User", "ClaudeBot"],
  perplexity: ["PerplexityBot", "Perplexity-User"],
};

type Regel = { tillat: boolean; sokvag: string };
type Grupp = { agenter: string[]; regler: Regel[] };

const KOMMENTAR = /#.*$/u;
const RADBRYTNING = /\r?\n/u;

// robots.txt enligt RFC 9309: grupper av User-agent-rader följda av regler.
export function tolkaRobots(text: string): Grupp[] {
  const grupper: Grupp[] = [];
  let aktuell: Grupp | null = null;
  let vantarAgent = false;
  for (const radRa of text.split(RADBRYTNING)) {
    const rad = radRa.replace(KOMMENTAR, "").trim();
    const kolon = rad.indexOf(":");
    if (kolon < 0) {
      continue;
    }
    const falt = rad.slice(0, kolon).trim().toLowerCase();
    const varde = rad.slice(kolon + 1).trim();
    if (falt === "user-agent") {
      if (!(aktuell && vantarAgent)) {
        aktuell = { agenter: [], regler: [] };
        grupper.push(aktuell);
      }
      aktuell.agenter.push(varde.toLowerCase());
      vantarAgent = true;
    } else if ((falt === "allow" || falt === "disallow") && aktuell) {
      vantarAgent = false;
      if (varde) {
        aktuell.regler.push({ tillat: falt === "allow", sokvag: varde });
      }
    }
  }
  return grupper;
}

function traffar(sokvag: string, monster: string) {
  const utanSlut = monster.endsWith("$") ? monster.slice(0, -1) : monster;
  const regex = new RegExp(
    `^${utanSlut
      .split("*")
      .map((d) => d.replace(/[.+?^${}()|[\]\\]/gu, "\\$&"))
      .join(".*")}${monster.endsWith("$") ? "$" : ""}`,
    "u"
  );
  return regex.test(sokvag);
}

// Får roboten läsa sökvägen? Den mest specifika gruppen gäller, annars *.
// Den längsta regeln som träffar vinner, och Allow vinner vid lika längd.
export function farLasa(grupper: Grupp[], robot: string, sokvag = "/") {
  const namn = robot.toLowerCase();
  const egna = grupper.filter((g) => g.agenter.includes(namn));
  const valda =
    egna.length > 0 ? egna : grupper.filter((g) => g.agenter.includes("*"));
  const regler = valda
    .flatMap((g) => g.regler)
    .filter((r) => traffar(sokvag, r.sokvag))
    .sort(
      (a, b) =>
        b.sokvag.length - a.sokvag.length || Number(b.tillat) - Number(a.tillat)
    );
  return regler[0]?.tillat ?? true;
}

const BORT =
  /<(?<tagg>script|style|noscript|template|svg)\b[\s\S]*?<\/\k<tagg>>/giu;
const BLANKSTEG = /\s+/u;
const BOKSTAV = /\p{L}/u;
const TAGG = /<[^>]+>/gu;
const ENTITET = /&[a-z#0-9]+;/giu;
const H1 = /<h1\b/iu;
const SKRIPT = /<script\b/giu;

// Hur mycket text står i HTML:en från servern, innan något JavaScript körs?
export function textIHtml(html: string) {
  const text = html.replace(BORT, " ").replace(TAGG, " ").replace(ENTITET, " ");
  const ord = text.split(BLANKSTEG).filter((o) => BOKSTAV.test(o)).length;
  return {
    ord,
    harH1: H1.test(html),
    skript: (html.match(SKRIPT) ?? []).length,
  };
}

const JSONLD =
  /<script[^>]*type=["']application\/ld\+json["'][^>]*>(?<json>[\s\S]*?)<\/script>/giu;
const MIKRODATA = /itemtype=["']https?:\/\/schema\.org\/(?<typ>\w+)["']/giu;
const FORETAGSTYP =
  /Organization|Business|Service$|Store|Shop|Restaurant|Contractor|Plumber|Electrician|Dentist|Clinic|Agency|Office|Corporation|Hotel|Salon|Practice/u;

type Objekt = Record<string, unknown>;

function platta(varde: unknown): Objekt[] {
  if (Array.isArray(varde)) {
    return varde.flatMap(platta);
  }
  if (varde && typeof varde === "object") {
    const objekt = varde as Objekt;
    return [objekt, ...platta(objekt["@graph"])];
  }
  return [];
}

function typer(objekt: Objekt) {
  const typ = objekt["@type"];
  return (Array.isArray(typ) ? typ : [typ]).filter(
    (t): t is string => typeof t === "string"
  );
}

export type Foretagsdata = {
  typer: string[];
  namn: boolean;
  adress: boolean;
  telefon: boolean;
  oppettider: boolean;
  profiler: boolean;
};

// Strukturerad data om företaget: JSON-LD först, mikrodata som reserv.
export function strukturerad(html: string): {
  foretag: Foretagsdata | null;
  ovriga: string[];
  mikrodata: string[];
} {
  const objekt = [...html.matchAll(JSONLD)].flatMap((m) => {
    try {
      return platta(JSON.parse(m.groups?.json ?? ""));
    } catch {
      return [];
    }
  });
  const foretag = objekt.find((o) => typer(o).some((t) => FORETAGSTYP.test(t)));
  const mikrodata = [...html.matchAll(MIKRODATA)].map(
    (m) => m.groups?.typ ?? ""
  );
  return {
    foretag: foretag
      ? {
          typer: typer(foretag),
          namn: Boolean(foretag.name),
          adress: Boolean(foretag.address),
          telefon: Boolean(foretag.telephone),
          oppettider: Boolean(
            foretag.openingHours || foretag.openingHoursSpecification
          ),
          profiler: Boolean(foretag.sameAs),
        }
      : null,
    ovriga: [...new Set(objekt.flatMap(typer))],
    mikrodata: [...new Set(mikrodata.filter((t) => FORETAGSTYP.test(t)))],
  };
}

// Ser det hämtade ut som en riktig llms.txt, eller som en HTML-sida som servern
// skickar för alla adresser?
export function arLlmsTxt(text: string, innehallstyp: string) {
  const borjan = text.trimStart().slice(0, 15).toLowerCase();
  return (
    text.trim().length > 20 &&
    !innehallstyp.includes("html") &&
    !borjan.startsWith("<!doctype") &&
    !borjan.startsWith("<html")
  );
}

export function llmsRubrik(text: string) {
  return (
    text
      .split("\n")
      .find((r) => r.startsWith("# "))
      ?.slice(2)
      .trim() ?? null
  );
}

// Normaliserar det besökaren skrev till en adress att kontrollera.
export function tolkaHemsida(varde: string) {
  const ren = varde.trim();
  if (!ren) {
    return null;
  }
  try {
    const adress = new URL(PROTOKOLL.test(ren) ? ren : `https://${ren}`);
    if (!adress.hostname.includes(".")) {
      return null;
    }
    return adress.origin;
  } catch {
    return null;
  }
}

const ICKE_BOKSTAV = /[^a-z0-9]/gu;
const PROTOKOLL = /^https?:\/\//iu;
const BOLAGSFORM = /\s(?:ab|hb|kb|aktiebolag|handelsbolag|enskild firma)$/iu;

function forenkla(text: string) {
  return text
    .toLowerCase()
    .replace(/[åä]/gu, "a")
    .replace(/ö/gu, "o")
    .replace(/é/gu, "e")
    .replace(ICKE_BOKSTAV, "");
}

// Gissar företagets hemsida bland källorna: domänen som innehåller namnet.
export function gissaHemsida(foretag: string, domaner: string[]) {
  const namn = forenkla(foretag.trim().replace(BOLAGSFORM, ""));
  if (namn.length < 3) {
    return null;
  }
  return (
    domaner.find((d) => {
      const rot = forenkla(d.split(".")[0] ?? "");
      return rot.includes(namn) || (rot.length >= 4 && namn.startsWith(rot));
    }) ?? null
  );
}

export type Hamtat = { status: number; text: string; typ: string } | null;

export type Raadata = {
  robots: Hamtat;
  llms: Hamtat;
  startsida: Hamtat;
  // HTTP-status när startsidan hämtas med varje tjänsts robot som avsändare.
  robotsvar: Partial<Record<Tjanst, number | null>>;
};

const NAMN: Record<Tjanst, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
  perplexity: "Perplexity",
};

const ORDNING = Object.keys(ROBOTAR) as Tjanst[];

function uppraknat(delar: string[]) {
  return delar.length > 1
    ? `${delar.slice(0, -1).join(", ")} och ${delar.at(-1)}`
    : (delar[0] ?? "");
}

function sammanlagd(statusar: Status[]): Status {
  if (statusar.includes("fel")) {
    return "fel";
  }
  if (statusar.includes("varning")) {
    return "varning";
  }
  return statusar.every((s) => s === "okand") ? "okand" : "ok";
}

function robotkontroll(raa: Raadata): Kontroll {
  const robots = raa.robots?.status === 200 ? raa.robots : null;
  const finns = robots !== null;
  const grupper = robots ? tolkaRobots(robots.text) : [];
  const startsidaOk = raa.startsida?.status === 200;

  const perTjanst = ORDNING.map((tjanst) => {
    const robotar = ROBOTAR[tjanst];
    const tillatna = robotar.filter((r) => farLasa(grupper, r));
    const svar = raa.robotsvar[tjanst];
    const stoppasAvServern =
      startsidaOk && typeof svar === "number" && svar >= 400;
    // Ett serverstopp blir en varning: vi frågar med robotens namn men från
    // en annan adress, och ett bot-skydd kan släppa in den riktiga roboten.
    let status: Status = "ok";
    if (tillatna.length === 0) {
      status = "fel";
    } else if (stoppasAvServern || tillatna.length < robotar.length) {
      status = "varning";
    }
    return { tjanst, status, stoppasAvServern, svar };
  });

  const stoppade = perTjanst.filter((p) => p.status === "fel");
  const delvis = perTjanst.filter((p) => p.status === "varning");
  const serverstopp = perTjanst.filter((p) => p.stoppasAvServern);
  const status = sammanlagd(perTjanst.map((p) => p.status));

  let rubrik = "AI-tjänsternas robotar släpps in";
  let text = finns
    ? "robots.txt låter ChatGPT, Gemini, Claude och Perplexity läsa hemsidan."
    : "Det finns ingen robots.txt, så alla robotar får läsa hemsidan.";
  if (stoppade.length > 0) {
    rubrik = "robots.txt stänger ute AI-robotar";
    text = `${uppraknat(stoppade.map((p) => NAMN[p.tjanst]))} får inte läsa hemsidan enligt robots.txt.`;
  } else if (serverstopp.length > 0) {
    rubrik = "Servern kan stänga ute AI-robotar";
    text = `Servern svarade med ett fel när vi frågade med ${uppraknat(serverstopp.map((p) => `${NAMN[p.tjanst]}s`))} robotnamn, fast en vanlig webbläsare fick sidan. Det kan vara ett bot-skydd hos webbhotellet. Fråga webbhotellet om AI-robotar stängs ute.`;
  } else if (delvis.length > 0) {
    rubrik = "robots.txt stänger ute en del robotar";
    text = `${uppraknat(delvis.map((p) => NAMN[p.tjanst]))} får läsa med en del av sina robotar men inte med alla.`;
  }
  return {
    id: "robotar",
    status,
    rubrik,
    text,
    detaljer: perTjanst.map((p) => ({
      etikett: NAMN[p.tjanst],
      status: p.status,
    })),
  };
}

function llmskontroll(raa: Raadata): Kontroll {
  const ok = raa.llms?.status === 200 && arLlmsTxt(raa.llms.text, raa.llms.typ);
  if (ok) {
    return {
      id: "llms",
      status: "ok",
      rubrik: "llms.txt finns",
      text: "Hemsidan har en llms.txt som beskriver företaget med egna ord för AI-tjänster.",
      detaljer: [],
    };
  }
  return {
    id: "llms",
    status: "varning",
    rubrik: "Ingen llms.txt",
    text: "En llms.txt är en kort text om företaget som AI-tjänster kan läsa. Få tjänster använder den än, men den är lätt att lägga till.",
    detaljer: [],
  };
}

function htmlkontroll(raa: Raadata): Kontroll {
  if (raa.startsida?.status !== 200) {
    return {
      id: "html",
      status: "okand",
      rubrik: "Startsidan gick inte att hämta",
      text: "Hemsidan svarade inte som den skulle, så den här kontrollen kunde inte göras.",
      detaljer: [],
    };
  }
  const { ord } = textIHtml(raa.startsida.text);
  if (ord >= 150) {
    return {
      id: "html",
      status: "ok",
      rubrik: "Texten står i HTML:en",
      text: `Servern skickar ${ord} ord text direkt, så även robotar som inte kör JavaScript kan läsa startsidan.`,
      detaljer: [],
    };
  }
  if (ord >= 50) {
    return {
      id: "html",
      status: "varning",
      rubrik: "Lite text i HTML:en",
      text: `Servern skickar bara ${ord} ord text. Resten verkar komma med JavaScript, som många AI-robotar inte kör.`,
      detaljer: [],
    };
  }
  return {
    id: "html",
    status: "fel",
    rubrik: "Texten kommer bara med JavaScript",
    text: "Servern skickar nästan ingen text. Sidan byggs först i webbläsaren. Många AI-robotar ser då en tom sida.",
    detaljer: [],
  };
}

function strukturkontroll(raa: Raadata): Kontroll {
  if (raa.startsida?.status !== 200) {
    return {
      id: "struktur",
      status: "okand",
      rubrik: "Startsidan gick inte att hämta",
      text: "Utan startsidan går det inte att se om den har strukturerad data.",
      detaljer: [],
    };
  }
  const { foretag, mikrodata } = strukturerad(raa.startsida.text);
  if (!foretag) {
    return mikrodata.length > 0
      ? {
          id: "struktur",
          status: "varning",
          rubrik: "Strukturerad data i äldre form",
          text: `Startsidan märker upp företaget som ${mikrodata[0]} med mikrodata. JSON-LD är formen som AI-tjänster och Google läser lättast.`,
          detaljer: [],
        }
      : {
          id: "struktur",
          status: "fel",
          rubrik: "Ingen strukturerad data om företaget",
          text: "Startsidan säger inte i schema.org-form vad företaget heter, var det finns och hur man når det. Sådan data hjälper AI-tjänster att få uppgifterna rätt.",
          detaljer: [],
        };
  }
  const falt: Detalj[] = [
    { etikett: "Namn", status: foretag.namn ? "ok" : "fel" },
    { etikett: "Adress", status: foretag.adress ? "ok" : "fel" },
    { etikett: "Telefon", status: foretag.telefon ? "ok" : "fel" },
    { etikett: "Öppettider", status: foretag.oppettider ? "ok" : "varning" },
    { etikett: "Profiler", status: foretag.profiler ? "ok" : "varning" },
  ];
  const saknas = falt
    .filter((f) => f.status === "fel")
    .map((f) => f.etikett.toLowerCase());
  return {
    id: "struktur",
    status: saknas.length > 0 ? "varning" : "ok",
    rubrik: "Strukturerad data om företaget",
    text:
      saknas.length > 0
        ? `Startsidan har strukturerad data om företaget, men ${uppraknat(saknas)} saknas.`
        : "Startsidan har strukturerad data om företaget med namn, adress och telefon.",
    detaljer: falt,
  };
}

export function bedom(raa: Raadata): Kontroll[] {
  return [
    robotkontroll(raa),
    llmskontroll(raa),
    htmlkontroll(raa),
    strukturkontroll(raa),
  ];
}

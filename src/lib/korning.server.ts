import { env } from "cloudflare:workers";
import type { Resultat, SparatSvar } from "./analys";
import type { Foretag } from "./fragor";
import { nyttId } from "./id";
import { TJANSTER } from "./modeller";

// Körningen i D1 (PLAN.md avsnitt 6). Svaren sparas i svar_json med en nyckel per
// tjänst och fråga. json_set i ett enda UPDATE gör att de åtta strömmarna kan
// spara samtidigt utan att skriva över varandra.

export type SparadKorning = Foretag & {
  id: string;
  skapad: string;
  hemsida: string | null;
  svar: Record<string, SparatSvar>;
  analys: Resultat | null;
};

type Rad = {
  id: string;
  skapad: string;
  foretag: string;
  bransch: string;
  ort: string;
  hemsida: string | null;
  svar_json: string | null;
  analys_json: string | null;
};

// SQLite ger "2026-10-26 16:02:11" i UTC utan tidszon. Safari tolkar inte det.
function iso(skapad: string) {
  return `${skapad.replace(" ", "T")}Z`;
}

async function hashaIp(ip: string) {
  const salt = env.IP_SALT || "lokal-utveckling";
  const data = new TextEncoder().encode(`${salt}:${ip}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

export async function skapaKorning(
  foretag: Foretag & { hemsida: string | null },
  ip: string
) {
  const id = nyttId();
  const modeller = Object.fromEntries(
    Object.entries(TJANSTER).map(([tjanst, { modell }]) => [tjanst, modell])
  );
  await env.DB.prepare(
    "INSERT INTO korning (id, foretag, bransch, ort, hemsida, modeller_json, svar_json, ip_hash) VALUES (?, ?, ?, ?, ?, ?, '{}', ?)"
  )
    .bind(
      id,
      foretag.foretag,
      foretag.bransch,
      foretag.ort,
      foretag.hemsida,
      JSON.stringify(modeller),
      await hashaIp(ip)
    )
    .run();
  const rad = await env.DB.prepare("SELECT skapad FROM korning WHERE id = ?")
    .bind(id)
    .first<{ skapad: string }>();
  return { id, skapad: rad ? iso(rad.skapad) : new Date().toISOString() };
}

export async function hamtaKorning(id: string): Promise<SparadKorning | null> {
  const rad = await env.DB.prepare(
    "SELECT id, skapad, foretag, bransch, ort, hemsida, svar_json, analys_json FROM korning WHERE id = ?"
  )
    .bind(id)
    .first<Rad>();
  if (!rad) {
    return null;
  }
  return {
    id: rad.id,
    skapad: iso(rad.skapad),
    foretag: rad.foretag,
    bransch: rad.bransch,
    ort: rad.ort,
    hemsida: rad.hemsida,
    svar: rad.svar_json ? JSON.parse(rad.svar_json) : {},
    analys: rad.analys_json ? JSON.parse(rad.analys_json) : null,
  };
}

export async function sparaSvar(id: string, nyckel: string, svar: SparatSvar) {
  await env.DB.prepare(
    "UPDATE korning SET svar_json = json_set(coalesce(svar_json, '{}'), ?, json(?)) WHERE id = ?"
  )
    .bind(`$."${nyckel}"`, JSON.stringify(svar), id)
    .run();
}

export async function sparaAnalys(id: string, analys: Resultat) {
  await env.DB.prepare("UPDATE korning SET analys_json = ? WHERE id = ?")
    .bind(JSON.stringify(analys), id)
    .run();
}

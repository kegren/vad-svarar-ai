import { env } from "cloudflare:workers";

// Skydden i PLAN.md avsnitt 7: Turnstile, tre körningar per IP-adress och dygn,
// sparade svar för samma fråga inom ett dygn och dygnsbudgeten i D1.

export const TAK_KRONOR = 100;
export const KORNINGAR_PER_IP = 3;
// OpenRouter räknar i dollar. Kursen behöver inte vara exakt, den styr bara taket.
const KRONOR_PER_DOLLAR = 10.5;
// Strömmarna får bara anropa modellerna strax efter att körningen startade.
// Senare spelas de sparade svaren upp.
export const SVARSFONSTER_MINUTER = 15;

// Cloudflares testnycklar släpper alltid igenom. De används i utvecklingsläget,
// eftersom den riktiga widgeten bara godkänner vad-svarar-ai.kegren.com.
const TESTHEMLIGHET = "1x0000000000000000000000000000000AA";
const TESTNYCKEL = "1x00000000000000000000AA";

export function webbplatsnyckel() {
  return import.meta.env.DEV ? TESTNYCKEL : env.TURNSTILE_SITE_KEY;
}

export async function godkandTurnstile(token: string, ip: string) {
  const hemlighet = import.meta.env.DEV ? TESTHEMLIGHET : env.TURNSTILE_SECRET;
  if (!(hemlighet && token)) {
    return false;
  }
  const svar = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: new URLSearchParams({
        secret: hemlighet,
        response: token,
        remoteip: ip,
      }),
    }
  );
  if (!svar.ok) {
    return false;
  }
  const { success } = await svar.json<{ success: boolean }>();
  return success;
}

export async function kronorIdag() {
  const rad = await env.DB.prepare(
    "SELECT kronor FROM budget WHERE dag = date('now')"
  ).first<{ kronor: number }>();
  return rad?.kronor ?? 0;
}

export async function budgetSlut() {
  return (await kronorIdag()) >= TAK_KRONOR;
}

export async function laggTillKostnad(dollar: number | null | undefined) {
  if (!dollar) {
    return;
  }
  await env.DB.prepare(
    "INSERT INTO budget (dag, kronor) VALUES (date('now'), ?) ON CONFLICT (dag) DO UPDATE SET kronor = kronor + excluded.kronor"
  )
    .bind(dollar * KRONOR_PER_DOLLAR)
    .run();
}

export async function korningarFranIp(ipHash: string) {
  const rad = await env.DB.prepare(
    "SELECT count(*) AS antal FROM korning WHERE ip_hash = ? AND skapad > datetime('now', '-1 day')"
  )
    .bind(ipHash)
    .first<{ antal: number }>();
  return rad?.antal ?? 0;
}

// Samma företag, bransch och ort inom ett dygn ger den senaste körningen som har
// alla svar och en analys, så att samma fråga inte kostar två gånger.
export async function sparadKorning(foretag: {
  foretag: string;
  bransch: string;
  ort: string;
}) {
  const rad = await env.DB.prepare(
    "SELECT id FROM korning WHERE lower(foretag) = lower(?) AND lower(bransch) = lower(?) AND lower(ort) = lower(?) AND skapad > datetime('now', '-1 day') AND analys_json IS NOT NULL ORDER BY skapad DESC LIMIT 1"
  )
    .bind(foretag.foretag.trim(), foretag.bransch.trim(), foretag.ort.trim())
    .first<{ id: string }>();
  return rad?.id ?? null;
}

// Körs av cron-triggern en gång per dygn (PLAN.md avsnitt 6).
export async function rensaGamla() {
  await env.DB.batch([
    env.DB.prepare(
      "DELETE FROM korning WHERE skapad < datetime('now', '-30 days')"
    ),
    env.DB.prepare("DELETE FROM budget WHERE dag < date('now', '-30 days')"),
  ]);
}

// Åtta svar, analysen och sju nya försök. Räknaren ökas i samma UPDATE som
// kontrollerar taket, så att samtidiga anrop inte kan gå förbi det.
const ANROP_PER_KORNING = 16;

export async function farAnropa(korningId: string) {
  const rad = await env.DB.prepare(
    "UPDATE korning SET anrop = anrop + 1 WHERE id = ? AND anrop < ? AND skapad > datetime('now', ?) RETURNING anrop"
  )
    .bind(korningId, ANROP_PER_KORNING, `-${SVARSFONSTER_MINUTER} minutes`)
    .first<{ anrop: number }>();
  return rad !== null;
}

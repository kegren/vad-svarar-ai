import { bedom, type Hamtat, type Lasbarhet } from "./lasbarhet";
import type { Tjanst } from "./modeller";

// Hämtar det kontrollerna behöver från besökarens hemsida. Adressen kommer från
// besökaren, så hämtningen är försiktig: bara http och https på vanliga portar,
// inga IP-adresser eller lokala namn, varje omdirigering prövas, tidsgräns och
// högsta storlek.

const WEBBLASARE =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 VadSvararAI/1.0";

// Robotnamnen som servern får se. Gemini prövas inte så, eftersom Googlebot inte
// går att låtsas vara på ett ärligt sätt.
const ROBOTNAMN: Partial<Record<Tjanst, string>> = {
  chatgpt:
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)",
  claude:
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
  perplexity:
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
};

const MAX_BYTE = 1_500_000;
const MAX_OMDIRIGERINGAR = 5;
const IP_ADRESS = /^(?:\d{1,3}\.){3}\d{1,3}$|^\[.*\]$|^[0-9a-f:]+$/iu;
const LOKALT = /^localhost$|\.(?:local|localhost|internal|lan|home|test)$/iu;

function tillaten(adress: URL) {
  return (
    (adress.protocol === "https:" || adress.protocol === "http:") &&
    (adress.port === "" || adress.port === "80" || adress.port === "443") &&
    adress.hostname.includes(".") &&
    !IP_ADRESS.test(adress.hostname) &&
    !LOKALT.test(adress.hostname) &&
    !adress.username &&
    !adress.password
  );
}

async function lasBegransat(svar: Response) {
  if (!svar.body) {
    return "";
  }
  const lasare = svar.body.getReader();
  const delar: Uint8Array[] = [];
  let storlek = 0;
  while (storlek < MAX_BYTE) {
    // biome-ignore lint/performance/noAwaitInLoops: strömmen läses bit för bit tills gränsen nås.
    const { done, value } = await lasare.read();
    if (done) {
      break;
    }
    delar.push(value);
    storlek += value.byteLength;
  }
  await lasare.cancel().catch(() => undefined);
  const hela = new Uint8Array(Math.min(storlek, MAX_BYTE));
  let plats = 0;
  for (const del of delar) {
    const bit = del.subarray(0, Math.max(0, hela.length - plats));
    hela.set(bit, plats);
    plats += bit.length;
  }
  return new TextDecoder().decode(hela);
}

async function hamta(url: string, avsandare: string): Promise<Hamtat> {
  try {
    let adress = new URL(url);
    for (let i = 0; i <= MAX_OMDIRIGERINGAR; i += 1) {
      if (!tillaten(adress)) {
        return null;
      }
      // biome-ignore lint/performance/noAwaitInLoops: varje omdirigering prövas innan nästa hämtas.
      const svar = await fetch(adress, {
        redirect: "manual",
        headers: { "user-agent": avsandare, accept: "*/*" },
        signal: AbortSignal.timeout(6000),
      });
      const plats = svar.headers.get("location");
      if (svar.status >= 300 && svar.status < 400 && plats) {
        await svar.body?.cancel();
        adress = new URL(plats, adress);
        continue;
      }
      return {
        status: svar.status,
        text: await lasBegransat(svar),
        typ: svar.headers.get("content-type") ?? "",
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function hamtaStatus(url: string, avsandare: string) {
  const svar = await hamta(url, avsandare);
  return svar ? svar.status : null;
}

export async function kontrollera(hemsida: string): Promise<Lasbarhet> {
  const [robots, llms, startsida, ...robotsvar] = await Promise.all([
    hamta(`${hemsida}/robots.txt`, WEBBLASARE),
    hamta(`${hemsida}/llms.txt`, WEBBLASARE),
    hamta(`${hemsida}/`, WEBBLASARE),
    ...Object.values(ROBOTNAMN).map((avsandare) =>
      hamtaStatus(`${hemsida}/`, avsandare)
    ),
  ]);
  const tjanster = Object.keys(ROBOTNAMN) as Tjanst[];
  return {
    url: hemsida,
    kontrollerad: new Date().toISOString(),
    kontroller: bedom({
      robots,
      llms,
      startsida,
      robotsvar: Object.fromEntries(
        tjanster.map((tjanst, i) => [tjanst, robotsvar[i] ?? null])
      ),
    }),
  };
}

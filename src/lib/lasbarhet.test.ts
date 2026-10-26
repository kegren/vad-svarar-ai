import { describe, expect, test } from "bun:test";
import {
  arLlmsTxt,
  bedom,
  farLasa,
  gissaHemsida,
  llmsRubrik,
  strukturerad,
  textIHtml,
  tolkaHemsida,
  tolkaRobots,
} from "./lasbarhet";

const KEMERO_ROBOTS = `# kemero.se robots.txt
User-agent: *
User-agent: OAI-SearchBot
User-agent: GPTBot
User-agent: ClaudeBot
Allow: /

Sitemap: https://kemero.se/sitemap.xml`;

const STANGER_GPTBOT = `User-agent: GPTBot
Disallow: /

User-agent: *
Disallow: /admin
Allow: /`;

const SPA = `<!doctype html><html><head><script src="/a.js"></script></head>
<body><div id="root"></div><noscript>Aktivera JavaScript</noscript>
<script>window.__DATA__ = {"text": "massor av ord här som inte syns"}</script></body></html>`;

const MED_TEXT = `<html><body><h1>Rör i Västerås</h1><p>${"Vi lagar rör i hela Västerås. ".repeat(40)}</p></body></html>`;

const JSONLD = `<script type="application/ld+json">{"@context":"https://schema.org","@graph":[
{"@type":["ProfessionalService","Organization"],"name":"kemero","address":{"@type":"PostalAddress","addressLocality":"Västerås"},"telephone":"+46 70 000 00 00"},
{"@type":"WebSite","name":"kemero"}]}</script>`;

describe("robots.txt", () => {
  test("flera User-agent-rader delar samma regler", () => {
    const grupper = tolkaRobots(KEMERO_ROBOTS);
    expect(grupper).toHaveLength(1);
    expect(farLasa(grupper, "GPTBot")).toBe(true);
    expect(farLasa(grupper, "PerplexityBot")).toBe(true);
  });

  test("en egen grupp går före *", () => {
    const grupper = tolkaRobots(STANGER_GPTBOT);
    expect(farLasa(grupper, "GPTBot")).toBe(false);
    expect(farLasa(grupper, "ClaudeBot")).toBe(true);
    expect(farLasa(grupper, "ClaudeBot", "/admin/x")).toBe(false);
  });

  test("tom Disallow betyder att allt är tillåtet", () => {
    expect(farLasa(tolkaRobots("User-agent: *\nDisallow:"), "GPTBot")).toBe(
      true
    );
  });

  test("ingen robots.txt släpper in alla", () => {
    expect(farLasa([], "GPTBot")).toBe(true);
  });
});

describe("text i HTML", () => {
  test("en sida som byggs med JavaScript har nästan ingen text", () => {
    expect(textIHtml(SPA).ord).toBeLessThan(5);
  });

  test("en serverrenderad sida räknas", () => {
    const { ord, harH1 } = textIHtml(MED_TEXT);
    expect(ord).toBeGreaterThan(150);
    expect(harH1).toBe(true);
  });
});

describe("strukturerad data", () => {
  test("hittar företaget i @graph med typlista", () => {
    const { foretag } = strukturerad(JSONLD);
    expect(foretag?.typer).toEqual(["ProfessionalService", "Organization"]);
    expect(foretag?.adress).toBe(true);
    expect(foretag?.telefon).toBe(true);
  });

  test("trasig JSON-LD ger inget företag", () => {
    expect(
      strukturerad('<script type="application/ld+json">{trasig</script>')
        .foretag
    ).toBeNull();
  });
});

describe("llms.txt", () => {
  test("en HTML-sida för alla adresser är ingen llms.txt", () => {
    expect(arLlmsTxt("<!doctype html><html>", "text/html")).toBe(false);
    expect(arLlmsTxt("# kemero\n\n> kemero är en webbyrå.", "text/plain")).toBe(
      true
    );
    expect(llmsRubrik("# kemero\n\n> text")).toBe("kemero");
  });
});

describe("hemsidan", () => {
  test("tolkar det besökaren skrev", () => {
    expect(tolkaHemsida("kemero.se")).toBe("https://kemero.se");
    expect(tolkaHemsida("https://kemero.se/om?x=1")).toBe("https://kemero.se");
    expect(tolkaHemsida("kemero")).toBeNull();
  });

  test("gissar hemsidan bland källorna", () => {
    expect(gissaHemsida("kemero", ["toxic.se", "kemero.se"])).toBe("kemero.se");
    expect(gissaHemsida("Rör & Bygg AB", ["rorbygg.se"])).toBe("rorbygg.se");
    expect(gissaHemsida("AB", ["ab.se"])).toBeNull();
  });
});

describe("bedömningen", () => {
  test("kemero.se klarar alla fyra kontrollerna", () => {
    const kontroller = bedom({
      robots: { status: 200, text: KEMERO_ROBOTS, typ: "text/plain" },
      llms: {
        status: 200,
        text: "# kemero\n\n> En webbyrå i Västerås.",
        typ: "text/plain",
      },
      startsida: { status: 200, text: MED_TEXT + JSONLD, typ: "text/html" },
      robotsvar: { chatgpt: 200, claude: 200, perplexity: 200 },
    });
    expect(kontroller.map((k) => k.status)).toEqual(["ok", "ok", "ok", "ok"]);
  });

  test("ett bot-skydd hos servern ger en varning fast robots.txt tillåter", () => {
    const [robotar] = bedom({
      robots: { status: 200, text: KEMERO_ROBOTS, typ: "text/plain" },
      llms: null,
      startsida: { status: 200, text: MED_TEXT, typ: "text/html" },
      robotsvar: { chatgpt: 403, claude: 200, perplexity: 200 },
    });
    expect(robotar?.status).toBe("varning");
    expect(robotar?.text).toContain("ChatGPTs");
  });

  test("en sida som byggs med JavaScript fälls", () => {
    const kontroller = bedom({
      robots: null,
      llms: { status: 200, text: SPA, typ: "text/html" },
      startsida: { status: 200, text: SPA, typ: "text/html" },
      robotsvar: {},
    });
    expect(kontroller.map((k) => [k.id, k.status])).toEqual([
      ["robotar", "ok"],
      ["llms", "varning"],
      ["html", "fel"],
      ["struktur", "fel"],
    ]);
  });
});

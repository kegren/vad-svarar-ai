import inter500 from "@fontsource/inter/files/inter-latin-500-normal.woff?inline";
import inter600 from "@fontsource/inter/files/inter-latin-600-normal.woff?inline";
import { createFileRoute } from "@tanstack/react-router";
import { ImageResponse } from "workers-og";
import { svarsnyckel } from "#/lib/analys";
import { hamtaKorning } from "#/lib/korning.server";
import { TJANST_ORDNING, TJANSTER } from "#/lib/modeller";
import { namnsI } from "#/lib/svarstext";

const EMALJ = "#eee8dc";
const GLAS = "#f7f2e7";
const BAKELIT = "#1a1714";
const DOV = "#544a42";
const SANDNING = "#c4301a";

// Satori läser woff men inte woff2. Typsnitten ligger inbakade som data-URL.
function typsnitt(dataUrl: string) {
  const bin = atob(dataUrl.slice(dataUrl.indexOf(",") + 1));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0)).buffer;
}

function datum(iso: string) {
  return new Date(iso).toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Stockholm",
  });
}

// Delningsbilden (PLAN.md avsnitt 5.6): hur många av de åtta svaren som nämner
// företaget, namnet, datumet och frekvensskalan med en prick per tjänst.
export const Route = createFileRoute("/api/bild/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const korning = await hamtaKorning(params.id);
        if (!korning?.analys) {
          return new Response("Finns inte", { status: 404 });
        }
        const namnsPer = Object.fromEntries(
          TJANST_ORDNING.map((t) => [
            t,
            ([0, 1] as const).some((f) => {
              const s = korning.svar[svarsnyckel(t, f)];
              return Boolean(s && !s.fel && namnsI(s.text, korning.foretag));
            }),
          ])
        );
        const namns = Object.values(korning.svar).filter(
          (s) => !s.fel && namnsI(s.text, korning.foretag)
        ).length;
        const stor = korning.foretag.length > 18 ? 60 : 76;
        // Nålen står på första stationen som nämner företaget, som i mottagaren.
        const nal = Math.max(
          0,
          TJANST_ORDNING.findIndex((t) => namnsPer[t])
        );

        const bild = (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "56px 64px",
              background: EMALJ,
              color: BAKELIT,
              fontFamily: "Inter",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  background: namns > 0 ? "#ff8a6e" : "rgba(26,23,20,0.2)",
                }}
              />
              <div style={{ fontSize: 28, fontWeight: 600 }}>
                Vad svarar AI?
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  fontSize: stor,
                  fontWeight: 600,
                  lineHeight: 1.04,
                  letterSpacing: "-0.035em",
                  maxWidth: 1000,
                }}
              >
                <span style={{ color: SANDNING, marginRight: 18 }}>
                  {korning.foretag}
                </span>
                <span>nämns i {namns} av 8 AI-svar</span>
              </div>
              <div
                style={{
                  marginTop: 20,
                  fontSize: 30,
                  fontWeight: 500,
                  color: DOV,
                }}
              >
                {`${korning.bransch} i ${korning.ort} · ${datum(korning.skapad)}`}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                position: "relative",
                height: 112,
                background: GLAS,
                border: `2px solid ${BAKELIT}`,
                borderRadius: 20,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 14,
                  left: 20,
                  right: 20,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                {Array.from({ length: 64 }, (_, i) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: strecken är fasta.
                    key={i}
                    style={{ width: 2, height: 18, background: BAKELIT }}
                  />
                ))}
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  left: `${12.5 + nal * 25}%`,
                  width: 5,
                  height: 34,
                  marginLeft: -2,
                  borderRadius: 3,
                  background: SANDNING,
                }}
              />
              {TJANST_ORDNING.map((t, i) => (
                <div
                  key={t}
                  style={{
                    position: "absolute",
                    top: 46,
                    left: `${12.5 + i * 25}%`,
                    width: 220,
                    marginLeft: -110,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 500, color: DOV }}>
                    {TJANSTER[t].namn}
                  </div>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      background: namnsPer[t]
                        ? SANDNING
                        : "rgba(26,23,20,0.25)",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        );

        const svar = new ImageResponse(bild, {
          width: 1200,
          height: 630,
          fonts: [
            { name: "Inter", data: typsnitt(inter500), weight: 500 },
            { name: "Inter", data: typsnitt(inter600), weight: 600 },
          ],
        });
        // Körningen ändras inte när analysen väl är sparad.
        svar.headers.set("Cache-Control", "public, max-age=86400");
        return svar;
      },
    },
  },
});

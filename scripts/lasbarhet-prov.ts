// Fas 4: provkör läsbarhetskontrollen mot riktiga hemsidor.
// Kör med `bun scripts/lasbarhet-prov.ts kemero.se nytimes.com`.
import { tolkaHemsida } from "../src/lib/lasbarhet";
import { kontrollera } from "../src/lib/lasbarhet.server";

for (const varde of process.argv.slice(2)) {
  const hemsida = tolkaHemsida(varde);
  if (!hemsida) {
    console.log(`${varde}: ingen giltig adress`);
    continue;
  }
  // biome-ignore lint/performance/noAwaitInLoops: en sajt i taget ger läsbar utskrift.
  const { kontroller } = await kontrollera(hemsida);
  console.log(`\n${hemsida}`);
  for (const k of kontroller) {
    const detaljer = k.detaljer
      .map((d) => `${d.etikett}:${d.status}`)
      .join(" ");
    console.log(`  ${k.status.padEnd(7)} ${k.rubrik}. ${k.text} ${detaljer}`);
  }
}

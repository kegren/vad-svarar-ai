import { useState } from "react";

// Favicon för en källa, på en ljus platta så att mörka ikoner syns i väven.
// Plattan visas först när ikonen har laddat, och chipet blir utan ikon om den
// inte går att hämta, så att det aldrig blir en tom ruta.
export function Favicon({ doman }: { doman: string }) {
  const [lage, setLage] = useState<"laddar" | "klar" | "fel">("laddar");
  if (lage === "fel") {
    return null;
  }
  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: onLoad och onError styr bara visningen och är ingen interaktion.
    <img
      alt=""
      className={`size-5 shrink-0 rounded-[5px] p-0.5 transition-opacity duration-300 ${
        lage === "klar" ? "bg-glas opacity-100" : "opacity-0"
      }`}
      height={20}
      loading="lazy"
      onError={() => setLage("fel")}
      onLoad={() => setLage("klar")}
      src={`https://icons.duckduckgo.com/ip3/${doman}.ico`}
      width={20}
    />
  );
}

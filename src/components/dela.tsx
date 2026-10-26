import { useState } from "react";
import { mat } from "#/lib/umami";

// Delar länken till den sparade körningen. I mobilen öppnas telefonens
// delningsmeny, annars kopieras länken.
export function Dela({ id, foretag }: { id: string; foretag: string }) {
  const [kopierad, setKopierad] = useState(false);

  const dela = async () => {
    const url = `${window.location.origin}/r/${id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Vad svarar AI om ${foretag}?`,
          url,
        });
        mat("resultat_delat", { satt: "dela" });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          return;
        }
      }
    }
    await navigator.clipboard.writeText(url);
    mat("resultat_delat", { satt: "kopiera" });
    setKopierad(true);
    setTimeout(() => setKopierad(false), 2400);
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <button
        className="bg-bakelit text-glas h-12 rounded-full px-6 font-semibold transition-[background-color,transform] hover:bg-[#2e2a26] active:scale-[0.98]"
        onClick={dela}
        type="button"
      >
        Dela resultatet
      </button>
      <p aria-live="polite" className="text-dov text-[0.95rem]">
        {kopierad
          ? "Länken är kopierad."
          : "Länken visar svaren som de var nu. Den sparas i 30 dagar."}
      </p>
    </div>
  );
}

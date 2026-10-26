import { lazy, Suspense, useEffect, useState } from "react";

const Silk = lazy(() => import("#/components/reactbits/Silk"));

// Ridån bakom scenen. Den statiska gradienten är första målningen. Silk laddas
// först när sidan är ledig, och står still vid reducerad rörelse.
// När körningen startar släcks salongen: ridån tonas ner så att korten tar scenen.
export function Rida({ slackt = false }: { slackt?: boolean }) {
  const [visa, setVisa] = useState(false);
  const [stilla, setStilla] = useState(false);

  useEffect(() => {
    setStilla(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const starta = () => setVisa(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(starta, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(starta, 1200);
    return () => clearTimeout(id);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(120%_70%_at_50%_-10%,#4a1422_0%,#2a0b13_45%,#120a0d_80%)]"
    >
      {visa ? (
        <Suspense fallback={null}>
          <div className="absolute inset-0 animate-[ridan_2.4s_var(--ease-ut)_both] opacity-90 lg:opacity-70">
            <Silk
              clickRipple={false}
              color="#5c1528"
              depth={0.7}
              glow={0.5}
              mouseInteraction={!stilla}
              noiseIntensity={0.8}
              paused={stilla}
              rotation={-0.785}
              scale={1.25}
              sheen={0.6}
              sheenColor="#ffe2b8"
              speed={2.2}
            />
          </div>
        </Suspense>
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(18_10_13/0.1)_0%,rgb(18_10_13/0.35)_35%,rgb(18_10_13/0.78)_62%,#120a0d_100%)]" />
      <div
        className={`bg-salong absolute inset-0 transition-opacity duration-[1600ms] ease-[var(--ease-ut)] ${
          slackt ? "opacity-55" : "opacity-0"
        }`}
      />
    </div>
  );
}

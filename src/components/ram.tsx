import { Link } from "@tanstack/react-router";

// Ordmärket med sändningslampan, som lyser när en mottagare på sidan sänder.
export function Ordmarke() {
  return (
    <Link
      className="flex items-center gap-2.5 text-[0.95rem] font-semibold tracking-[-0.01em]"
      to="/"
    >
      <span aria-hidden="true" className="topplampa size-2 rounded-full" />
      Vad svarar AI?
    </Link>
  );
}

// Avsändarraden (PLAN.md avsnitt 0).
export function Fot() {
  return (
    <footer className="text-svag mx-auto w-full max-w-6xl border-t border-[var(--linje)] px-4 py-8 text-sm sm:px-6">
      Byggt av{" "}
      <a
        className="text-dov hover:text-bakelit underline"
        data-umami-event="klick_kegren"
        href="https://kegren.com"
      >
        Kenny Damgren (kegren.com)
      </a>{" "}
      ·{" "}
      <a
        className="text-dov hover:text-bakelit underline"
        data-umami-event="klick_kemero"
        data-umami-event-plats="fot"
        href="https://kemero.se"
      >
        kemero.se
      </a>
    </footer>
  );
}

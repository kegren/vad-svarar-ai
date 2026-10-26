import { type Ref, useEffect, useImperativeHandle, useRef } from "react";

type TurnstileApi = {
  render: (
    el: HTMLElement,
    val: {
      sitekey: string;
      appearance: "interaction-only";
      language: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    }
  ) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  // biome-ignore lint/style/useConsistentTypeDefinitions: Window kan bara utökas med interface.
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SKRIPT =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let laddning: Promise<TurnstileApi> | null = null;

function laddaTurnstile() {
  laddning ??= new Promise((klar, fel) => {
    if (window.turnstile) {
      klar(window.turnstile);
      return;
    }
    const skript = document.createElement("script");
    skript.src = SKRIPT;
    skript.async = true;
    skript.onload = () =>
      window.turnstile ? klar(window.turnstile) : fel(new Error("Turnstile"));
    skript.onerror = () => {
      laddning = null;
      fel(new Error("Turnstile"));
    };
    document.head.appendChild(skript);
  });
  return laddning;
}

export type TurnstileHandle = { aterstall: () => void };

// Cloudflares kontroll att besökaren är en människa. Den syns bara om Cloudflare
// behöver fråga något, annars kommer token utan att besökaren märker det.
export function Turnstile({
  webbplatsnyckel,
  onToken,
  ref,
}: {
  webbplatsnyckel: string;
  onToken: (token: string) => void;
  ref?: Ref<TurnstileHandle>;
}) {
  const ruta = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const tokenRef = useRef(onToken);
  tokenRef.current = onToken;

  useImperativeHandle(ref, () => ({
    aterstall: () => {
      tokenRef.current("");
      if (widget.current) {
        window.turnstile?.reset(widget.current);
      }
    },
  }));

  useEffect(() => {
    let avbruten = false;
    laddaTurnstile()
      .then((api) => {
        if (avbruten || !ruta.current) {
          return;
        }
        widget.current = api.render(ruta.current, {
          sitekey: webbplatsnyckel,
          appearance: "interaction-only",
          language: "sv",
          callback: (token) => tokenRef.current(token),
          "expired-callback": () => tokenRef.current(""),
          "error-callback": () => tokenRef.current(""),
        });
      })
      .catch(() => tokenRef.current(""));
    return () => {
      avbruten = true;
      if (widget.current) {
        window.turnstile?.remove(widget.current);
        widget.current = null;
      }
    };
  }, [webbplatsnyckel]);

  return <div className="mt-3 empty:hidden" ref={ruta} />;
}

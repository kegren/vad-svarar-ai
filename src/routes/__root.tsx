import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { UMAMI_SKRIPT, UMAMI_WEBBPLATS } from "#/lib/umami";
import appCss from "../styles.css?url";

const BESKRIVNING =
  "Fyra AI-tjänster får två kundfrågor om ditt företag. Se vad de svarar, vilka källor de läser och vad du kan rätta.";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Vad svarar AI?" },
      { name: "description", content: BESKRIVNING },
      { property: "og:site_name", content: "Vad svarar AI?" },
      { property: "og:locale", content: "sv_SE" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
    scripts:
      import.meta.env.PROD && UMAMI_WEBBPLATS
        ? [
            {
              src: UMAMI_SKRIPT,
              defer: true,
              "data-website-id": UMAMI_WEBBPLATS,
            },
          ]
        : [],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="sv">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

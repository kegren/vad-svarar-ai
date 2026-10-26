import { createFileRoute } from "@tanstack/react-router";
import { hamtaStatus } from "#/lib/status.functions";

export const Route = createFileRoute("/")({
  loader: () => hamtaStatus(),
  component: Startsida,
});

function Startsida() {
  const status = Route.useLoaderData();

  return (
    <main className="mx-auto max-w-2xl px-4 py-24">
      <h1 className="text-4xl font-semibold tracking-tight">
        Syns ditt företag när kunderna frågar AI?
      </h1>
      <ul className="mt-8 space-y-2 text-neutral-400">
        <li>OpenRouter-nyckeln: {status.nyckel ? "läses" : "saknas"}</li>
        <li>
          D1:{" "}
          {status.tabeller.length > 0
            ? status.tabeller.join(", ")
            : "inga tabeller ännu"}
        </li>
      </ul>
    </main>
  );
}

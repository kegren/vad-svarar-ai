import {
  createServerEntry,
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";
import { rensaGamla } from "#/lib/skydd.server";

// Starts vanliga serveringång plus cron-triggern som rensar gamla körningar.
const { fetch } = createServerEntry({
  fetch: createStartHandler(defaultStreamHandler),
});

export default {
  fetch,
  scheduled(_kontroll: ScheduledController, _env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(rensaGamla());
  },
};

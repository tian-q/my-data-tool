import { z } from "zod";

// Validate the env at build/startup time. Imported from next.config.mjs so it
// actually runs on `next dev` / `next build`; a missing var fails fast.
const schema = z.object({
	NEXT_PUBLIC_APP_NAME: z.string().min(1),
});

export const env = schema.parse({
	NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
});

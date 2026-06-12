import { z } from "zod";

// Validate env at startup (imported from main.tsx) so a missing var fails fast.
// Vite reads .env automatically and exposes VITE_-prefixed vars on import.meta.env.
const schema = z.object({
	VITE_APP_NAME: z.string().min(1),
});

export const env = schema.parse(import.meta.env);

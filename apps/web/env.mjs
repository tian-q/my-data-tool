import { z } from "zod";

// Validate the env at build/startup time. Imported from next.config.mjs so it
// actually runs on `next dev` / `next build`; a missing var fails fast.
const schema = z.object({
	NEXT_PUBLIC_APP_NAME: z.string().min(1),
	// Base path for backend API calls. Dev rewrites `/api/*` to the proxy
	// target (see next.config.mjs); prod points at the real Nginx-fronted host.
	// Mirrors the Vue client's hard-coded `baseURL: '/api'`.
	NEXT_PUBLIC_API_BASE: z.string().min(1).default("/api"),
});

export const env = schema.parse({
	NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
	NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE,
});

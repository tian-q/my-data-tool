import "./env.mjs"; // run env validation at config load (see env.mjs)

// Dev proxy target for backend API calls. Replaces the Vue `vite.config.js`
// `server.proxy['/api']`. Defaults to the live auth host; override per-machine
// with `API_PROXY_TARGET` in `.env.local`. (The Vue `/ws` proxy is workbench-only
// and intentionally omitted here — add it when the workbench is migrated.)
const apiProxyTarget =
	process.env.API_PROXY_TARGET || "http://124.174.77.199";

/** @type {import('next').NextConfig} */
const nextConfig = {
	// Required: let Next compile @app/core's raw .ts source from the monorepo.
	transpilePackages: ["@app/core"],
	// React Compiler. In Next 16 this is a top-level option (no longer under `experimental`).
	reactCompiler: true,
	async rewrites() {
		// Forward `/api/*` to the backend, keeping the `/api` prefix the server
		// expects (the Vue proxy did not rewrite the path either).
		return [
			{
				source: "/api/:path*",
				destination: `${apiProxyTarget}/api/:path*`,
			},
		];
	},
};

export default nextConfig;

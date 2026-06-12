import "./env.mjs"; // run env validation at config load (see env.mjs)

/** @type {import('next').NextConfig} */
const nextConfig = {
	// Required: let Next compile @app/core's raw .ts source from the monorepo.
	transpilePackages: ["@app/core"],
	// React Compiler. In Next 16 this is a top-level option (no longer under `experimental`).
	reactCompiler: true,
};

export default nextConfig;

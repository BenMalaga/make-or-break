/** @type {import('next').NextConfig} */

// Baseline security headers on every response. The CSP is intentionally scoped
// to frame-ancestors only (anti-clickjacking) so it cannot break the Build IDE,
// Pyodide, WebLLM, Wandbox, or the sandboxed lab iframes. A full script/connect
// CSP can be layered on later once every runtime source is enumerated.
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

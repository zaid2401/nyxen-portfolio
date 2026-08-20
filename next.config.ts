import type { NextConfig } from "next";

/**
 * Security response headers.
 *
 * Next.js sets none of these by default, and on a public site they are close to
 * free: no build cost, no runtime cost, no effect on how the page renders.
 *
 * Deliberately NOT here: a full Content-Security-Policy. This app inlines two
 * scripts on purpose — the pre-paint bootstrap that stops the power screen and
 * boot overlay flashing, and the JSON-LD block — so a strict CSP would need
 * per-request nonce plumbing through the document. That is a real change with a
 * real failure mode (a broken nonce means a blank first paint), and shipping a
 * half-strict CSP with `unsafe-inline` would look like protection while
 * providing none. `frame-ancestors` below covers the clickjacking case that a
 * CSP would otherwise be carrying.
 */
const securityHeaders = [
  // Stops a browser second-guessing a declared Content-Type, which is how a
  // served asset gets reinterpreted as a script.
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Send the origin cross-site, the full path same-site. Keeps referrer
  // analytics working without leaking paths to third parties.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Nothing here needs a camera, a microphone or a location.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },

  // Clickjacking. `frame-ancestors` is the modern control; X-Frame-Options is
  // kept alongside it for older browsers that ignore the CSP directive.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  // Hides the framework version from responses. Minor, but free.
  poweredByHeader: false,

  async headers() {
    return [
      {
        // Every route, including the API handlers and static assets.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

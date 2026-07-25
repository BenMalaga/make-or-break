import type { MetadataRoute } from "next";

// Web app manifest (served at /manifest.webmanifest, auto-linked by Next).
// Makes the site installable as a standalone app with a home-screen icon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Make or Break",
    short_name: "Make or Break",
    description:
      "Learn how technology works by building it and by taking it apart. Free and open source.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#181825",
    theme_color: "#181825",
    orientation: "any",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Español — learn Spanish page by page",
    short_name: "Español",
    description: "Learn Spanish from zero, one fun page at a time.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFD23F",
    theme_color: "#FFD23F",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}

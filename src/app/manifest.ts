import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PotSaver - Automate Your Savings",
    short_name: "PotSaver",
    description:
      "Automatically transfer credit card balances to your Monzo pots. Connect Monzo and credit cards, set up transfers, and save smarter.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#ff5a5f",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
        purpose: "any",
      },
    ],
  };
}

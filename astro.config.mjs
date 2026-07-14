// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import critters from "astro-critters";

// https://astro.build/config
export default defineConfig({
    site: "https://connectedspeech.co.za",
    compressHTML: true,
    trailingSlash: "never",
    prefetch: true,

    build: {
        format: "file",
    },

    devToolbar: {
        enabled: false,
    },

    vite: {
        plugins: [tailwindcss()],
    },

    integrations: [
        critters(),
        sitemap({
            serialize(item) {
                const priorities = /** @type {Record<string, number>} */ ({
                    "https://connectedspeech.co.za/": 1.0,
                    "https://connectedspeech.co.za/services": 0.9,
                    "https://connectedspeech.co.za/contact": 0.8,
                });
                const priority = priorities[item.url] ?? 0.7;
                const changefreq = /** @type {any} */ (item.url === "https://connectedspeech.co.za/" ? "weekly" : "monthly");
                const lastmod = new Date().toISOString().split("T")[0];
                return { ...item, priority, changefreq, lastmod };
            },
        }),
    ],
});

// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

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
        sitemap({
            serialize(item) {
                const priorities = /** @type {Record<string, number>} */ ({
                    "https://connectedspeech.co.za/": 1.0,
                    "https://connectedspeech.co.za/services": 0.9,
                    "https://connectedspeech.co.za/contact": 0.8,
                });
                const priority = priorities[item.url] ?? 0.7;
                const changefreq = /** @type {any} */ (item.url === "https://connectedspeech.co.za/" ? "weekly" : "monthly");
                return { ...item, priority, changefreq };
            },
        }),
    ],
});

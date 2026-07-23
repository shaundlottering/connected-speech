// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import critters from "astro-critters";

import partytown from "@astrojs/partytown";

// https://astro.build/config
export default defineConfig({
    site: "https://connectedspeech.co.za/",
    compressHTML: true,
    trailingSlash: "never",
    build: {
        format: "file",
    },

    devToolbar: {
        enabled: false,
    },

    vite: {
        plugins: [tailwindcss()],
    },

    integrations: [critters(), partytown({ config: { forward: ['dataLayer.push'] } }), sitemap({
        filter: (page) => !page.includes('/test') && !page.includes('/thanks'),
        serialize(item) {
            const priorities = /** @type {Record<string, number>} */ ({
                "https://connectedspeech.co.za/": 1.0,
                "https://connectedspeech.co.za/therapy-services": 0.9,
                "https://connectedspeech.co.za/contact": 0.8,
                "https://connectedspeech.co.za/about": 0.7,
                "https://connectedspeech.co.za/therapy-services/school-based-speech-therapy": 0.7,
                "https://connectedspeech.co.za/therapy-services/speech-therapy": 0.7,
                "https://connectedspeech.co.za/therapy-services/feeding-therapy": 0.7,
                "https://connectedspeech.co.za/therapy-services/special-needs-speech-therapy": 0.7,
                "https://connectedspeech.co.za/how-we-work": 0.6,
            });
            const priority = priorities[item.url] ?? 0.6;
            const changefreq = /** @type {any} */ ("weekly");
            const lastmod = new Date().toISOString().split("T")[0];
            return { ...item, priority, changefreq, lastmod };
        },
    })],
});
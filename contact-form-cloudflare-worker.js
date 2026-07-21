export default {
    async fetch(request, env) {
        if (request.method !== "POST") {
            return new Response("Method not allowed", { status: 405 });
        }

        const ip = request.headers.get("CF-Connecting-IP") || "unknown";

        if (await isRateLimited(ip, env)) {
            return html(
                "Too many requests. Please try again in 15 minutes.",
                429,
            );
        }

        let form;
        try {
            form = await request.formData();
        } catch {
            return html("Invalid form submission.", 400);
        }

        const data = {
            name: (form.get("name") || "").toString().trim(),
            email: (form.get("email") || "").toString().trim(),
            phone: (form.get("phone") || "").toString().trim(),
            message: (form.get("message") || "").toString().trim(),
            // honeypot: bots fill this, real users never see it
            website: (form.get("website") || "").toString().trim(),
        };

        if (data.website) {
            // silently pretend success to the bot
            return Response.redirect(env.REDIRECT_URL, 303);
        }

        const errors = validate(data);
        if (errors.length) {
            return html(`Please fix: ${errors.join(", ")}`, 400);
        }

        const sent = await sendEmail(data, env);
        if (!sent) {
            return html(
                "Something went wrong sending your message. Try again later.",
                502,
            );
        }

        return Response.redirect(env.REDIRECT_URL, 303);
    },
};

async function isRateLimited(ip, env) {
    const key = `rl:${ip}`;
    const count = parseInt(await env.RATE_LIMIT.get(key)) || 0;
    if (count >= 5) return true;
    await env.RATE_LIMIT.put(key, String(count + 1), { expirationTtl: 900 }); // 15 min
    return false;
}

const EMAIL_RE =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function validate(data) {
    const errors = [];
    if (!data.name) errors.push("name is required");
    if (!data.email || !EMAIL_RE.test(data.email))
        errors.push("valid email is required");
    if (!data.message) errors.push("message is required");
    if (data.message.length > 5000) errors.push("message is too long");
    return errors;
}

async function sendEmail(data, env) {
    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: env.FROM_EMAIL,
            to: env.TO_EMAIL,
            reply_to: data.email,
            subject: `New contact from ${data.name}`,
            html: `
        <p><b>Name:</b> ${escapeHtml(data.name)}</p>
        <p><b>Email:</b> ${escapeHtml(data.email)}</p>
        ${data.phone ? `<p><b>Phone:</b> ${escapeHtml(data.phone)}</p>` : ""}
        <p><b>Message:</b></p>
        <p>${escapeHtml(data.message).replace(/\n/g, "<br>")}</p>
      `,
        }),
    });
    return res.ok;
}

function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function html(msg, status) {
    return new Response(
        `<!DOCTYPE html><html><body><p>${msg}</p><a href="javascript:history.back()">Go back</a></body></html>`,
        { status, headers: { "Content-Type": "text/html" } },
    );
}

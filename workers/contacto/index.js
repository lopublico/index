// Cloudflare Worker: recibe el formulario de contacto y lo reenvía por correo con Resend.
// La clave de Resend vive solo aquí (secreto RESEND_API_KEY); la web nunca la ve.

const cors = (origin) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Vary": "Origin",
});
const json = (data, status, origin) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...cors(origin) } });

const limpia = (t, max) => String(t ?? "").replace(/[\r\n]+/g, " ").slice(0, max).trim();
const limpiaCuerpo = (t, max) => String(t ?? "").slice(0, max).trim();
const esEmail = (e) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(e);
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default {
  async fetch(req, env) {
    const permitido = (env.ALLOWED_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
    const origin = req.headers.get("Origin") || "";
    const okOrigin = permitido.length === 0 || permitido.includes(origin);
    const o = okOrigin ? origin || "*" : permitido[0];
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(o) });
    if (req.method !== "POST" || !okOrigin) return json({ error: "No permitido" }, 403, o);

    let d;
    try { d = await req.json(); } catch { return json({ error: "Petición no válida" }, 400, o); }

    if (d.website) return json({ ok: true }, 200, o); // bot: se finge éxito

    const email = limpia(d.email, 200);
    const asunto = limpia(d.asunto, 150) || "Contacto Lo público";
    const mensaje = limpiaCuerpo(d.mensaje, 5000);
    if (!esEmail(email)) return json({ error: "Correo no válido" }, 400, o);
    if (mensaje.length < 10) return json({ error: "El mensaje es demasiado corto" }, 400, o);

    if (env.TURNSTILE_SECRET) {
      const form = new FormData();
      form.append("secret", env.TURNSTILE_SECRET);
      form.append("response", d.turnstile || "");
      form.append("remoteip", req.headers.get("CF-Connecting-IP") || "");
      const v = await (await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form })).json();
      if (!v.success) return json({ error: "Verificación no superada" }, 400, o);
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to: [env.MAIL_TO],
        reply_to: email,
        subject: `[Contacto] ${asunto}`,
        text: `De: ${email}\n\n${mensaje}`,
        html: `<p><strong>De:</strong> ${esc(email)}</p><p style="white-space:pre-wrap">${esc(mensaje)}</p>`,
      }),
    });
    if (!res.ok) return json({ error: "No se pudo enviar el mensaje" }, 502, o);
    return json({ ok: true }, 200, o);
  },
};

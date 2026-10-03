/*
 * POST /api/reserve — reservation requests, delivered by email through Resend.
 *
 * Runs as a Vercel serverless function (Node 18+, no dependencies).
 * Required environment variables (see .env.example):
 *   RESEND_API_KEY     Resend API key (server-side only, never ship to the browser)
 *   RESERVATION_TO     Inbox that receives booking requests, e.g. host@kilnandcrust.com
 *   RESERVATION_FROM   Verified Resend sender, e.g. "Kiln & Crust <reservations@kilnandcrust.com>"
 * Optional:
 *   GUEST_CONFIRMATION "false" to skip the "we got your request" email to the guest
 *
 * This only sends a *request*. Staff confirm each booking by replying to the email
 * (Reply-To is set to the guest's address).
 */

const RESEND_URL = "https://api.resend.com/emails";
const TIME_ZONE = "America/Chicago";
const MAX_PARTY = 12;
const BOOKING_WINDOW_DAYS = 60;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[0-9+().\-\s]{7,30}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^(1[0-2]|[1-9]):[0-5]\d (AM|PM)$/;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clean(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function todayInAustin() {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
}

function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function prettyDate(isoDate) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${isoDate}T12:00:00Z`));
}

function validate(body) {
  const data = {
    name: clean(body.name, 80),
    email: clean(body.email, 120),
    phone: clean(body.phone, 30),
    date: clean(body.date, 10),
    time: clean(body.time, 8),
    party: Number(body.party),
    notes: clean(body.notes, 500),
  };

  if (!data.name) return { error: "Please tell us your name." };
  if (!EMAIL_RE.test(data.email)) return { error: "Please enter a valid email address." };
  if (data.phone && !PHONE_RE.test(data.phone)) return { error: "Please check your phone number." };
  if (!Number.isInteger(data.party) || data.party < 1 || data.party > MAX_PARTY) {
    return { error: `Online requests are for 1–${MAX_PARTY} guests. Larger groups, please call.` };
  }
  if (!TIME_RE.test(data.time)) return { error: "Please choose a time." };

  if (!DATE_RE.test(data.date) || Number.isNaN(Date.parse(`${data.date}T12:00:00Z`))) {
    return { error: "Please choose a valid date." };
  }
  const today = todayInAustin();
  if (data.date < today) return { error: "That date has already passed." };
  if (data.date > addDays(today, BOOKING_WINDOW_DAYS)) {
    return { error: `We take requests up to ${BOOKING_WINDOW_DAYS} days out.` };
  }
  if (new Date(`${data.date}T12:00:00Z`).getUTCDay() === 1) {
    return { error: "We're closed on Mondays." };
  }

  return { data };
}

async function sendEmail(payload) {
  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${detail}`);
  }
  return res.json();
}

function restaurantEmail(r) {
  const when = `${prettyDate(r.date)} at ${r.time}`;
  const rows = [
    ["Name", r.name],
    ["Party", `${r.party} ${r.party === 1 ? "guest" : "guests"}`],
    ["When", when],
    ["Email", r.email],
    ["Phone", r.phone || "—"],
    ["Notes", r.notes || "—"],
  ];

  const html = `
    <div style="font-family:ui-monospace,Menlo,monospace;font-size:14px;color:#14110f;max-width:520px">
      <h2 style="font-family:Georgia,serif;margin:0 0 16px">New table request</h2>
      <table cellpadding="6" style="border-collapse:collapse;width:100%">
        ${rows.map(([k, v]) => `
          <tr style="border-top:1px dashed #ccc">
            <td style="color:#888;white-space:nowrap;vertical-align:top">${k}</td>
            <td style="white-space:pre-wrap">${escapeHtml(v)}</td>
          </tr>`).join("")}
      </table>
      <p style="margin-top:20px;color:#888">Reply to this email to confirm with the guest.</p>
    </div>`;

  const text = [
    "New table request",
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    "Reply to this email to confirm with the guest.",
  ].join("\n");

  return {
    from: process.env.RESERVATION_FROM,
    to: [process.env.RESERVATION_TO],
    reply_to: r.email,
    subject: `Table request: ${r.name.replace(/[\r\n]+/g, " ")}, ${r.party} · ${prettyDate(r.date)} ${r.time}`,
    html,
    text,
  };
}

function guestEmail(r) {
  const firstName = r.name.split(/\s+/)[0];
  const when = `${prettyDate(r.date)} at ${r.time}`;

  const html = `
    <div style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#14110f;max-width:520px">
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>Thanks for your request for <strong>${r.party}</strong> on <strong>${escapeHtml(when)}</strong>.
         This isn't a confirmation yet: we'll check the book and reply to this email shortly.</p>
      <p>See you by the fire,<br>Kiln &amp; Crust</p>
    </div>`;

  const text = `Hi ${firstName},

Thanks for your request for ${r.party} on ${when}. This isn't a confirmation yet: we'll check the book and reply to this email shortly.

See you by the fire,
Kiln & Crust`;

  return {
    from: process.env.RESERVATION_FROM,
    to: [r.email],
    reply_to: process.env.RESERVATION_TO,
    subject: "We got your table request — Kiln & Crust",
    html,
    text,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { RESEND_API_KEY, RESERVATION_TO, RESERVATION_FROM } = process.env;
  if (!RESEND_API_KEY || !RESERVATION_TO || !RESERVATION_FROM) {
    console.error("reserve: missing RESEND_API_KEY, RESERVATION_TO or RESERVATION_FROM");
    return res.status(500).json({ error: "Online booking isn't set up yet." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "Invalid request." });
  }

  // Honeypot filled in: pretend it worked so bots move on.
  if (clean(body.company, 200)) return res.status(200).json({ ok: true });

  const { data, error } = validate(body);
  if (error) return res.status(400).json({ error });

  try {
    await sendEmail(restaurantEmail(data));
  } catch (err) {
    console.error("reserve: restaurant email failed", err);
    return res.status(502).json({ error: "We couldn't send your request." });
  }

  if (process.env.GUEST_CONFIRMATION !== "false") {
    // Best effort: the booking request already reached the restaurant.
    try {
      await sendEmail(guestEmail(data));
    } catch (err) {
      console.error("reserve: guest confirmation failed", err);
    }
  }

  return res.status(200).json({ ok: true });
}

import nodemailer from "nodemailer";

export const runtime = "nodejs";

type ContactPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message: string;

  // Turnstile token from client
  turnstileToken?: string;

  // Honeypot (bots fill hidden fields)
  company?: string;
};

function escapeHtml(str: string) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizePhone(phone?: string) {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<ContactPayload>;

    // Honeypot: if filled, silently accept but do nothing
    if (body.company && String(body.company).trim().length > 0) {
      return Response.json({ ok: true });
    }

    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const message = String(body.message ?? "").trim();
const turnstileToken = String(body.turnstileToken ?? "").trim();

    if (!firstName || !lastName || !email || !message) {
      return Response.json({ ok: false, error: "MISSING_FIELDS" }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return Response.json({ ok: false, error: "INVALID_EMAIL" }, { status: 400 });
    }

    const phoneDigits = normalizePhone(phone);
    if (phone && phoneDigits.length !== 10) {
      return Response.json({ ok: false, error: "INVALID_PHONE" }, { status: 400 });
    }

// Turnstile verification
const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
if (!turnstileSecret) {
  return Response.json({ ok: false, error: "TURNSTILE_NOT_CONFIGURED" }, { status: 500 });
}
if (!turnstileToken) {
  return Response.json({ ok: false, error: "TURNSTILE_MISSING" }, { status: 400 });
}

// Optional: pass IP (nice-to-have)
const ip =
  req.headers.get("cf-connecting-ip") ||
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  undefined;

const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    secret: turnstileSecret,
    response: turnstileToken,
    ...(ip ? { remoteip: ip } : {}),
  }),
});

const verifyData = (await verifyRes.json()) as { success: boolean; ["error-codes"]?: string[] };

if (!verifyData.success) {
  return Response.json(
    { ok: false, error: "TURNSTILE_FAILED", details: verifyData["error-codes"] || [] },
    { status: 400 }
  );
}

    // Env
    const adminTo = process.env.CONTACT_ADMIN_TO;
    const fromName = process.env.CONTACT_FROM_NAME || "Legal Client Intake";
    const fromEmail = process.env.CONTACT_FROM_EMAIL;

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || "465");
    const smtpSecure = (process.env.SMTP_SECURE || "true") === "true";
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!adminTo || !fromEmail || !smtpHost || !smtpUser || !smtpPass) {
      return Response.json({ ok: false, error: "SERVER_NOT_CONFIGURED" }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const safeName = escapeHtml(`${firstName} ${lastName}`);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone || "");
    const safeMessage = escapeHtml(message);

    const submittedAt = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
    });

    // 1) Admin email (to operations alias)
    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: adminTo,
      subject: `New inquiry: ${firstName} ${lastName}`,
      text:
        `New website inquiry\n\n` +
        `Name: ${firstName} ${lastName}\n` +
        `Email: ${email}\n` +
        `Phone: ${phone || "(not provided)"}\n` +
        `Submitted: ${submittedAt}\n\n` +
        `Message:\n${message}\n`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5">
          <h2 style="margin:0 0 12px 0">New website inquiry</h2>
          <table cellpadding="0" cellspacing="0" style="border-collapse:collapse">
            <tr><td style="padding:4px 10px 4px 0"><b>Name</b></td><td>${safeName}</td></tr>
            <tr><td style="padding:4px 10px 4px 0"><b>Email</b></td><td>${safeEmail}</td></tr>
            <tr><td style="padding:4px 10px 4px 0"><b>Phone</b></td><td>${safePhone || "(not provided)"}</td></tr>
            <tr><td style="padding:4px 10px 4px 0"><b>Submitted</b></td><td>${escapeHtml(
              submittedAt
            )}</td></tr>
          </table>
          <h3 style="margin:16px 0 6px 0">Message</h3>
          <div style="white-space:pre-wrap;border:1px solid #e5e7eb;padding:12px;border-radius:8px">
            ${safeMessage}
          </div>
        </div>
      `,
      replyTo: email,
    });

    // 2) Confirmation email to sender
    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: "We received your message — Legal Client Intake",
      text:
        `Hi ${firstName},\n\n` +
        `Thanks for reaching out to Legal Client Intake. We received your message and will respond as soon as possible.\n\n` +
        `— Legal Client Intake\n` +
        `operations@legalclientintake.com\n`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6">
          <p>Hi ${escapeHtml(firstName)},</p>
          <p>Thanks for reaching out to <b>Legal Client Intake</b>. We received your message and will respond as soon as possible.</p>
          <p style="margin-top:18px">
            — Legal Client Intake<br/>
            <a href="mailto:operations@legalclientintake.com">operations@legalclientintake.com</a>
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0" />
          <p style="font-size:12px;color:#6b7280;margin:0">
            This is an automated confirmation. If you need to add details, reply to this email.
          </p>
        </div>
      `,
      replyTo: "operations@legalclientintake.com",
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("CONTACT_ROUTE_ERROR", err);
    return Response.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
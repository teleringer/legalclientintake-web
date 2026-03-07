import nodemailer from "nodemailer";

export const runtime = "nodejs";

type ContactPayload = {
  firstName: string;
  lastName: string;
  firmName?: string;
  jurisdiction?: string;
  email: string;
  phone?: string;
  practiceAreas?: string[];
  message: string;
  turnstileToken?: string;
  company?: string;
};

type TurnstileVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
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

    // Honeypot
    if (body.company && String(body.company).trim().length > 0) {
      return Response.json({ ok: true });
    }

    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const firmName = String(body.firmName ?? "").trim();
    const jurisdiction = String(body.jurisdiction ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const message = String(body.message ?? "").trim();
    const turnstileToken = String(body.turnstileToken ?? "").trim();

    const practiceAreas = Array.isArray(body.practiceAreas)
      ? body.practiceAreas.map((item) => String(item).trim()).filter(Boolean)
      : [];

    if (!firstName || !lastName || !firmName || !email || !message) {
      return Response.json({ ok: false, error: "MISSING_FIELDS" }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return Response.json({ ok: false, error: "INVALID_EMAIL" }, { status: 400 });
    }

    const phoneDigits = normalizePhone(phone);
    if (phone && phoneDigits.length !== 10) {
      return Response.json({ ok: false, error: "INVALID_PHONE" }, { status: 400 });
    }

    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (!turnstileSecret) {
      console.error("Missing TURNSTILE_SECRET_KEY");
      return Response.json({ ok: false, error: "TURNSTILE_NOT_CONFIGURED" }, { status: 500 });
    }

    if (!turnstileToken) {
      return Response.json({ ok: false, error: "TURNSTILE_MISSING" }, { status: 400 });
    }

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip =
      req.headers.get("cf-connecting-ip") ||
      (forwardedFor ? forwardedFor.split(",")[0].trim() : "");

    const verifyBody = new URLSearchParams({
      secret: turnstileSecret,
      response: turnstileToken,
    });

    if (ip) {
      verifyBody.append("remoteip", ip);
    }

    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: verifyBody.toString(),
    });

    if (!verifyRes.ok) {
      const raw = await verifyRes.text().catch(() => "");
      console.error("Turnstile verify HTTP error:", verifyRes.status, raw);
      return Response.json({ ok: false, error: "TURNSTILE_VERIFY_HTTP_ERROR" }, { status: 500 });
    }

    const verifyData = (await verifyRes.json()) as TurnstileVerifyResponse;

    if (!verifyData.success) {
      console.error("Turnstile failed:", verifyData["error-codes"] || []);
      return Response.json(
        { ok: false, error: "TURNSTILE_FAILED", details: verifyData["error-codes"] || [] },
        { status: 400 }
      );
    }

    const adminTo = process.env.CONTACT_ADMIN_TO;
    const fromName = process.env.CONTACT_FROM_NAME || "Legal Client Intake";
    const fromEmail = process.env.CONTACT_FROM_EMAIL;
    const replyToInbox = process.env.CONTACT_REPLY_TO || adminTo || fromEmail || "";

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || "465");
    const smtpSecure = (process.env.SMTP_SECURE || "true").toLowerCase() === "true";
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!adminTo || !fromEmail || !smtpHost || !smtpUser || !smtpPass) {
      console.error("Missing required email env vars", {
        CONTACT_ADMIN_TO: !!adminTo,
        CONTACT_FROM_EMAIL: !!fromEmail,
        SMTP_HOST: !!smtpHost,
        SMTP_USER: !!smtpUser,
        SMTP_PASS: !!smtpPass,
      });

      return Response.json({ ok: false, error: "SERVER_NOT_CONFIGURED" }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.verify();

    const fullName = [firstName, lastName].filter(Boolean).join(" ");
    const practiceAreasText = practiceAreas.length > 0 ? practiceAreas.join(", ") : "(not provided)";
    const submittedAt = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
    });

    const safeFullName = escapeHtml(fullName);
    const safeFirmName = escapeHtml(firmName);
    const safeJurisdiction = escapeHtml(jurisdiction || "(not provided)");
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone || "(not provided)");
    const safePracticeAreas = escapeHtml(practiceAreasText);
    const safeSubmittedAt = escapeHtml(submittedAt);
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: adminTo,
      subject: `New LegalClientIntake inquiry: ${fullName}`,
      text:
        `New LegalClientIntake contact submission\n\n` +
        `Name: ${fullName}\n` +
        `Firm Name: ${firmName}\n` +
        `Jurisdiction: ${jurisdiction || "(not provided)"}\n` +
        `Email: ${email}\n` +
        `Phone: ${phone || "(not provided)"}\n` +
        `Practice Areas: ${practiceAreasText}\n` +
        `Submitted: ${submittedAt}\n\n` +
        `Message:\n${message}\n`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.55;color:#111827;">
          <h2 style="margin:0 0 14px 0;">New LegalClientIntake contact submission</h2>

          <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td style="padding:4px 14px 4px 0;"><strong>Name</strong></td>
              <td style="padding:4px 0;">${safeFullName}</td>
            </tr>
            <tr>
              <td style="padding:4px 14px 4px 0;"><strong>Firm Name</strong></td>
              <td style="padding:4px 0;">${safeFirmName}</td>
            </tr>
            <tr>
              <td style="padding:4px 14px 4px 0;"><strong>Jurisdiction</strong></td>
              <td style="padding:4px 0;">${safeJurisdiction}</td>
            </tr>
            <tr>
              <td style="padding:4px 14px 4px 0;"><strong>Email</strong></td>
              <td style="padding:4px 0;">${safeEmail}</td>
            </tr>
            <tr>
              <td style="padding:4px 14px 4px 0;"><strong>Phone</strong></td>
              <td style="padding:4px 0;">${safePhone}</td>
            </tr>
            <tr>
              <td style="padding:4px 14px 4px 0; vertical-align:top;"><strong>Practice Areas</strong></td>
              <td style="padding:4px 0;">${safePracticeAreas}</td>
            </tr>
            <tr>
              <td style="padding:4px 14px 4px 0;"><strong>Submitted</strong></td>
              <td style="padding:4px 0;">${safeSubmittedAt}</td>
            </tr>
          </table>

          <h3 style="margin:18px 0 8px 0;">Message</h3>
          <div style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;background:#fafafa;">
            ${safeMessage}
          </div>

          <p style="margin-top:18px;font-size:12px;color:#6b7280;">
            NOTICE: Submission of this form does not create an attorney-client relationship.
            Do not treat website submissions as confidential or time-sensitive without direct follow-up.
          </p>
        </div>
      `,
      replyTo: email,
    });

    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: "We received your message — Legal Client Intake",
      text:
        `Hi ${firstName},\n\n` +
        `Thank you for contacting Legal Client Intake. We received your message and will review it shortly.\n\n` +
        `Submitted Information:\n` +
        `Name: ${fullName}\n` +
        `Firm Name: ${firmName}\n` +
        `Jurisdiction: ${jurisdiction || "(not provided)"}\n` +
        `Email: ${email}\n` +
        `Phone: ${phone || "(not provided)"}\n` +
        `Practice Areas: ${practiceAreasText}\n\n` +
        `NOTICE: Submission of this form does not create an attorney-client relationship.\n` +
        `Do not include confidential, privileged, or time-sensitive information in this form.\n\n` +
        `— Legal Client Intake\n` +
        `${replyToInbox}\n`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111827;">
          <p>Hi ${escapeHtml(firstName)},</p>

          <p>
            Thank you for contacting <strong>Legal Client Intake</strong>.
            We received your message and will review it shortly.
          </p>

          <div style="margin:18px 0;padding:14px;border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;">
            <div style="margin-bottom:4px;"><strong>Name:</strong> ${safeFullName}</div>
            <div style="margin-bottom:4px;"><strong>Firm Name:</strong> ${safeFirmName}</div>
            <div style="margin-bottom:4px;"><strong>Jurisdiction:</strong> ${safeJurisdiction}</div>
            <div style="margin-bottom:4px;"><strong>Email:</strong> ${safeEmail}</div>
            <div style="margin-bottom:4px;"><strong>Phone:</strong> ${safePhone}</div>
            <div><strong>Practice Areas:</strong> ${safePracticeAreas}</div>
          </div>

          <p style="font-size:13px;color:#4b5563;">
            <strong>NOTICE:</strong> Submission of this form does not create an attorney-client relationship.
            Do not include confidential, privileged, or time-sensitive information in this form.
          </p>

          <p style="margin-top:18px;">
            — Legal Client Intake<br />
            <a href="mailto:${escapeHtml(replyToInbox)}">${escapeHtml(replyToInbox)}</a>
          </p>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0;" />

          <p style="font-size:12px;color:#6b7280;margin:0;">
            This is an automated confirmation. If you need to add details, reply to this email.
          </p>
        </div>
      `,
      replyTo: replyToInbox,
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("CONTACT_ROUTE_ERROR", err);
    return Response.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
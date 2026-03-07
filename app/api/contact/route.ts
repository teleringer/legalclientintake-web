import nodemailer from "nodemailer";

export const runtime = "nodejs";

type ContactPayload = {
  firstName: string;
  lastName: string;
  firmName?: string;
  attorneyCount?: string;
  requestTypes?: string[];
  address?: string;
  city?: string;
  county?: string;
  state?: string;
  zip?: string;
  email: string;
  website?: string;
  mobilePhone?: string;
  officePhone?: string;
  officeFax?: string;
  intakeMethod?: string;
  practiceAreas?: string[];
  message?: string;
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

function emailShell({
  title,
  eyebrow,
  body,
}: {
  title: string;
  eyebrow?: string;
  body: string;
}) {
  return `
    <div style="margin:0;padding:12px;background:#f3f7f7;">
      <div style="max-width:680px;width:100%;margin:0 auto;background:#ffffff;border:1px solid #dbe7e7;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,.08);">
        <div style="background:linear-gradient(180deg,#0f766e,#0b5f59);padding:16px 18px;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:rgba(255,255,255,.82);margin:0 0 8px 0;">
            ${eyebrow ? escapeHtml(eyebrow) : "Legal Client Intake"}
          </div>
          <div style="margin:0;">
            <img
              src="https://legalclientintake.com/images/logo-LCI-light2.png"
              alt="Legal Client Intake"
              style="height:44px;max-width:100%;width:auto;display:block;"
            />
          </div>
          <div style="width:72px;height:3px;background:#f6d44b;border-radius:999px;margin-top:14px;"></div>
        </div>

        <div style="padding:18px 16px;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:28px;line-height:1.2;font-weight:700;color:#0f172a;margin:0 0 18px 0;">
            ${escapeHtml(title)}
          </div>

          ${body}
        </div>
      </div>
    </div>
  `;
}

function displayOrFallback(value?: string) {
  const v = String(value || "").trim();
  return v || "(not provided)";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<ContactPayload>;

    if (body.company && String(body.company).trim().length > 0) {
      return Response.json({ ok: true });
    }

    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const firmName = String(body.firmName ?? "").trim();
    const attorneyCount = String(body.attorneyCount ?? "").trim();
    const email = String(body.email ?? "").trim();
    const address = String(body.address ?? "").trim();
    const city = String(body.city ?? "").trim();
    const county = String(body.county ?? "").trim();
    const state = String(body.state ?? "").trim();
    const zip = String(body.zip ?? "").trim();
    const website = String(body.website ?? "").trim();
    const mobilePhone = String(body.mobilePhone ?? "").trim();
    const officePhone = String(body.officePhone ?? "").trim();
    const officeFax = String(body.officeFax ?? "").trim();
    const intakeMethod = String(body.intakeMethod ?? "").trim();
    const message = String(body.message ?? "").trim();
    const turnstileToken = String(body.turnstileToken ?? "").trim();

    const requestTypes = Array.isArray(body.requestTypes)
      ? body.requestTypes.map((item) => String(item).trim()).filter(Boolean)
      : [];

    const practiceAreas = Array.isArray(body.practiceAreas)
      ? body.practiceAreas.map((item) => String(item).trim()).filter(Boolean)
      : [];

    if (!firstName || !lastName || !firmName || !attorneyCount || !email || !officePhone || !intakeMethod) {
      return Response.json({ ok: false, error: "MISSING_FIELDS" }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return Response.json({ ok: false, error: "INVALID_EMAIL" }, { status: 400 });
    }

    const mobilePhoneDigits = normalizePhone(mobilePhone);
    const officePhoneDigits = normalizePhone(officePhone);
    const officeFaxDigits = normalizePhone(officeFax);

    if (mobilePhone && mobilePhoneDigits.length !== 10) {
      return Response.json({ ok: false, error: "INVALID_MOBILE_PHONE" }, { status: 400 });
    }

    if (!officePhone || officePhoneDigits.length !== 10) {
      return Response.json({ ok: false, error: "INVALID_OFFICE_PHONE" }, { status: 400 });
    }

    if (officeFax && officeFaxDigits.length !== 10) {
      return Response.json({ ok: false, error: "INVALID_OFFICE_FAX" }, { status: 400 });
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
    const requestTypesText = requestTypes.length > 0 ? requestTypes.join(", ") : "(not provided)";
    const submittedAt = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
    });
    const currentYear = new Date().getFullYear();

    const safeFullName = escapeHtml(fullName);
    const safeFirmName = escapeHtml(displayOrFallback(firmName));
    const safeAttorneyCount = escapeHtml(displayOrFallback(attorneyCount));
    const safeRequestTypes = escapeHtml(requestTypesText);
    const safeAddress = escapeHtml(displayOrFallback(address));
    const safeCity = escapeHtml(displayOrFallback(city));
    const safeCounty = escapeHtml(displayOrFallback(county));
    const safeState = escapeHtml(displayOrFallback(state));
    const safeZip = escapeHtml(displayOrFallback(zip));
    const safeEmail = escapeHtml(email);
    const safeWebsite = escapeHtml(displayOrFallback(website));
    const safeMobilePhone = escapeHtml(displayOrFallback(mobilePhone));
    const safeOfficePhone = escapeHtml(displayOrFallback(officePhone));
    const safeOfficeFax = escapeHtml(displayOrFallback(officeFax));
    const safeIntakeMethod = escapeHtml(displayOrFallback(intakeMethod));
    const safePracticeAreas = escapeHtml(practiceAreasText);
    const safeSubmittedAt = escapeHtml(submittedAt);
    const safeMessage = escapeHtml(displayOrFallback(message)).replace(/\n/g, "<br />");
    const safeReplyToInbox = escapeHtml(replyToInbox);
    const safeFirstName = escapeHtml(firstName);

    const adminHtml = emailShell({
      title: "New contact submission",
      eyebrow: "Website Lead Notification",
      body: `
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;margin:0 0 18px 0;">
          A new inquiry was submitted through the Legal Client Intake website.
        </div>

        <div style="border:1px solid #dbe7e7;border-radius:14px;padding:12px;background:#f8fbfb;margin-bottom:18px;">
  <table cellpadding="0" cellspacing="0" style="width:100%;table-layout:fixed;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#0f172a;">
    <tr>
      <td style="padding:6px 10px 6px 0;font-weight:700;vertical-align:top;width:34%;">Name:</td>
      <td style="padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeFullName}</td>
    </tr>
    <tr>
      <td style="padding:6px 10px 6px 0;font-weight:700;vertical-align:top;">Request:</td>
      <td style="padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeRequestTypes}</td>
    </tr>
    <tr>
      <td style="padding:6px 10px 6px 0;font-weight:700;vertical-align:top;">Firm Name:</td>
      <td style="padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeFirmName}</td>
    </tr>
    <tr>
      <td style="padding:6px 10px 6px 0;font-weight:700;vertical-align:top;"># of Attys:</td>
      <td style="padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeAttorneyCount}</td>
    </tr>
    <tr>
      <td style="padding:6px 10px 6px 0;font-weight:700;vertical-align:top;">Address:</td>
      <td style="padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeAddress}</td>
    </tr>
    <tr>
      <td style="padding:6px 10px 6px 0;font-weight:700;vertical-align:top;">City:</td>
      <td style="padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeCity}</td>
    </tr>
    <tr>
      <td style="padding:6px 10px 6px 0;font-weight:700;vertical-align:top;">County:</td>
      <td style="padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeCounty}</td>
    </tr>
    <tr>
      <td style="padding:6px 10px 6px 0;font-weight:700;vertical-align:top;">State:</td>
      <td style="padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeState}</td>
    </tr>
    <tr>
      <td style="padding:6px 10px 6px 0;font-weight:700;vertical-align:top;">Zip:</td>
      <td style="padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeZip}</td>
    </tr>
    <tr>
      <td style="padding:6px 10px 6px 0;font-weight:700;vertical-align:top;">Email:</td>
      <td style="padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">
        <a href="mailto:${safeEmail}" style="color:#0f766e;text-decoration:none;word-break:break-word;overflow-wrap:anywhere;">
          ${safeEmail}
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding:6px 10px 6px 0;font-weight:700;vertical-align:top;">Website:</td>
      <td style="padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">
        ${website ? `<a href="${escapeHtml(website)}" style="color:#2563eb;text-decoration:none;word-break:break-word;overflow-wrap:anywhere;">${safeWebsite}</a>` : safeWebsite}
      </td>
    </tr>
    <tr>
      <td style="padding:6px 10px 6px 0;font-weight:700;vertical-align:top;">Mobile #:</td>
      <td style="padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeMobilePhone}</td>
    </tr>
    <tr>
      <td style="padding:6px 10px 6px 0;font-weight:700;vertical-align:top;">Office Phone:</td>
      <td style="padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeOfficePhone}</td>
    </tr>
    <tr>
      <td style="padding:6px 10px 6px 0;font-weight:700;vertical-align:top;">Office Fax:</td>
      <td style="padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeOfficeFax}</td>
    </tr>
    <tr>
      <td style="padding:6px 10px 6px 0;font-weight:700;vertical-align:top;">Current Intake:</td>
      <td style="padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeIntakeMethod}</td>
    </tr>
    <tr>
      <td style="padding:6px 10px 6px 0;font-weight:700;vertical-align:top;">Practice Areas:</td>
      <td style="padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safePracticeAreas}</td>
    </tr>
    <tr>
      <td style="padding:6px 10px 6px 0;font-weight:700;vertical-align:top;">Submitted:</td>
      <td style="padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeSubmittedAt}</td>
    </tr>
  </table>
</div>

        <div style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;color:#0f172a;margin:0 0 8px 0;">
          Message
        </div>

        <div style="border:1px solid #dbe7e7;border-radius:14px;padding:16px 18px;background:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#0f172a;">
          ${safeMessage}
        </div>

        <div style="margin-top:22px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;font-family:Arial,Helvetica,sans-serif;">
          <div style="margin-bottom:16px;">
            <a href="https://legalclientintake.com"
               target="_blank"
               style="display:inline-block;margin:6px 6px;padding:10px 18px;background:#0f766e;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
               Home
            </a>

            <a href="https://app.legalclientintake.com"
               target="_blank"
               style="display:inline-block;margin:6px 6px;padding:10px 18px;background:#0f766e;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
               Client Login
            </a>
          </div>

          <div style="font-size:12px;color:#64748b;margin-bottom:14px;">
            Copyright ©${currentYear}. Legal Client Intake owned & operated by Teleringer LLC. All rights reserved.
          </div>

          <div style="height:1px;background:#e5e7eb;margin:12px 0;"></div>

          <div style="font-size:11px;color:#64748b;line-height:1.6;margin-bottom:12px;">
            <strong>NOTICE:</strong> Submission of this form does not create an attorney-client relationship.
            Do not treat website submissions as confidential or time-sensitive without direct follow-up.
          </div>

          <div style="height:1px;background:#e5e7eb;margin:12px 0;"></div>

          <div style="font-size:11px;color:#94a3b8;">
            LegalClientIntake.com • AI Receptionist for Law Firms
          </div>
        </div>
      `,
    });

    const confirmationHtml = emailShell({
      title: "We received your message",
      eyebrow: "Confirmation",
      body: `
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7;color:#0f172a;margin:0 0 14px 0;">
          Hi ${safeFirstName},
        </div>

        <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#334155;margin:0 0 18px 0;">
          Thank you for contacting <strong>Legal Client Intake</strong>. We received your message and will review it shortly.
        </div>

        <div style="border:1px solid #dbe7e7;border-radius:14px;padding:12px;background:#f8fbfb;margin-bottom:18px;">
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:700;color:#0f172a;margin:0 0 10px 0;">
    Submitted Information
  </div>

  <table cellpadding="0" cellspacing="0" style="width:100%;table-layout:fixed;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#0f172a;">
    <tr>
      <td style="padding:5px 10px 5px 0;font-weight:700;vertical-align:top;width:34%;">Name:</td>
      <td style="padding:5px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeFullName}</td>
    </tr>
    <tr>
      <td style="padding:5px 10px 5px 0;font-weight:700;vertical-align:top;">Request:</td>
      <td style="padding:5px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeRequestTypes}</td>
    </tr>
    <tr>
      <td style="padding:5px 10px 5px 0;font-weight:700;vertical-align:top;">Firm Name:</td>
      <td style="padding:5px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeFirmName}</td>
    </tr>
    <tr>
      <td style="padding:5px 10px 5px 0;font-weight:700;vertical-align:top;"># of Attys:</td>
      <td style="padding:5px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeAttorneyCount}</td>
    </tr>
    <tr>
      <td style="padding:5px 10px 5px 0;font-weight:700;vertical-align:top;">Address:</td>
      <td style="padding:5px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeAddress}</td>
    </tr>
    <tr>
      <td style="padding:5px 10px 5px 0;font-weight:700;vertical-align:top;">City:</td>
      <td style="padding:5px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeCity}</td>
    </tr>
    <tr>
      <td style="padding:5px 10px 5px 0;font-weight:700;vertical-align:top;">County:</td>
      <td style="padding:5px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeCounty}</td>
    </tr>
    <tr>
      <td style="padding:5px 10px 5px 0;font-weight:700;vertical-align:top;">State:</td>
      <td style="padding:5px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeState}</td>
    </tr>
    <tr>
      <td style="padding:5px 10px 5px 0;font-weight:700;vertical-align:top;">Zip:</td>
      <td style="padding:5px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeZip}</td>
    </tr>
    <tr>
      <td style="padding:5px 10px 5px 0;font-weight:700;vertical-align:top;">Email:</td>
      <td style="padding:5px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">
        <a href="mailto:${safeEmail}" style="color:#0f766e;text-decoration:none;word-break:break-word;overflow-wrap:anywhere;">
          ${safeEmail}
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding:5px 10px 5px 0;font-weight:700;vertical-align:top;">Website:</td>
      <td style="padding:5px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">
        ${website ? `<a href="${escapeHtml(website)}" style="color:#2563eb;text-decoration:none;word-break:break-word;overflow-wrap:anywhere;">${safeWebsite}</a>` : safeWebsite}
      </td>
    </tr>
    <tr>
      <td style="padding:5px 10px 5px 0;font-weight:700;vertical-align:top;">Mobile #:</td>
      <td style="padding:5px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeMobilePhone}</td>
    </tr>
    <tr>
      <td style="padding:5px 10px 5px 0;font-weight:700;vertical-align:top;">Office Phone:</td>
      <td style="padding:5px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeOfficePhone}</td>
    </tr>
    <tr>
      <td style="padding:5px 10px 5px 0;font-weight:700;vertical-align:top;">Office Fax:</td>
      <td style="padding:5px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeOfficeFax}</td>
    </tr>
    <tr>
      <td style="padding:5px 10px 5px 0;font-weight:700;vertical-align:top;">Current Intake:</td>
      <td style="padding:5px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeIntakeMethod}</td>
    </tr>
    <tr>
      <td style="padding:5px 10px 5px 0;font-weight:700;vertical-align:top;">Practice Areas:</td>
      <td style="padding:5px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safePracticeAreas}</td>
    </tr>
    <tr>
      <td style="padding:5px 10px 5px 0;font-weight:700;vertical-align:top;">Message:</td>
      <td style="padding:5px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${safeMessage}</td>
    </tr>
  </table>
</div>

        <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#0f172a;">
          <b>Best Regards,<br />
          Legal Client Intake Team<br /></b>
          <a href="https://legalclientintake.com">www.legalclientintake.com</a><br />
          <a href="mailto:${safeReplyToInbox}" style="color:#0f766e;text-decoration:none;">${safeReplyToInbox}</a>
        </div>

        <div style="margin-top:22px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;font-family:Arial,Helvetica,sans-serif;">
          <div style="margin-bottom:16px;">
            <a href="https://legalclientintake.com"
               target="_blank"
               style="display:inline-block;margin:6px 6px;padding:10px 18px;background:#0f766e;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
               Home
            </a>

            <a href="https://app.legalclientintake.com"
               target="_blank"
               style="display:inline-block;margin:6px 6px;padding:10px 18px;background:#0f766e;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
               Client Login
            </a>
          </div>

          <div style="font-size:12px;color:#64748b;margin-bottom:10px;">
            Copyright ©${currentYear}. Legal Client Intake owned & operated by Teleringer LLC. All rights reserved.
          </div>

          <div style="height:1px;background:#e5e7eb;margin:12px 0;"></div>

          <div style="font-size:11px;color:#64748b;line-height:1.6;margin-bottom:10px;">
            <strong>NOTICE:</strong> Submission of this form does not create an attorney-client relationship.
            Do not include confidential, privileged, or time-sensitive information in this form.
          </div>

          <div style="height:1px;background:#e5e7eb;margin:12px 0;"></div>

          <div style="font-size:11px;color:#64748b;line-height:1.6;">
            This is an automated confirmation. If you need to add details, reply to this email.
          </div>
        </div>
      `,
    });

    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: adminTo,
      subject: `New LegalClientIntake inquiry: ${fullName}`,
      text:
        `New LegalClientIntake contact submission\n\n` +
        `Name: ${fullName}\n` +
        `Request Type: ${requestTypesText}\n` +
        `Firm Name: ${displayOrFallback(firmName)}\n` +
        `Number of Attorneys: ${displayOrFallback(attorneyCount)}\n` +
        `Address: ${displayOrFallback(address)}\n` +
        `City: ${displayOrFallback(city)}\n` +
        `County: ${displayOrFallback(county)}\n` +
        `State: ${displayOrFallback(state)}\n` +
        `Zip: ${displayOrFallback(zip)}\n` +
        `Email: ${email}\n` +
        `Website: ${displayOrFallback(website)}\n` +
        `Mobile #: ${displayOrFallback(mobilePhone)}\n` +
        `Office Phone: ${displayOrFallback(officePhone)}\n` +
        `Office Fax: ${displayOrFallback(officeFax)}\n` +
        `Current After-hours Intake Method: ${displayOrFallback(intakeMethod)}\n` +
        `Practice Areas: ${practiceAreasText}\n` +
        `Submitted: ${submittedAt}\n\n` +
        `Message:\n${displayOrFallback(message)}\n`,
      html: adminHtml,
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
        `Request Type: ${requestTypesText}\n` +
        `Firm Name: ${displayOrFallback(firmName)}\n` +
        `Number of Attorneys: ${displayOrFallback(attorneyCount)}\n` +
        `Address: ${displayOrFallback(address)}\n` +
        `City: ${displayOrFallback(city)}\n` +
        `County: ${displayOrFallback(county)}\n` +
        `State: ${displayOrFallback(state)}\n` +
        `Zip: ${displayOrFallback(zip)}\n` +
        `Email: ${email}\n` +
        `Website: ${displayOrFallback(website)}\n` +
        `Mobile #: ${displayOrFallback(mobilePhone)}\n` +
        `Office Phone: ${displayOrFallback(officePhone)}\n` +
        `Office Fax: ${displayOrFallback(officeFax)}\n` +
        `Current After-hours Intake Method: ${displayOrFallback(intakeMethod)}\n` +
        `Practice Areas: ${practiceAreasText}\n` +
        `Message: ${displayOrFallback(message)}\n\n` +
        `NOTICE: Submission of this form does not create an attorney-client relationship.\n` +
        `Do not include confidential, privileged, or time-sensitive information in this form.\n\n` +
        `— Legal Client Intake\n` +
        `${replyToInbox}\n`,
      html: confirmationHtml,
      replyTo: replyToInbox,
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("CONTACT_ROUTE_ERROR", err);
    return Response.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
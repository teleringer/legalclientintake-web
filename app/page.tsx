"use client";

import Turnstile from "react-turnstile";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { IMaskInput } from "react-imask";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

const US_STATES = [
  { value: "", label: "Select State" },
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
];

type BillingState = "monthly" | "annual";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showToTop, setShowToTop] = useState(false);
  const [billing, setBilling] = useState<BillingState>("monthly");
  const year = new Date().getFullYear();
  const [activeSection, setActiveSection] = useState<"top" | "how" | "plans" | "info">("top");

  const [msg, setMsg] = useState("");
  const msgCount = msg.length;

  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileRenderKey, setTurnstileRenderKey] = useState(0);

  const [formStatus, setFormStatus] = useState<{
    type: "idle" | "ok" | "err" | "sending";
    text: string;
  }>({ type: "idle", text: "" });

  const [submitText, setSubmitText] = useState("Submit Request");
  const [submitDisabled, setSubmitDisabled] = useState(false);

  const prices = useMemo(
    () => ({
      core: { monthly: "$297", annual: "$272.25", mins: "200 / mo" },
      pro: { monthly: "$397", annual: "$330.83", mins: "400 / mo" },
      elite: { monthly: "$597", annual: "$447.75", mins: "600 / mo" },
    }),
    []
  );

  const isAnnual = billing === "annual";
  const HEADER_OFFSET = 110;

  const scrollToId = (id: "top" | "how" | "plans" | "info") => {
  const runScroll = () => {
    if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setActiveSection("top");
      return;
    }

    const scrollToIdFromMobileMenu = (id: "how" | "plans" | "info") => {
  setMobileMenuOpen(false);

  window.setTimeout(() => {
    scrollToId(id);
  }, 180);
};
    const target =
      document.getElementById(id) ||
      (id === "info" ? document.getElementById("contactForm") : null);

    if (!target) return;

    const topbar = document.getElementById("topbar");
    const headerHeight = Math.ceil(topbar?.getBoundingClientRect().height || HEADER_OFFSET);

    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    window.setTimeout(() => {
      window.scrollBy({
        top: -(headerHeight + 12),
        behavior: "smooth",
      });
    }, 60);

    setActiveSection(id);
  };

  if (mobileMenuOpen) {
    setMobileMenuOpen(false);
    window.setTimeout(runScroll, 120);
  } else {
    runScroll();
  }
};

const scrollToIdFromMobileMenu = (id: "how" | "plans" | "info") => {
  setMobileMenuOpen(false);

  window.setTimeout(() => {
    scrollToId(id);
  }, 180);
};

  useEffect(() => {
    const sections = ["how", "plans", "info"] as const;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const id = entry.target.id;
          if (id === "how" || id === "plans" || id === "info") {
            setActiveSection(id);
          }
        });
      },
      {
        root: null,
        rootMargin: "-120px 0px -60% 0px",
        threshold: 0,
      }
    );

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY < 120) {
        setActiveSection("top");
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const topbar = document.getElementById("topbar");

    const onScroll = () => {
      const y = window.scrollY || 0;
      setShowToTop(y > 400);
      if (topbar) topbar.classList.toggle("scrolled", y > 8);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function submitContact(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!TURNSTILE_SITE_KEY) {
      setFormStatus({
        type: "err",
        text: "Turnstile is not configured yet (missing NEXT_PUBLIC_TURNSTILE_SITE_KEY).",
      });
      return;
    }

    if (!turnstileToken) {
      setFormStatus({ type: "err", text: "Please complete the anti-spam check and try again." });
      return;
    }

    const form = e.currentTarget;
    const fd = new FormData(form);

    const firstName = String(fd.get("firstName") || "").trim();
    const lastName = String(fd.get("lastName") || "").trim();
    const firmName = String(fd.get("firmName") || "").trim();
    const attorneyCount = String(fd.get("attorneyCount") || "").trim();
    const address = String(fd.get("address") || "").trim();
    const city = String(fd.get("city") || "").trim();
    const county = String(fd.get("county") || "").trim();
    const state = String(fd.get("state") || "").trim();
    const zip = String(fd.get("zip") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const website = String(fd.get("website") || "").trim();
    const mobilePhone = String(fd.get("mobilePhone") || "").trim();
    const officePhone = String(fd.get("officePhone") || "").trim();
    const officeFax = String(fd.get("officeFax") || "").trim();
    const intakeMethod = String(fd.get("intakeMethod") || "").trim();
    const message = String(fd.get("message") || "").trim();

    const requestTypes = fd
      .getAll("requestTypes")
      .map((value) => String(value).trim())
      .filter(Boolean);

    const otherPractices = fd
      .getAll("otherPractice")
      .map((value) => String(value).trim())
      .filter(Boolean);

    const practiceAreas = fd
      .getAll("practiceAreas")
      .map((value) => String(value).trim())
      .filter(Boolean);

    const finalPracticeAreas = [
      ...practiceAreas,
      ...otherPractices.map((item) => `Other: ${item}`),
    ];

    setFormStatus({ type: "sending", text: "Sending…" });
    setSubmitDisabled(true);
    setSubmitText("Sending…");

    const payload = {
      firstName,
      lastName,
      firmName,
      attorneyCount,
      requestTypes,
      address,
      city,
      county,
      state,
      zip,
      email,
      website,
      mobilePhone,
      officePhone,
      officeFax,
      intakeMethod,
      practiceAreas: finalPracticeAreas,
      turnstileToken,
      message,
      company: "",
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorCode = data?.error || "UNKNOWN_ERROR";
        throw new Error(errorCode);
      }

      setFormStatus({
        type: "ok",
        text: "Success! Your request was sent. Please check your email for confirmation.",
      });

      setSubmitText("Sent");
      form.reset();
      setMsg("");
      setTurnstileToken("");
      setTurnstileRenderKey((k) => k + 1);

      setTimeout(() => {
        setSubmitText("Submit Request");
        setSubmitDisabled(false);
      }, 1600);
    } catch (err) {
      const messageText =
        err instanceof Error ? err.message : "UNKNOWN_ERROR";

      let userMessage = "Something went wrong while submitting the form.";

      switch (messageText) {
        case "MISSING_FIELDS":
          userMessage = "Please complete all required fields and try again.";
          break;
        case "INVALID_EMAIL":
          userMessage = "Please enter a valid email address.";
          break;
        case "INVALID_WEBSITE":
          userMessage = "Please enter a valid website like website.com.";
          break;
        case "INVALID_MOBILE_PHONE":
          userMessage = "Please enter a valid mobile phone number or leave it blank.";
          break;
        case "INVALID_OFFICE_PHONE":
          userMessage = "Please enter a valid office phone number.";
          break;
        case "INVALID_OFFICE_FAX":
          userMessage = "Please enter a valid office fax number or leave it blank.";
          break;
        case "TURNSTILE_MISSING":
          userMessage = "Please complete the anti-spam check and try again.";
          break;
        case "TURNSTILE_FAILED":
          userMessage = "Anti-spam verification failed. Please try again.";
          break;
        case "TURNSTILE_NOT_CONFIGURED":
          userMessage = "Turnstile is not configured on the server yet.";
          break;
        case "SERVER_NOT_CONFIGURED":
          userMessage = "The email server is not configured correctly yet.";
          break;
        case "SERVER_ERROR":
          userMessage = "Server error. Please try again in a moment.";
          break;
        default:
          userMessage = `Form error: ${messageText}`;
          break;
      }

      setFormStatus({
        type: "err",
        text: userMessage,
      });
      setSubmitText("Submit Request");
      setSubmitDisabled(false);
    }
  }

  return (
    <main>
      <style>{`
:root{
  --bg:#f6fbfb;
  --text:#0f172a;
  --muted:#475569;
  --card:#ffffff;
  --border:#e2e8f0;
  --shadow:0 18px 45px rgba(2, 8, 23, .08);
  --teal:#0f766e;
  --teal2:#0b5f59;
  --tealSoft:#e7f6f5;
  --gold:#f6d44b;
  --navy:#0b1220;
  --radius:16px;
  --max:1120px;

  --execTop:#0B1C2D;
  --execBottom:#111827;
  --execText:#F8FAFC;
  --execMuted:rgba(248,250,252,.82);
  --execGold:#d6b24a;

  --okBg: rgba(16,185,129,.12);
  --okBorder: rgba(16,185,129,.25);
  --okText: #065f46;

  --errBg: rgba(239,68,68,.12);
  --errBorder: rgba(239,68,68,.25);
  --errText: #7f1d1d;
}

*{box-sizing:border-box}
html,body{height:100%; overflow-x:hidden;}
html{scroll-behavior:smooth;}
body{
  margin:0;
  padding-top:0 !important;
  font-family: "Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji";
  color:var(--text);
  background: radial-gradient(1200px 500px at 50% 0%, #dff6f3 0%, var(--bg) 55%, #ffffff 100%);
  line-height:1.45;
  letter-spacing:-0.01em;
}
a{color:inherit}
img{max-width:100%;display:block}

.container{max-width:var(--max);margin:0 auto;padding:0 18px}
.btn{
  display:inline-flex;align-items:center;justify-content:center;
  gap:10px;
  padding:12px 16px;
  border-radius:12px;
  border:1px solid transparent;
  font-weight:800;
  text-decoration:none;
  cursor:pointer;
  transition:.15s transform, .15s box-shadow, .15s background, .15s border-color, .15s filter;
  white-space:nowrap;
  user-select:none;
  letter-spacing:-0.01em;
}
.btn:active{transform:translateY(1px)}
.btn-primary{background:var(--teal);color:#fff;box-shadow:0 12px 26px rgba(15,118,110,.18)}
.btn-primary:hover{background:var(--teal2)}
.btn-outline{background:#fff;border-color:#0f172a22;color:#0f172a}
.btn-outline:hover{border-color:#0f172a55;box-shadow:0 10px 22px rgba(2,8,23,.08)}
.btn-gold{background:var(--gold);color:#0b1220}
.btn-gold:hover{filter:brightness(.98);box-shadow:0 12px 26px rgba(246,212,75,.25)}
.btn[disabled]{opacity:.65;cursor:not-allowed;transform:none}

#contactForm{
  scroll-margin-top: calc(92px + env(safe-area-inset-top) + 12px);
}
@media (max-width: 520px){
  #contactForm{
    scroll-margin-top: calc(72px + env(safe-area-inset-top) + 12px);
  }
}

.topbar, .topbar *{ pointer-events:auto; }
.topbar{
  width:100%;
  position:sticky;
  top:0;
  left:0;
  right:0;
  z-index:9999;
  background:rgba(255,255,255,.78);
  backdrop-filter:blur(10px);
  border-bottom:1px solid rgba(226,232,240,.65);
  transition:.2s background, .2s border-color;
  padding-top:0;
}
.topbar.scrolled{
  background: rgba(11,18,32,.92);
  border-bottom: 1px solid rgba(255,255,255,.10);
}

.nav{
  display:flex;align-items:center;justify-content:space-between;
  gap:14px;
  padding:12px 0;
}
.brand{display:flex;align-items:center;gap:12px;text-decoration:none}
.brand img{
  height:66px;
  width:auto;
  max-width:220px;
  transition:.15s opacity;
}
@media (max-width: 520px){
  .brand img{ height:48px; max-width:180px; }
}

.navlinks{display:flex;align-items:center;gap:10px}

.menuBtn{
  display:none;
  width:44px;height:44px;
  border-radius:12px;
  border:1px solid rgba(15,23,42,.18);
  background:#fff;
  cursor:pointer;
  align-items:center;
  justify-content:center;
  position:relative;
  z-index:10002;
  pointer-events:auto;
  touch-action:manipulation;
  -webkit-tap-highlight-color:transparent;
}
.menuBtn span{
  display:block;
  width:18px;height:2px;
  background:#0f172a;
  position:relative;
}
.menuBtn span::before,
.menuBtn span::after{
  content:"";
  position:absolute;left:0;
  width:18px;height:2px;
  background:#0f172a;
}
.menuBtn span::before{ top:-6px; }
.menuBtn span::after{ top:6px; }

.topbar.scrolled .menuBtn{
  background: rgba(255,255,255,.08);
  border-color: rgba(255,255,255,.20);
}
.topbar.scrolled .menuBtn span,
.topbar.scrolled .menuBtn span::before,
.topbar.scrolled .menuBtn span::after{
  background:#fff;
}

.mobileMenu{
  display:none;
  padding:10px 0 14px;
}
.mobileMenu .menuPanel{
  background: rgba(255,255,255,.95);
  border:1px solid rgba(226,232,240,.9);
  border-radius:16px;
  box-shadow:0 18px 45px rgba(2,8,23,.14);
  padding:12px;
  display:grid;
  gap:10px;
}
.topbar.scrolled .mobileMenu .menuPanel{
  background: rgba(11,18,32,.96);
  border-color: rgba(255,255,255,.12);
}
.mobileMenu a{ width:100%; justify-content:center; }

@media (max-width: 820px){
  .nav{ padding:10px 0; }
  .brand img{ height:44px; max-width:180px; }
  .navlinks{ display:none; }
  .menuBtn{ display:inline-flex; }
  .mobileMenu.open{ display:block; }
}

section{
  padding:52px 0;
  position:relative;
  background:transparent;
  scroll-margin-top:110px;
}
@media (max-width: 520px){
  section{ scroll-margin-top:86px; }
}
section::before{
  content:"";
  position:absolute;
  left:0; right:0; top:0;
  height:1px;
  background: rgba(226,232,240,.65);
  opacity:.55;
}
section.alt{
  background:
    radial-gradient(1100px 520px at 50% -10%, rgba(15,118,110,.12), rgba(255,255,255,0) 62%),
    linear-gradient(180deg, rgba(15,118,110,.06), rgba(255,255,255,0) 55%);
  border-top:1px solid rgba(226,232,240,.75);
  border-bottom:1px solid rgba(226,232,240,.75);
}

.sectionTitle{font-size:36px;line-height:1.12;margin:0 0 10px;text-align:center;letter-spacing:-0.02em}
.sectionSub{margin:0 auto 28px;max-width:72ch;color:var(--muted);text-align:center}

.hero{
  padding:64px 0 34px;
  background: linear-gradient(180deg, var(--execTop), var(--execBottom));
  position:relative;
  overflow:hidden;
}
.hero::before{ display:none; }

.hero::after{
  content:"";
  position:absolute;
  top:0;
  right:0;
  width:50%;
  height:100%;
  opacity:.14;
  pointer-events:none;
  background-image:
    linear-gradient(to right, rgba(148,163,184,.35) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148,163,184,.35) 1px, transparent 1px);
  background-size:56px 56px;
  mask-image: radial-gradient(120% 80% at 70% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,.55) 55%, rgba(0,0,0,0) 100%);
}
.hero .container,
.heroGrid{
  position:relative;
  z-index:1;
}
.heroGrid{
  display:grid;
  grid-template-columns:1.15fr .85fr;
  gap:40px;
  align-items:center;
}

.heroEyebrow{
  display:inline-flex;
  align-items:center;
  gap:10px;
  padding:8px 12px;
  border-radius:999px;
  font-size:12px;
  letter-spacing:.14em;
  text-transform:uppercase;
  font-weight:900;
  background: rgba(255,255,255,.06);
  color: rgba(248,250,252,.82);
  border:1px solid rgba(255,255,255,.14);
  margin:0 0 14px;
}

.heroTitle{
  font-size:64px;
  line-height:1.03;
  letter-spacing:-0.03em;
  font-weight:900;
  color:var(--execText);
  margin:12px 0 10px;
}
.heroGoldRule{
  width:88px;
  height:2px;
  background:var(--execGold);
  border-radius:999px;
  margin:12px 0 18px;
}
.heroSub{
  color:var(--execMuted);
  font-size:18px;
  max-width:64ch;
  margin:0;
}

.heroActions{
  display:flex;
  gap:14px;
  flex-wrap:wrap;
  margin-top:26px;
}

.heroActions .btn{
  padding:14px 20px;
  font-size:15px;
  border-radius:14px;
}

.heroActions .btn-primary{
  background:var(--execGold);
  color:#0B1220;
  border:1px solid rgba(255,255,255,.10);
  box-shadow:0 18px 38px rgba(0,0,0,.32);
}

.heroActions .btn-primary:hover{
  filter:brightness(.98);
  transform:translateY(-1px);
}

.heroActions .btn-outline{
  border-color:rgba(255,255,255,.30);
  color:var(--execText);
  background:rgba(255,255,255,.06);
}

.heroActions .btn-outline:hover{
  background:rgba(255,255,255,.12);
  border-color:rgba(255,255,255,.45);
}

.heroTrustRow{
  display:flex;
  flex-wrap:wrap;
  gap:14px;
  margin-top:16px;
  color: rgba(248,250,252,.86);
  font-size:14px;
  font-weight:900;
}
.heroTrustRow span{
  display:inline-flex;
  align-items:flex-start;
  gap:10px;
  line-height:1.35;
}
.heroTrustRow i{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  width:22px;
  height:22px;
  border-radius:8px;
  background: rgba(214,178,74,.18);
  border:1px solid rgba(214,178,74,.35);
  color: rgba(255,255,255,.96);
  font-style:normal;
  font-weight:1000;
  flex:none;
  box-shadow:0 10px 22px rgba(0,0,0,.18);
  margin-top:1px;
}

.heroImageWrap{
  background:transparent;
  border:1px solid rgba(255,255,255,.10);
  box-shadow:none;
  padding:0;
  border-radius:22px;
  overflow:hidden;
}
.heroImageCard{ background:transparent; border:none; }
.heroImageCard img{
  border-radius:18px;
  border:1px solid rgba(255,255,255,.10);
  opacity:.92;
  width:100%;
  height:auto;
  display:block;
}

.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.card{
  background:var(--card);
  border:1px solid var(--border);
  border-radius:18px;
  box-shadow:0 12px 26px rgba(2,8,23,.06);
  padding:16px;
}
.card h4{margin:0 0 8px;font-size:16px;letter-spacing:-0.01em}
.card p{margin:0;color:var(--muted);font-size:14px}

.practice{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}

section.plansBand::before{ display:none; }
section.plansBand{
  background: linear-gradient(180deg, var(--execTop), var(--execBottom));
  color:var(--execText);
  position:relative;
  overflow:hidden;
  border-top:1px solid rgba(255,255,255,.10);
  border-bottom:1px solid rgba(255,255,255,.10);
}
section.plansBand::after{
  content:"";
  position:absolute;
  inset:0;
  opacity:.10;
  pointer-events:none;
  background-image:
    linear-gradient(to right, rgba(148,163,184,.35) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148,163,184,.35) 1px, transparent 1px);
  background-size:56px 56px;
  mask-image: radial-gradient(120% 80% at 50% 35%, rgba(0,0,0,1) 0%, rgba(0,0,0,.55) 55%, rgba(0,0,0,0) 100%);
}
section.plansBand .container{ position:relative; z-index:1; }
section.plansBand .sectionTitle{ color:var(--execText); }
section.plansBand .sectionSub{ color:rgba(248,250,252,.82); }

.ribbon {
  position:absolute;
  top:14px;
  right:-62px;
  width:220px;
  height:32px;
  display:flex;
  align-items:center;
  justify-content:center;
  background: linear-gradient(145deg, #f44336, #b71c1c);
  color:#fff;
  font-weight:800;
  font-size:12px;
  letter-spacing:1px;
  text-transform:uppercase;
  transform:rotate(45deg);
  transform-origin:center;
  box-shadow:0 6px 15px rgba(0,0,0,.25);
  text-shadow:0 1px 1px rgba(0,0,0,.35);
  z-index:5;
}

.billingToggleWrap{display:flex;justify-content:center;margin:10px 0 18px;}
.billingToggle{
  display:flex;align-items:center;gap:12px;
  padding:10px 12px;border-radius:999px;
  background: rgba(255,255,255,.08);
  border:1px solid rgba(255,255,255,.16);
  box-shadow:0 16px 34px rgba(0,0,0,.22);
  backdrop-filter:blur(8px);
}
.billingLabel{font-size:13px;font-weight:900;letter-spacing:.02em;color:rgba(248,250,252,.88);opacity:.85;user-select:none;white-space:nowrap;}
.billingLabel.active{opacity:1;color:rgba(248,250,252,.98);}
.switch{
  position:relative;width:64px;height:34px;border-radius:999px;
  background: rgba(214,178,74,.22);
  border:1px solid rgba(214,178,74,.45);
  box-shadow:0 16px 34px rgba(0,0,0,.28);
  cursor:pointer;flex:none;
}
.switchKnob{
  position:absolute;top:3px;left:3px;width:28px;height:28px;border-radius:999px;
  background: rgba(248,250,252,.95);
  box-shadow:0 10px 24px rgba(0,0,0,.30);
  transition:.18s transform;
}
.switch.on .switchKnob{transform: translateX(30px);}

.plansGrid{
  display:grid;
  grid-template-columns:repeat(3, 1fr);
  gap:18px;
  align-items:stretch;
  margin-top:14px;
}
.planCard{
  background: rgba(255,255,255,.96);
  color:var(--text);
  border:1px solid rgba(255,255,255,.18);
  border-radius:22px;
  box-shadow:0 18px 45px rgba(0,0,0,.30);
  padding:18px;
  position:relative;
  overflow:hidden;
  display:flex;
  flex-direction:column;
  min-height:660px;
}
.planTop{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px;}
.planName{font-size:18px;font-weight:900;margin:0;letter-spacing:-0.02em;}
.planTag{font-size:13px;font-weight:800;color:rgba(71,85,105,.92);margin-top:2px;}
.planPrice{font-size:44px;font-weight:1000;letter-spacing:-0.03em;margin:10px 0 10px;line-height:1.0;}
.planPrice small{font-size:14px;font-weight:900;color:rgba(71,85,105,.92);margin-left:6px;}
.priceSub{margin-top:-2px;font-size:13px;color:rgba(71,85,105,.92);font-weight:900;}

.planMeta{
  background: rgba(15,118,110,.06);
  border:1px solid rgba(15,118,110,.14);
  border-radius:16px;
  padding:12px;
  display:grid;
  gap:8px;
  margin:10px 0 14px;
  font-weight:800;
  color:rgba(15,23,42,.88);
}
.planMetaRow{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:14px;}
.planMetaRow b{font-weight:1000;}

.planList{list-style:none;padding:0;margin:0 0 10px;display:grid;gap:12px;color:rgba(15,23,42,.88);font-weight:800;font-size:14px;}
.planList li{display:flex;align-items:flex-start;gap:10px;}
.tickDot{
  flex:none;width:22px;height:22px;border-radius:8px;display:flex;align-items:center;justify-content:center;
  background: rgba(15,118,110,.10);
  border:1px solid rgba(15,118,110,.22);
  color: rgba(15,118,110,.95);
  font-weight:1000;font-size:13px;margin-top:2px;
}
.planList li span:not(.tickDot){flex:1;}
.planCard.pro .tickDot{
  background: rgba(214,178,74,.16);
  border-color: rgba(214,178,74,.45);
  color: rgba(140,104,14,.95);
}
.planBottom{margin-top:auto;padding-top:12px;}
.planCta{display:flex;justify-content:center;margin-bottom:10px;}
.planCta .btn{width:100%;max-width:340px;padding:14px 16px;border-radius:14px;}
.planCard.pro .btn-primary{background:var(--teal);box-shadow:0 18px 38px rgba(15,118,110,.26);}
.planFoot{font-size:13px;color:rgba(71,85,105,.90);font-weight:800;}
.plansNote{margin-top:18px;text-align:center;color:rgba(248,250,252,.78);font-size:13px;font-weight:800;}

section.ctaBand::before{ display:none; }
section.ctaBand{
  background: linear-gradient(180deg, rgba(15,118,110,.95), rgba(15,118,110,.88));
  color:#fff;
  border-top:1px solid rgba(255,255,255,.12);
  border-bottom:1px solid rgba(255,255,255,.12);
}
.ctaBand .sectionTitle{color:#fff}
.ctaBand .sectionSub{color:rgba(255,255,255,.86)}

.formIntroGrid{
  max-width:1040px;
  margin:18px auto 14px;
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(260px,320px));
  gap:18px;
  justify-content:center;
}
.infoCard{
  border-radius:18px;
  border:1px solid rgba(255,255,255,.18);
  background: rgba(255,255,255,.08);
  box-shadow:0 18px 45px rgba(2,8,23,.20);
  padding:16px;
  min-width:0;
}
.infoCardTitle{
  margin:0;
  font-size:16px;
  font-weight:1000;
  letter-spacing:-.02em;
}
.infoCardP{
  margin:8px 0 0;
  color: rgba(255,255,255,.86);
  font-weight:700;
  font-size:14px;
  line-height:1.5;
}
.infoList{
  margin:10px 0 0;
  padding:0;
  list-style:none;
  display:grid;
  gap:10px;
  color: rgba(255,255,255,.88);
  font-weight:800;
  font-size:14px;
}
.infoList li{
  display:flex;
  gap:10px;
  align-items:flex-start;
  line-height:1.35;
}
.infoList i{
  width:22px;height:22px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;
  background: rgba(214,178,74,.18);
  border:1px solid rgba(214,178,74,.35);
  color:#fff;
  font-style:normal;
  font-weight:1000;
  flex:none;
  margin-top:1px;
}

.formWrap{
  max-width:1040px;
  margin:0 auto;
  width:100%;
}

.formCard{
  background:rgba(255,255,255,.98);
  color:var(--text);
  border-radius:20px;
  border:1px solid rgba(255,255,255,.42);
  box-shadow:0 22px 55px rgba(2,8,23,.22);
  padding:24px;
  max-width:900px;
  margin:40px auto;
  min-width:0;
  overflow:hidden;
}

.formCard > div{
  margin-bottom:18px;
}

.row2 > div,
.rowFirm > div,
.rowAddr2 > div,
.rowEmail > div{
  min-width:0;
}

input,select,textarea{
  width:100%;
  padding:12px 12px;
  border-radius:12px;
  border:1px solid #cfd8e3;
  font:inherit;
  outline:none;
  background:#fff;
  transition:border-color .15s ease, box-shadow .15s ease, background .15s ease;
}

.turnstileWrap{
  width:100%;
  max-width:100%;
  overflow:hidden;
  padding-bottom:2px;
  margin-top:10px;
}

.turnstileInner{
  width:fit-content;
  margin:0 auto;
  transform-origin:top center;
}

@media (max-width: 520px){
  .turnstileInner{
    transform:scale(0.88);
  }
}

form{display:grid;gap:12px}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.rowFirm{display:grid;grid-template-columns:3fr 1fr;gap:12px}
.rowAddr2{display:grid;grid-template-columns:1.3fr .7fr .6fr;gap:12px}
.rowEmail{display:grid;grid-template-columns:1fr 1fr;gap:12px}

.narrowPhonesWrap{
  display:flex;
  justify-content:center;
}
.narrowPhones{
  width:100%;
  max-width:720px;
  display:grid;
  grid-template-columns:repeat(3, minmax(150px, 1fr));
  gap:18px;
}

label{font-size:12px;font-weight:1000;color:#0f172a}
input,select,textarea{
  width:100%;
  padding:12px 12px;
  border-radius:12px;
  border:1px solid var(--border);
  font:inherit;
  outline:none;
  background:#fff;
}
input:focus,select:focus,textarea:focus{
  border-color:rgba(15,118,110,.70);
  box-shadow:0 0 0 4px rgba(15,118,110,.12);
  background:#fcffff;
}
textarea{min-height:110px;resize:vertical}
.small{font-size:12px;color:var(--muted);font-weight:700}
.agree{display:flex;gap:10px;align-items:flex-start}
.agree input{width:18px;height:18px;margin-top:3px}
.formActions{display:flex;justify-content:center;margin-top:6px}

.intentFieldset{
  border:0;
  padding:0;
  margin:0 0 4px 0;
}
.intentLegend{
  font-size:12px;
  font-weight:1000;
  color:#0f172a;
  margin-bottom:10px;
  text-align:center;
}
.intentGrid{
  display:flex;
  justify-content:center;
  align-items:center;
  gap:18px;
  flex-wrap:nowrap;
}
.intentBox{
  position:relative;
  width:170px;
  flex:0 0 170px;
  max-width:170px;
}
.intentBox input{
  position:absolute;
  inset:0;
  opacity:0;
  cursor:pointer;
}
.intentCard{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:10px;
  border:1px solid rgba(11,95,89,.28);
  border-radius:999px;
  padding:14px 18px;
  background: linear-gradient(180deg, #0f766e, #0b5f59);
  color:#fff;
  transition:.15s border-color, .15s box-shadow, .15s background, .15s transform, .15s filter;
  min-height:54px;
  text-align:center;
  box-shadow:0 10px 24px rgba(15,118,110,.16);
}
.intentCard::before{
  content:"";
  width:18px;
  height:18px;
  border-radius:999px;
  border:2px solid rgba(255,255,255,.78);
  background:transparent;
  flex:none;
  box-sizing:border-box;
}
.intentText{
  font-size:14px;
  font-weight:900;
  color:#fff;
  letter-spacing:-0.01em;
  line-height:1.1;
  white-space:nowrap;
}
.intentBox input:checked + .intentCard{
  background: linear-gradient(180deg, #0b5f59, #084b46);
  border-color:#084b46;
  box-shadow:0 0 0 4px rgba(15,118,110,.14), 0 12px 26px rgba(11,95,89,.22);
  transform:translateY(-1px);
}
.intentBox input:checked + .intentCard::before{
  background:#fff;
  border-color:#fff;
  box-shadow: inset 0 0 0 4px #0f766e;
}
.intentBox input:focus-visible + .intentCard{
  box-shadow:0 0 0 4px rgba(15,118,110,.14), 0 12px 26px rgba(11,95,89,.18);
}

.checkboxFieldset,
.radioFieldset{
  border:1px solid var(--border);
  border-radius:14px;
  padding:12px;
  margin:0;
  min-width:0;
}
.checkboxLegend,
.radioLegend{
  padding:0 6px;
  font-size:12px;
  font-weight:1000;
  color:#0f172a;
}

.checkboxGrid{
  display:grid;
  grid-template-columns:repeat(3, minmax(0, 1fr));
  gap:12px 14px;
  align-items:stretch;
}
.checkboxCol{
  display:flex;
  flex-direction:column;
  min-width:0;
}
.checkboxItems{
  display:grid;
  gap:7px;
}
.checkItem{
  display:flex;
  align-items:flex-start;
  gap:8px;
  font-size:12px;
  font-weight:700;
  color:#0f172a;
  line-height:1.2;
}
.checkItem input{
  width:15px;
  height:15px;
  margin:1px 0 0 0;
  flex:none;
}
.practiceOtherWrap{
  margin-top:auto;
  padding-top:10px;
}
.practiceOtherWrap input{
  font-size:12px;
  padding:10px 11px;
}

.radioGrid{
  display:grid;
  grid-template-columns:repeat(4, minmax(0, 1fr));
  gap:12px;
}
.radioItem{
  display:flex;
  align-items:flex-start;
  gap:8px;
  font-size:13px;
  font-weight:700;
  color:#0f172a;
  line-height:1.2;
}
.radioItem input{
  width:16px;
  height:16px;
  margin:1px 0 0 0;
  flex:none;
}

.notice{
  border-radius:14px;
  padding:12px 12px;
  border:1px solid rgba(226,232,240,.9);
  background: rgba(15,118,110,.05);
  color: rgba(15,23,42,.88);
  font-weight:800;
  font-size:13px;
  line-height:1.4;
}
.notice.ok{background: var(--okBg);border-color: var(--okBorder);color: var(--okText);}
.notice.err{background: var(--errBg);border-color: var(--errBorder);color: var(--errText);}

footer{
  background: radial-gradient(900px 600px at 50% 0%, rgba(255,255,255,.06), rgba(255,255,255,0) 60%),
              linear-gradient(180deg, #0b1220, #070c16);
  color:#fff;
  padding:44px 0;
}
.footerGrid{
  display:grid;
  grid-template-columns:1.3fr 1fr 1fr 1fr;
  gap:20px;
  align-items:start;
}
.footerBrand{display:flex;gap:12px;align-items:flex-start;text-decoration:none;}
.footerBrand img{height:44px;width:auto;}
.footerP{margin:10px 0 0;color:rgba(255,255,255,.80);font-size:14px;font-weight:650;max-width:52ch;}
.footerCol h5{margin:0 0 10px;font-size:14px;font-weight:1000;letter-spacing:-.01em;color: rgba(255,255,255,.92);}
.footerCol a{
  display:block;
  color:rgba(255,255,255,.76);
  text-decoration:none;
  margin:8px 0;
  font-size:14px;
  font-weight:700;
  cursor:pointer;
}
.footerCol a:hover{ color:#fff; }
.footerBottom{
  margin-top:22px;
  padding-top:18px;
  border-top:1px solid rgba(255,255,255,.12);
  display:flex;
  justify-content:space-between;
  gap:12px;
  flex-wrap:wrap;
  color:rgba(255,255,255,.72);
  font-size:13px;
  font-weight:700;
}
.footerBottom a{color:rgba(255,255,255,.85);text-decoration:none;}
.footerBottom a:hover{color:#fff}

.toTop{
  position:fixed;
  right:18px;
  bottom:18px;
  z-index:9999;
  opacity:0;
  transform:translateY(10px);
  pointer-events:none;
  transition:.15s opacity, .15s transform;
}
.toTop.show{
  opacity:1;
  transform:translateY(0);
  pointer-events:auto;
}

@media (max-width: 980px){
  .heroGrid{ grid-template-columns:1fr; gap:22px; }
  .heroTitle{ font-size:44px; }
  .hero::after{ width:100%; opacity:.10; }
  .grid3{grid-template-columns:1fr}
  .practice{grid-template-columns:1fr}
  .plansGrid{grid-template-columns:1fr}
  .planCard{ min-height:0; }
  .formIntroGrid{ grid-template-columns:1fr; }
  .row2,
  .rowFirm,
  .rowAddr2,
  .rowEmail,
  .narrowPhones,
  .radioGrid{grid-template-columns:1fr}
  .checkboxGrid{grid-template-columns:1fr}
  .footerGrid{ grid-template-columns:1fr; }
}

@media (max-width: 768px){
  .ribbon{
    top:12px;
    right:-58px;
    width:175px;
    font-size:11px;
  }
  .intentGrid{
    flex-wrap:wrap;
  }
  .intentBox{
    width:100%;
    max-width:220px;
    flex:0 1 220px;
  }
  .intentText{
    white-space:normal;
  }
}

@media (max-width: 520px){
  .toTop{ right:14px; bottom:14px; }
}
      `}</style>

      <div className="topbar" id="topbar">
        <div className="container">
          <div className="nav">
            <a className="brand" href="https://legalclientintake.com" aria-label="Legal Client Intake">
              <img id="brandLogo" src="/images/logo-LCI-dark2.png" alt="Legal Client Intake" />
            </a>

                        <div className="navlinks">
              <a
                className={`btn ${activeSection === "how" ? "btn-primary" : "btn-outline"}`}
                href="#how"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToId("how");
                }}
              >
                How it works
              </a>

              <a
                className={`btn ${activeSection === "plans" ? "btn-primary" : "btn-outline"}`}
                href="#plans"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToId("plans");
                }}
              >
                Plans
              </a>

              <a
                className={`btn ${activeSection === "info" ? "btn-primary" : "btn-outline"}`}
                href="#info"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToId("info");
                }}
              >
                Contact Us
              </a>

              <a
                className="btn btn-outline"
                href="https://app.legalclientintake.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Client Login
              </a>
            </div>

            <button
              className="menuBtn"
              id="menuBtn"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen ? "true" : "false"}
              aria-controls="mobileMenu"
              onClick={() => setMobileMenuOpen((v) => !v)}
              type="button"
            >
              <span />
            </button>
          </div>

                    <div className={`mobileMenu ${mobileMenuOpen ? "open" : ""}`} id="mobileMenu">
            <div className="menuPanel">
              <a
                className="btn btn-outline"
                href="https://legalclientintake.com"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </a>

              <a
                className={`btn ${activeSection === "how" ? "btn-primary" : "btn-outline"}`}
                href="#how"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToIdFromMobileMenu("how");
                }}
              >
                How it works
              </a>

              <a
                className={`btn ${activeSection === "plans" ? "btn-primary" : "btn-outline"}`}
                href="#plans"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToIdFromMobileMenu("plans");
                }}
              >
                Plans
              </a>

              <a
                className={`btn ${activeSection === "info" ? "btn-primary" : "btn-outline"}`}
                href="#info"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToIdFromMobileMenu("info");
                }}
              >
                Contact Us
              </a>

              <a
                className="btn btn-outline"
                href="https://app.legalclientintake.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
              >
                Client Login
              </a>
            </div>
          </div>
        </div>
      </div>

      <div id="top" className="hero">
        <div className="container">
          <div className="heroGrid">
            <div>
              <div className="heroEyebrow">AFTER-HOURS AI INTAKE FOR LAW FIRMS</div>

              <h1 className="heroTitle">
                Solo Attorneys &amp; Small Law Firms:
                <br />
                Stop Missing Potential Client Calls After Hours.
              </h1>

              <div className="heroGoldRule" aria-hidden="true" />

              <p className="heroSub">
                When your office closes, potential clients don’t stop calling. LCI captures those calls and sends you qualified intake summaries instantly.
              </p>

                            <div className="heroActions">
                <a
                  className="btn btn-primary"
                  href="#info"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToId("info");
                  }}
                >
                  Request Info
                </a>
                <a
  className="btn btn-outline"
  href="#info"
  onClick={(e) => {
    e.preventDefault();
    scrollToId("info");
  }}
>
  Send a Message
</a>
              </div>

                         <div className="heroTrustRow">
                <span>
                  <i>✓</i> Built for law firms
                </span>
                <span>
                  <i>✓</i> After-hours intake
                </span>
                <span>
                  <i>✓</i> White-glove onboarding
                </span>
              </div>
            </div>

            <div className="heroImageWrap" aria-label="Hero image">
              <div className="heroImageCard">
                <img src="/images/hero_LCI.png" alt="Legal Client Intake hero image" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <section id="how" className="alt">
        <div className="container">
          <h2 className="sectionTitle">How It Works</h2>
          <p className="sectionSub">
            A professional intake experience that captures what you need and routes the call the way your firm prefers.
          </p>

          <div className="grid3">
            <div className="card">
              <h4>1) Professional greeting</h4>
              <p>Callers speak naturally with an AI assistant designed for law firms.</p>
            </div>
            <div className="card">
              <h4>2) Structured case capture</h4>
              <p>Key details are organized into a clean intake summary you can act on quickly.</p>
            </div>
            <div className="card">
              <h4>3) Your preferred routing</h4>
              <p>Send summaries, trigger urgent alerts, and route calls based on your rules.</p>
            </div>
          </div>
        </div>
      </section>

<section className="alt">
  <div className="container">
    <h2 className="sectionTitle">Example After-Hours Call</h2>
    <p className="sectionSub">
      When someone calls your firm after hours, Legal Client Intake captures
      key details automatically and delivers a structured summary so you can
      quickly decide whether to follow up.
    </p>

    <div className="grid3">
      <div className="card">
        <h4>Caller</h4>
        <p>
          “Hi, I was in a car accident last night and I’m not sure what I should
          do. Someone told me to call a lawyer.”
        </p>
      </div>

      <div className="card">
        <h4>AI Intake Assistant</h4>
        <p>
          “I’m sorry to hear that. I can collect a few details so the attorney
          can review your situation. May I ask when the accident occurred and
          whether anyone was injured?”
        </p>
      </div>

      <div className="card">
        <h4>Attorney Receives</h4>
        <p>
          Structured intake summary delivered instantly with caller contact
          details, incident date, location, and urgency level so you can follow
          up quickly.
        </p>
      </div>
    </div>
  </div>
</section>

<section className="alt">
  <div className="container">
    <h2 className="sectionTitle">Why Law Firms Choose LCI</h2>
    <p className="sectionSub">
      Designed specifically for solo attorneys and small firms that cannot
      afford to miss potential clients after hours.
    </p>

    <div className="grid3">
      <div className="card">
        <h4>Never Miss a Potential Client</h4>
        <p>
          Instead of voicemail, callers reach a professional intake assistant
          that collects structured case information for your review.
        </p>
      </div>

      <div className="card">
        <h4>Built for Legal Workflows</h4>
        <p>
          Intake questions adapt to practice areas such as personal injury,
          criminal defense, family law, immigration, and more.
        </p>
      </div>

      <div className="card">
        <h4>Instant Intake Summaries</h4>
        <p>
          Receive organized summaries, transcripts, and recordings so you can
          quickly determine which calls deserve immediate follow-up.
        </p>
      </div>
    </div>
  </div>
</section>

<div style={{ marginTop: 32, textAlign: "center" }}>
  <h4 style={{ marginBottom: 12 }}>Sample Intake Call</h4>

  <audio controls style={{ width: "100%", maxWidth: 520 }}>
    <source src="/audio/sample-intake-call.mp3" type="audio/mpeg" />
  </audio>

  <div className="small" style={{ marginTop: 8 }}>
    Example of how Legal Client Intake interacts with a caller after hours.
  </div>
</div>

      <section>
        <div className="container">
          <h2 className="sectionTitle">Practice Area Use Cases</h2>
          <p className="sectionSub">
            Customized intake workflows for every type of legal practice:
            <br />
            multiple practice area modules are customized to your services.
          </p>

          <div className="practice">
            <div className="card">
              <h4>Personal Injury</h4>
              <p>Collect accident details, injuries, treatment, and insurance information.</p>
            </div>
            <div className="card">
              <h4>Criminal Defense</h4>
              <p>Capture charges, arrest details, court dates, and time sensitivity.</p>
            </div>
            <div className="card">
              <h4>Family Law</h4>
              <p>Handle sensitive matters with empathy while gathering essential facts.</p>
            </div>

            <div className="card">
              <h4>DUI</h4>
              <p>Document BAC questions, arrest circumstances, and immediate deadlines.</p>
            </div>
            <div className="card">
              <h4>Immigration</h4>
              <p>Collect status, timelines, supporting documents, and urgency indicators.</p>
            </div>
            <div className="card">
              <h4>Bankruptcy</h4>
              <p>Gather basic financial info, creditors, and consultation readiness.</p>
            </div>

            <div className="card">
              <h4>Civil Law</h4>
              <p>Capture the dispute details, parties involved, and key dates for fast case review.</p>
            </div>
            <div className="card">
              <h4>Real Estate Law</h4>
              <p>Collect property address, transaction stage, and urgency so your team can respond quickly.</p>
            </div>
            <div className="card">
              <h4>Business/Corporate Law</h4>
              <p>Identify business type, issue category, and timeline to prioritize high-value matters.</p>
            </div>

            <div className="card">
              <h4>Labor &amp; Employment</h4>
              <p>Capture employment details, core issue type, and timelines to assess urgency fast.</p>
            </div>
            <div className="card">
              <h4>Trusts &amp; Estates</h4>
              <p>Gather key family context, document status, and timing so consults are prepared.</p>
            </div>
            <div className="card">
              <h4>Litigation &amp; Dispute Resolution</h4>
              <p>Collect parties, dispute summary, and deadlines to triage matters with confidence.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="plans" className="plansBand">
        <div className="container">
          <h2 className="sectionTitle">Plans Built for After-Hours Intake</h2>
          <p className="sectionSub">
            Choose the plan that matches your after-hours call volume and how automated you want your intake to be.
          </p>

          <div className="billingToggleWrap">
            <div className="billingToggle" role="group" aria-label="Billing period toggle">
              <span className={`billingLabel ${!isAnnual ? "active" : ""}`}>Monthly</span>

              <div
                className={`switch ${isAnnual ? "on" : ""}`}
                role="switch"
                aria-checked={isAnnual ? "true" : "false"}
                tabIndex={0}
                aria-label="Toggle annual billing"
                onClick={() => setBilling(isAnnual ? "monthly" : "annual")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setBilling(isAnnual ? "monthly" : "annual");
                  }
                }}
              >
                <div className="switchKnob" />
              </div>

              <span className={`billingLabel ${isAnnual ? "active" : ""}`}>Yearly (paid in full)</span>
            </div>
          </div>

          <div className="plansGrid">
            <div className="planCard core" data-plan="core">
              <div className="ribbon">&nbsp;&nbsp;Best Value</div>
              <div className="planTop">
                <div>
                  <p className="planName">Core</p>
                  <div className="planTag">Essential after-hours intake</div>
                </div>
              </div>

              <div className="planPrice">
                {isAnnual ? prices.core.annual : prices.core.monthly} <small>/ mo</small>
              </div>
              <div className="priceSub" style={{ opacity: isAnnual ? 1 : 0.55 }}>
                Yearly: $272.25<small>/ mo</small> *paid in full
              </div>

              <div className="planMeta">
                <div className="planMetaRow">
                  <span>Included minutes</span>
                  <b>{prices.core.mins}</b>
                </div>
                <div className="planMetaRow">
                  <span>Overage</span>
                  <b>$0.95 / min</b>
                </div>
              </div>

              <ul className="planList">
                <li>
                  <span className="tickDot">✓</span>
                  <span>
                    <strong>White-glove onboarding</strong> (we set up your assistant and routing fast)
                  </span>
                </li>
                <li>
                  <span className="tickDot">✓</span>
                  <span>After-hours call handling (nights/weekends/holidays)</span>
                </li>
                <li>
                  <span className="tickDot">✓</span>
                  <span>AI legal intake assistant (firm-branded)</span>
                </li>
                <li>
                  <span className="tickDot">✓</span>
                  <span>Structured intake summaries delivered instantly</span>
                </li>
                <li>
                  <span className="tickDot">✓</span>
                  <span>Email notifications to your firm</span>
                </li>
                <li>
                  <span className="tickDot">✓</span>
                  <span>Call transcripts &amp; recordings</span>
                </li>
                <li>
                  <span className="tickDot">✓</span>
                  <span>Customizable intake questions</span>
                </li>
              </ul>

              <div className="planBottom">
                <div className="planCta">
                  <a
                    className="btn btn-outline"
                    href="#info"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToId("info");
                    }}
                  >
                    Request Info
                  </a>
                </div>
                <div className="planFoot">
                  Best for solo attorneys who want professional after-hours coverage without complexity.
                </div>
              </div>
            </div>

            <div className="planCard pro" data-plan="pro">
              <div className="planTop">
                <div>
                  <p className="planName">Pro</p>
                  <div className="planTag">Intake + scheduling + urgent routing</div>
                </div>
              </div>

              <div className="planPrice">
                {isAnnual ? prices.pro.annual : prices.pro.monthly} <small>/ mo</small>
              </div>
              <div className="priceSub" style={{ opacity: isAnnual ? 1 : 0.55 }}>
                Yearly: $330.83<small>/ mo</small> *paid in full
              </div>

              <div className="planMeta">
                <div className="planMetaRow">
                  <span>Included minutes</span>
                  <b>{prices.pro.mins}</b>
                </div>
                <div className="planMetaRow">
                  <span>Overage</span>
                  <b>$0.85 / min</b>
                </div>
              </div>

              <ul className="planList">
                <li>
                  <span className="tickDot">✓</span>
                  <span>Everything in Core</span>
                </li>
                <li>
                  <span className="tickDot">✓</span>
                  <span>Consultation booking (calendar integration)</span>
                </li>
                <li>
                  <span className="tickDot">✓</span>
                  <span>SMS alerts for urgent calls</span>
                </li>
                <li>
                  <span className="tickDot">✓</span>
                  <span>Conditional routing by urgency / case type</span>
                </li>
                <li>
                  <span className="tickDot">✓</span>
                  <span>Multi-recipient notifications</span>
                </li>
                <li>
                  <span className="tickDot">✓</span>
                  <span>Expanded intake logic (by practice area)</span>
                </li>
              </ul>

              <div className="planBottom">
                <div className="planCta">
                  <a
                    className="btn btn-primary"
                    href="#info"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToId("info");
                    }}
                  >
                    Request Info
                  </a>
                </div>
                <div className="planFoot">
                  Best for firms that want intake to directly drive booked consults and faster response times.
                </div>
              </div>
            </div>

            <div className="planCard elite" data-plan="elite">
              <div className="planTop">
                <div>
                  <p className="planName">Elite</p>
                  <div className="planTag">Advanced workflow + integrations</div>
                </div>
              </div>

              <div className="planPrice">
                {isAnnual ? prices.elite.annual : prices.elite.monthly} <small>/ mo</small>
              </div>
              <div className="priceSub" style={{ opacity: isAnnual ? 1 : 0.55 }}>
                Yearly: $447.75<small>/ mo</small> *paid in full
              </div>

              <div className="planMeta">
                <div className="planMetaRow">
                  <span>Included minutes</span>
                  <b>{prices.elite.mins}</b>
                </div>
                <div className="planMetaRow">
                  <span>Overage</span>
                  <b>$0.75 / min</b>
                </div>
              </div>

              <ul className="planList">
                <li>
                  <span className="tickDot">✓</span>
                  <span>Everything in Pro</span>
                </li>
                <li>
                  <span className="tickDot">✓</span>
                  <span>CRM integrations (e.g., PracticePanther / Clio)</span>
                </li>
                <li>
                  <span className="tickDot">✓</span>
                  <span>Webhooks / API-driven workflows</span>
                </li>
                <li>
                  <span className="tickDot">✓</span>
                  <span>Multi-attorney routing logic</span>
                </li>
                <li>
                  <span className="tickDot">✓</span>
                  <span>Advanced reporting &amp; customization</span>
                </li>
                <li>
                  <span className="tickDot">✓</span>
                  <span>Ongoing optimization support</span>
                </li>
              </ul>

              <div className="planBottom">
                <div className="planCta">
                  <a
                    className="btn btn-outline"
                    href="#info"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToId("info");
                    }}
                  >
                    Request Info
                  </a>
                </div>
                <div className="planFoot">
                  Best for growing firms that want integrations, advanced routing, and deeper automation.
                </div>
              </div>
            </div>
          </div>

          <div className="plansNote">
            No contracts. Cancel anytime. Designed for after-hours usage. If your volume is unusually high, we’ll
            recommend a custom plan to keep service quality excellent.
          </div>
        </div>
      </section>

            <section id="info" className="ctaBand" style={{ scrollMarginTop: "120px" }}>
        <div className="container">
          <h2 className="sectionTitle">Request Info / Contact Us</h2>
          <p className="sectionSub">
            Tell us about your firm and after-hours call volume. We’ll follow up with more information and confirm routing
            preferences.
          </p>

          <div className="formIntroGrid">
            <div className="infoCard">
              <h3 className="infoCardTitle">What happens after you submit</h3>
              <p className="infoCardP">
                You’ll receive a confirmation email, and our team will follow up with more information and confirm
                your after-hours routing preferences.
              </p>
            </div>

            <div className="infoCard">
              <h3 className="infoCardTitle">You’ll see</h3>
              <ul className="infoList">
                <li>
                  <i>✓</i> A firm-branded assistant demo
                </li>
                <li>
                  <i>✓</i> Intake summary + routing examples
                </li>
                <li>
                  <i>✓</i> White-glove onboarding overview
                </li>
                <li>
                  <i>✓</i> Plan fit by call volume
                </li>
              </ul>
            </div>
          </div>

          <div className="formWrap">
            <div className="formCard">
              <form id="contactForm" onSubmit={submitContact}>
                <fieldset className="intentFieldset">
                  <legend className="intentLegend">What would you like us to do?</legend>

                  <div className="intentGrid">
                    <label className="intentBox">
                      <input type="checkbox" name="requestTypes" value="Info" />
                      <span className="intentCard">
                        <span className="intentText">Request Info</span>
                      </span>
                    </label>

                    <label className="intentBox">
                      <input type="checkbox" name="requestTypes" value="Callback" />
                      <span className="intentCard">
                        <span className="intentText">Request Callback</span>
                      </span>
                    </label>
                  </div>
                </fieldset>

                <div className="row2">
                  <div>
                    <label htmlFor="firstName">First Name *</label>
                    <input id="firstName" name="firstName" required placeholder="John" />
                  </div>
                  <div>
                    <label htmlFor="lastName">Last Name *</label>
                    <input id="lastName" name="lastName" required placeholder="Doe" />
                  </div>
                </div>

                <div className="rowFirm">
                  <div>
                    <label htmlFor="firmName">Law Firm Name *</label>
                    <input id="firmName" name="firmName" required placeholder="Smith & Associates" />
                  </div>
                  <div>
                    <label htmlFor="attorneyCount">Number of Attorneys *</label>
                    <select id="attorneyCount" name="attorneyCount" required defaultValue="">
                      <option value="" disabled>
                        Select
                      </option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                      <option value="7">7</option>
                      <option value="8+">8+</option>
                    </select>
                  </div>
                </div>

                <div className="row2">
                  <div>
                    <label htmlFor="address">Address</label>
                    <input id="address" name="address" placeholder="123 Main Street" />
                  </div>
                  <div>
                    <label htmlFor="city">City</label>
                    <input id="city" name="city" placeholder="Scranton" />
                  </div>
                </div>

                <div className="rowAddr2">
                  <div>
                    <label htmlFor="county">County</label>
                    <input id="county" name="county" placeholder="Lackawanna" />
                  </div>
                  <div>
                    <label htmlFor="state">State</label>
                    <select id="state" name="state" defaultValue="">
                      {US_STATES.map((item) => (
                        <option key={item.value || "blank"} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="zip">Zip</label>
                    <IMaskInput
                      mask="00000[-0000]"
                      unmask={false}
                      placeholder="18505"
                      id="zip"
                      name="zip"
                      inputMode="numeric"
                      onAccept={() => {}}
                    />
                  </div>
                </div>

                <div className="rowEmail">
                  <div>
                    <label htmlFor="email">Email *</label>
                    <input id="email" name="email" type="email" required placeholder="john@lawfirm.com" />
                  </div>
                  <div>
                    <label htmlFor="website">Firm Website</label>
                    <input
                      id="website"
                      name="website"
                      type="text"
                      inputMode="url"
                      placeholder="website.com"
                      pattern="^(?=.{3,253}$)(?!.*\\s)(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\\.)+[A-Za-z]{2,63}$"
                      title="Please enter a website like website.com"
                    />
                  </div>
                </div>

                <div className="narrowPhonesWrap">
                  <div className="narrowPhones">
                    <div>
                      <label htmlFor="mobilePhone">Mobile #</label>
                      <IMaskInput
                        mask="(000) 000-0000"
                        unmask={false}
                        placeholder="(555) 123-4567"
                        id="mobilePhone"
                        name="mobilePhone"
                        onAccept={() => {}}
                      />
                    </div>

                    <div>
                      <label htmlFor="officePhone">Office Phone *</label>
                      <IMaskInput
                        mask="(000) 000-0000"
                        unmask={false}
                        placeholder="(555) 123-4567"
                        id="officePhone"
                        name="officePhone"
                        required
                        onAccept={() => {}}
                      />
                    </div>

                    <div>
                      <label htmlFor="officeFax">Office Fax</label>
                      <IMaskInput
                        mask="(000) 000-0000"
                        unmask={false}
                        placeholder="(555) 987-6543"
                        id="officeFax"
                        name="officeFax"
                        onAccept={() => {}}
                      />
                    </div>
                  </div>
                </div>

                <fieldset className="checkboxFieldset">
                  <legend className="checkboxLegend">Practice Areas</legend>

                  <div className="checkboxGrid">
                    <div className="checkboxCol">
                      <div className="checkboxItems">
                        <label className="checkItem">
                          <input type="checkbox" name="practiceAreas" value="Bankruptcy" />
                          <span>Bankruptcy</span>
                        </label>

                        <label className="checkItem">
                          <input type="checkbox" name="practiceAreas" value="Business / Corporate" />
                          <span>Business / Corporate</span>
                        </label>

                        <label className="checkItem">
                          <input type="checkbox" name="practiceAreas" value="Civil Lawsuit" />
                          <span>Civil Lawsuit</span>
                        </label>

                        <label className="checkItem">
                          <input type="checkbox" name="practiceAreas" value="Criminal Defense" />
                          <span>Criminal Defense</span>
                        </label>

                        <label className="checkItem">
                          <input type="checkbox" name="practiceAreas" value="Custody" />
                          <span>Custody</span>
                        </label>

                        <label className="checkItem">
                          <input type="checkbox" name="practiceAreas" value="Divorce" />
                          <span>Divorce</span>
                        </label>
                      </div>

                      <div className="practiceOtherWrap">
                        <input id="otherPractice1" name="otherPractice" placeholder="Other Practice Area" />
                      </div>
                    </div>

                    <div className="checkboxCol">
                      <div className="checkboxItems">
                        <label className="checkItem">
                          <input type="checkbox" name="practiceAreas" value="DUI / Traffic" />
                          <span>DUI / Traffic</span>
                        </label>

                        <label className="checkItem">
                          <input type="checkbox" name="practiceAreas" value="Estate Planning / Probate" />
                          <span>Estate Planning / Probate</span>
                        </label>

                        <label className="checkItem">
                          <input type="checkbox" name="practiceAreas" value="Family Law" />
                          <span>Family Law</span>
                        </label>

                        <label className="checkItem">
                          <input type="checkbox" name="practiceAreas" value="Labor & Employment" />
                          <span>Labor &amp; Employment</span>
                        </label>

                        <label className="checkItem">
                          <input type="checkbox" name="practiceAreas" value="Landlord / Tenant" />
                          <span>Landlord / Tenant</span>
                        </label>

                        <label className="checkItem">
                          <input type="checkbox" name="practiceAreas" value="Litigation & Dispute Resolution" />
                          <span>Litigation &amp; Dispute Resolution</span>
                        </label>
                      </div>

                      <div className="practiceOtherWrap">
                        <input id="otherPractice2" name="otherPractice" placeholder="Other Practice Area" />
                      </div>
                    </div>

                    <div className="checkboxCol">
                      <div className="checkboxItems">
                        <label className="checkItem">
                          <input type="checkbox" name="practiceAreas" value="Medical Malpractice" />
                          <span>Medical Malpractice</span>
                        </label>

                        <label className="checkItem">
                          <input type="checkbox" name="practiceAreas" value="Personal Injury" />
                          <span>Personal Injury</span>
                        </label>

                        <label className="checkItem">
                          <input type="checkbox" name="practiceAreas" value="Real Estate" />
                          <span>Real Estate</span>
                        </label>

                        <label className="checkItem">
                          <input type="checkbox" name="practiceAreas" value="Trusts & Estates" />
                          <span>Trusts &amp; Estates</span>
                        </label>

                        <label className="checkItem">
                          <input type="checkbox" name="practiceAreas" value="Workers Compensation" />
                          <span>Workers Compensation</span>
                        </label>
                      </div>

                      <div className="practiceOtherWrap">
                        <input id="otherPractice3" name="otherPractice" placeholder="Other Practice Area" />
                      </div>
                    </div>
                  </div>
                </fieldset>

                <fieldset className="radioFieldset">
                  <legend className="radioLegend">Current After-hours Intake Method *</legend>

                  <div className="radioGrid">
                    <label className="radioItem">
                      <input type="radio" name="intakeMethod" value="Voicemail" required />
                      <span>Voicemail</span>
                    </label>

                    <label className="radioItem">
                      <input type="radio" name="intakeMethod" value="Answering Service" required />
                      <span>Answering Service</span>
                    </label>

                    <label className="radioItem">
                      <input type="radio" name="intakeMethod" value="None" required />
                      <span>None</span>
                    </label>

                    <label className="radioItem">
                      <input type="radio" name="intakeMethod" value="Other" required />
                      <span>Other</span>
                    </label>
                  </div>
                </fieldset>

                <div>
                  <label htmlFor="msg">Message</label>
                  <textarea
                    id="msg"
                    name="message"
                    maxLength={700}
                    placeholder="Any additional comments, questions or message?"
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                  />
                  <div className="small">
                    <span>{msgCount}</span>/700 characters
                  </div>
                </div>

                <div className="agree">
                  <input id="agree" name="agree" type="checkbox" required />
                  <label htmlFor="agree" style={{ fontSize: 13, fontWeight: 800, color: "var(--muted)" }}>
                    I understand that submitting this form does not create an attorney-client relationship and I will
                    not include confidential or time-sensitive information. *
                  </label>
                </div>

                {formStatus.type !== "idle" && (
                  <div
                    className={`notice ${formStatus.type === "ok" ? "ok" : formStatus.type === "err" ? "err" : ""}`}
                    style={{ display: "block" }}
                  >
                    {formStatus.text}
                  </div>
                )}

                <div className="turnstileWrap">
                  {TURNSTILE_SITE_KEY ? (
                    <div className="turnstileInner">
                      <Turnstile
                        key={turnstileRenderKey}
                        sitekey={TURNSTILE_SITE_KEY}
                        onVerify={(token) => setTurnstileToken(token)}
                        onExpire={() => setTurnstileToken("")}
                        onError={() => setTurnstileToken("")}
                      />
                    </div>
                  ) : (
                    <div className="notice err" style={{ maxWidth: 520, margin: "0 auto" }}>
                      Missing NEXT_PUBLIC_TURNSTILE_SITE_KEY in your environment. Add it, restart dev server, and
                      refresh.
                    </div>
                  )}
                </div>

                <div className="formActions">
                  <button
                    className="btn btn-primary"
                    type="submit"
                    style={{ minWidth: 260 }}
                    disabled={submitDisabled}
                  >
                    {submitText}
                  </button>
                </div>

                <div className="small" style={{ textAlign: "center", marginTop: 2 }}>
                  By submitting, you agree to be contacted about this request.
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          <div className="footerGrid">
            <div>
              <a className="footerBrand" href="https://legalclientintake.com" aria-label="Back to home">
                <img src="/images/logo-LCI-light2.png" alt="Legal Client Intake" />
              </a>
              <p className="footerP">Intelligent after-hours intake for law firms. Never miss a potential client again.</p>
            </div>

            <div className="footerCol">
              <h5>Company</h5>
              <a
                href="#how"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToId("how");
                }}
              >
                How it works
              </a>
              <a
                href="#plans"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToId("plans");
                }}
              >
                Plans
              </a>
              <a
                href="#info"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToId("info");
                }}
              >
                Contact Us
              </a>
            </div>

            <div className="footerCol">
              <h5>Contact</h5>
              <a
                href="#info"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToId("info");
                }}
              >
                Request a info / send a message
              </a>
              <a
                href="#info"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToId("info");
                }}
              >
                demo@legalclientintake.com
              </a>
              <a href="https://app.legalclientintake.com" target="_blank" rel="noopener noreferrer">
                Client Login
              </a>
            </div>

            <div className="footerCol">
              <h5>Legal</h5>
              <a
                href="#info"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToId("info");
                }}
              >
                No attorney-client relationship
              </a>
              <a
                href="#info"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToId("info");
                }}
              >
                Do not send confidential information
              </a>
            </div>
          </div>

          <div className="footerBottom">
            <div>
              © {year} Teleringer LLC. All rights reserved. Legal Client Intake is not a law firm and does not provide
              legal advice.
            </div>
            <div>
              Website design by{" "}
              <a href="https://teleringer.com" target="_blank" rel="noopener noreferrer">
                Teleringer
              </a>
            </div>
          </div>
        </div>
      </footer>

      <a
        href="#top"
        className={`btn btn-outline toTop ${showToTop ? "show" : ""}`}
        id="toTopBtn"
        aria-label="Back to top"
        onClick={(e) => {
          e.preventDefault();
          scrollToId("top");
        }}
      >
        ↑ Top
      </a>
    </main>
  );
}
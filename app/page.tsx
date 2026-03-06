"use client";

import Turnstile from "react-turnstile";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { IMaskInput } from "react-imask";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

type BillingState = "monthly" | "annual";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showToTop, setShowToTop] = useState(false);
  const [billing, setBilling] = useState<BillingState>("monthly");
  const year = new Date().getFullYear();
  const [activeSection, setActiveSection] = useState<"top" | "how" | "plans" | "demo">("top");

  const [msg, setMsg] = useState("");
  const msgCount = msg.length;

  const [turnstileToken, setTurnstileToken] = useState("");

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

  const scrollToId = (id: "top" | "how" | "plans" | "demo") => {
    const el = document.getElementById(id);
    if (!el) return;

    const y = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    setActiveSection(id);
  };

  // Smooth scroll for internal hash links + close mobile menu on click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const a = target.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;

      const href = a.getAttribute("href");
      if (!href || href === "#") return;

      const el = document.querySelector(href);
      if (!el) return;

      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setMobileMenuOpen(false);
    };

    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Track visible section to update nav button highlight
  useEffect(() => {
    const sections = ["how", "plans", "demo"] as const;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const id = entry.target.id;
          if (id === "how" || id === "plans" || id === "demo") {
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

  // Back-to-top + header scrolled styling
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

    const name = String(fd.get("name") || "").trim();
    const firm = String(fd.get("firm") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const practice = String(fd.get("practice") || "").trim();
    const message = String(fd.get("message") || "").trim();

    setFormStatus({ type: "sending", text: "Sending…" });
    setSubmitDisabled(true);
    setSubmitText("Sending…");

    const [firstName, ...rest] = name.split(" ").filter(Boolean);
    const lastName = rest.length ? rest.join(" ") : "(not provided)";

    const payload = {
      firstName,
      lastName,
      email,
      phone,
      turnstileToken,
      message: `Firm: ${firm}\nPractice Area: ${practice}\n\n${message}`,
      company: "",
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Request failed");
      }

      setFormStatus({
        type: "ok",
        text: "Success! Your request was sent. Please check your email for confirmation.",
      });

      setSubmitText("Sent");
      form.reset();
      setMsg("");
      setTurnstileToken("");

      setTimeout(() => {
        setSubmitText("Submit Request");
        setSubmitDisabled(false);
      }, 1600);
    } catch {
      setFormStatus({
        type: "err",
        text:
          "This form is ready, but the email-sending endpoint isn’t connected yet. Next step: create /api/contact so it can email office@legalclientintake.com and send a confirmation to you.",
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
body{
  margin:0;
  padding-top: 0 !important;
  font-family: "Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji";
  color:var(--text);
  background: radial-gradient(1200px 500px at 50% 0%, #dff6f3 0%, var(--bg) 55%, #ffffff 100%);
  line-height:1.45;
  letter-spacing: -0.01em;
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
  width: 100%;
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background:rgba(255,255,255,.78);
  backdrop-filter: blur(10px);
  border-bottom:1px solid rgba(226,232,240,.65);
  transition: .2s background, .2s border-color;
  padding-top: 0;
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
  transition: .15s opacity;
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
  position: relative;
  z-index: 10002;
  pointer-events: auto;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
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
  background: transparent;
  scroll-margin-top: 110px;
}

@media (max-width: 520px){
  section{
    scroll-margin-top: 86px;
  }
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
  border-top: 1px solid rgba(226,232,240,.75);
  border-bottom: 1px solid rgba(226,232,240,.75);
}

.sectionTitle{font-size:36px;line-height:1.12;margin:0 0 10px;text-align:center;letter-spacing:-0.02em}
.sectionSub{margin:0 auto 28px;max-width:72ch;color:var(--muted);text-align:center}

.hero{
  padding: 64px 0 34px;
  background: linear-gradient(180deg, var(--execTop), var(--execBottom));
  position: relative;
  overflow: hidden;
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
  background-size: 56px 56px;
  mask-image: radial-gradient(120% 80% at 70% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,.55) 55%, rgba(0,0,0,0) 100%);
}
.hero .container,
.heroGrid{
  position: relative;
  z-index: 1;
}
.heroGrid{
  display:grid;
  grid-template-columns: 1.15fr .85fr;
  gap: 40px;
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
  border: 1px solid rgba(255,255,255,.14);
  margin:0 0 14px;
}

.heroTitle{
  font-size:64px;
  line-height:1.03;
  letter-spacing:-0.03em;
  font-weight:900;
  color: var(--execText);
  margin: 12px 0 10px;
}
.heroGoldRule{
  width: 88px;
  height: 2px;
  background: var(--execGold);
  border-radius: 999px;
  margin: 12px 0 18px;
}
.heroSub{
  color: var(--execMuted);
  font-size: 18px;
  max-width: 64ch;
  margin:0;
}

.heroActions{display:flex;gap:12px;flex-wrap:wrap;margin-top:22px}
.heroActions .btn-primary{
  background: var(--execGold);
  color: #0B1220;
  border: 1px solid rgba(255,255,255,.10);
  box-shadow: 0 16px 34px rgba(0,0,0,.28);
}
.heroActions .btn-primary:hover{ filter: brightness(.98); }

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
  box-shadow: 0 10px 22px rgba(0,0,0,.18);
  margin-top:1px;
}

.heroImageWrap{
  background: transparent;
  border: 1px solid rgba(255,255,255,.10);
  box-shadow: none;
  padding: 0;
  border-radius:22px;
  overflow:hidden;
}
.heroImageCard{ background: transparent; border: none; }
.heroImageCard img{
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,.10);
  opacity: .92;
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
  color: var(--execText);
  position:relative;
  overflow:hidden;
  border-top: 1px solid rgba(255,255,255,.10);
  border-bottom: 1px solid rgba(255,255,255,.10);
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
  background-size: 56px 56px;
  mask-image: radial-gradient(120% 80% at 50% 35%, rgba(0,0,0,1) 0%, rgba(0,0,0,.55) 55%, rgba(0,0,0,0) 100%);
}
section.plansBand .container{ position:relative; z-index:1; }
section.plansBand .sectionTitle{ color: var(--execText); }
section.plansBand .sectionSub{ color: rgba(248,250,252,.82); }

.ribbon {
  position: absolute;
  top: 14px;
  right: -62px;
  width: 220px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #f44336, #b71c1c);
  color: #fff;
  font-weight: 800;
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
  transform: rotate(45deg);
  transform-origin: center;
  box-shadow: 0 6px 15px rgba(0,0,0,.25);
  text-shadow: 0 1px 1px rgba(0,0,0,.35);
  z-index: 5;
}

.billingToggleWrap{display:flex;justify-content:center;margin: 10px 0 18px;}
.billingToggle{
  display:flex;align-items:center;gap:12px;
  padding:10px 12px;border-radius:999px;
  background: rgba(255,255,255,.08);
  border:1px solid rgba(255,255,255,.16);
  box-shadow: 0 16px 34px rgba(0,0,0,.22);
  backdrop-filter: blur(8px);
}
.billingLabel{font-size:13px;font-weight:900;letter-spacing: .02em;color: rgba(248,250,252,.88);opacity: .85;user-select:none;white-space:nowrap;}
.billingLabel.active{opacity: 1;color: rgba(248,250,252,.98);}
.switch{
  position:relative;width:64px;height:34px;border-radius:999px;
  background: rgba(214,178,74,.22);
  border:1px solid rgba(214,178,74,.45);
  box-shadow: 0 16px 34px rgba(0,0,0,.28);
  cursor:pointer;flex:none;
}
.switchKnob{
  position:absolute;top:3px;left:3px;width:28px;height:28px;border-radius:999px;
  background: rgba(248,250,252,.95);
  box-shadow: 0 10px 24px rgba(0,0,0,.30);
  transition: .18s transform;
}
.switch.on .switchKnob{transform: translateX(30px);}

.plansGrid{
  display:grid;
  grid-template-columns: repeat(3, 1fr);
  gap:18px;
  align-items:stretch;
  margin-top: 14px;
}
.planCard{
  background: rgba(255,255,255,.96);
  color: var(--text);
  border:1px solid rgba(255,255,255,.18);
  border-radius:22px;
  box-shadow: 0 18px 45px rgba(0,0,0,.30);
  padding:18px;
  position:relative;
  overflow:hidden;
  display:flex;
  flex-direction:column;
  min-height: 660px;
}
.planTop{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom: 10px;}
.planName{font-size:18px;font-weight:900;margin:0;letter-spacing:-0.02em;}
.planTag{font-size:13px;font-weight:800;color: rgba(71,85,105,.92);margin-top: 2px;}
.planPrice{font-size:44px;font-weight:1000;letter-spacing:-0.03em;margin: 10px 0 10px;line-height:1.0;}
.planPrice small{font-size:14px;font-weight:900;color: rgba(71,85,105,.92);margin-left: 6px;}
.priceSub{margin-top:-2px;font-size:13px;color: rgba(71,85,105,.92);font-weight:900;}

.planMeta{
  background: rgba(15,118,110,.06);
  border:1px solid rgba(15,118,110,.14);
  border-radius:16px;
  padding:12px;
  display:grid;
  gap:8px;
  margin: 10px 0 14px;
  font-weight:800;
  color: rgba(15,23,42,.88);
}
.planMetaRow{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:14px;}
.planMetaRow b{font-weight:1000;}

.planList{list-style:none;padding:0;margin: 0 0 10px;display:grid;gap:12px;color: rgba(15,23,42,.88);font-weight:800;font-size:14px;}
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
.planBottom{margin-top:auto;padding-top: 12px;}
.planCta{display:flex;justify-content:center;margin-bottom: 10px;}
.planCta .btn{width:100%;max-width: 340px;padding:14px 16px;border-radius:14px;}
.planCard.pro .btn-primary{background: var(--teal);box-shadow: 0 18px 38px rgba(15,118,110,.26);}
.planFoot{font-size: 13px;color: rgba(71,85,105,.90);font-weight:800;}
.plansNote{margin-top: 18px;text-align:center;color: rgba(248,250,252,.78);font-size:13px;font-weight:800;}

section.ctaBand::before{ display:none; }
section.ctaBand{
  background: linear-gradient(180deg, rgba(15,118,110,.95), rgba(15,118,110,.88));
  color:#fff;
  border-top:1px solid rgba(255,255,255,.12);
  border-bottom:1px solid rgba(255,255,255,.12);
}
.ctaBand .sectionTitle{color:#fff}
.ctaBand .sectionSub{color:rgba(255,255,255,.86)}

.formWrap{
  max-width: 920px;
  margin: 22px auto 0;
  display:grid;
  grid-template-columns: 1.05fr .95fr;
  gap: 16px;
  align-items:stretch;
  width: 100%;
}

.formWrap > *{
  min-width: 0;
}
.formCard{
  background:#fff;color:var(--text);
  border-radius:18px;
  border:1px solid rgba(255,255,255,.35);
  box-shadow:0 18px 45px rgba(2,8,23,.25);
  padding:18px;
}
.formAside{
  border-radius:18px;
  border:1px solid rgba(255,255,255,.18);
  background: rgba(255,255,255,.08);
  box-shadow:0 18px 45px rgba(2,8,23,.20);
  padding:18px;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
  gap:14px;
}
.asideTitle{margin:0;font-size:16px;font-weight:1000;letter-spacing:-.02em;}
.asideP{margin:8px 0 0;color: rgba(255,255,255,.86);font-weight:700;font-size:14px;line-height:1.5;}
.asideBox{background: rgba(0,0,0,.15);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:14px;}
.asideList{margin:10px 0 0;padding:0;list-style:none;display:grid;gap:10px;color: rgba(255,255,255,.88);font-weight:800;font-size:14px;}
.asideList li{display:flex;gap:10px;align-items:flex-start;line-height:1.35;}
.asideList i{
  width:22px;height:22px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;
  background: rgba(214,178,74,.18);
  border:1px solid rgba(214,178,74,.35);
  color:#fff;
  font-style:normal;
  font-weight:1000;
  flex:none;
  margin-top:1px;
}
.formCard,
.formAside{
  min-width: 0;
  overflow: hidden;
}

.row2 > div{
  min-width: 0;
}

input, select, textarea{
  max-width: 100%;
}

.turnstileWrap{
  max-width: 100%;
  overflow-x: auto;
  padding-bottom: 2px;
}
form{display:grid;gap:12px}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
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
  border-color:rgba(15,118,110,.55);
  box-shadow:0 0 0 4px rgba(15,118,110,.10)
}
textarea{min-height:110px;resize:vertical}
.small{font-size:12px;color:var(--muted);font-weight:700}
.agree{display:flex;gap:10px;align-items:flex-start}
.agree input{width:18px;height:18px;margin-top:3px}
.formActions{display:flex;justify-content:center;margin-top:6px}

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
.footerGrid{display:grid;grid-template-columns: 1.3fr 1fr 1fr;gap:20px;align-items:start;}
.footerBrand{display:flex;gap:12px;align-items:flex-start;text-decoration:none;}
.footerBrand img{height:44px;width:auto;}
.footerP{margin:10px 0 0;color:rgba(255,255,255,.80);font-size:14px;font-weight:650;max-width: 52ch;}
.footerCol h5{margin:0 0 10px;font-size:14px;font-weight:1000;letter-spacing:-.01em;color: rgba(255,255,255,.92);}
.footerCol a{display:block;color:rgba(255,255,255,.76);text-decoration:none;margin:8px 0;font-size:14px;font-weight:700;}
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
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 9999;
  opacity: 0;
  transform: translateY(10px);
  pointer-events: none;
  transition: .15s opacity, .15s transform;
}
.toTop.show{
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

@media (max-width: 980px){
  .heroGrid{ grid-template-columns: 1fr; gap: 22px; }
  .heroTitle{ font-size: 44px; }
  .hero::after{ width: 100%; opacity: .10; }
  .grid3{grid-template-columns:1fr}
  .practice{grid-template-columns:1fr}
  .plansGrid{grid-template-columns:1fr}
  .planCard{ min-height: 0; }
  .formWrap{ grid-template-columns: 1fr; }
  .row2{grid-template-columns:1fr}
  .footerGrid{ grid-template-columns: 1fr; }
}
@media (max-width: 520px){
  .toTop{ right: 14px; bottom: 14px; }
}
@media (max-width: 768px){
  .ribbon{
    top: 12px;
    right: -58px;
    width: 175px;
    font-size: 11px;
  }
}
      `}</style>

      <div className="topbar" id="topbar">
        <div className="container">
          <div className="nav">
            <a className="brand" href="#top" aria-label="Legal Client Intake">
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
                className={`btn ${activeSection === "demo" ? "btn-primary" : "btn-outline"}`}
                href="#demo"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToId("demo");
                }}
              >
                Contact Us
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
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => {
                  scrollToId("how");
                  setMobileMenuOpen(false);
                }}
              >
                How it works
              </button>

              <button
                className="btn btn-outline"
                type="button"
                onClick={() => {
                  scrollToId("plans");
                  setMobileMenuOpen(false);
                }}
              >
                Plans
              </button>

              <button
                className="btn btn-primary"
                type="button"
                onClick={() => {
                  scrollToId("demo");
                  setMobileMenuOpen(false);
                }}
              >
                Contact Us
              </button>
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
                Stop Missing New Client Calls After Hours.
              </h1>

              <div className="heroGoldRule" aria-hidden="true" />

              <p className="heroSub">
                When your office closes, potential clients don’t stop calling. LCI answers after-hours, captures the
                details that matter, and sends you an instant intake summary—so you can call back first.
              </p>

              <div className="heroActions">
                <a className="btn btn-primary" href="#demo">
                  Book a Demo
                </a>
                <a className="btn btn-outline" href="#how">
                  See How It Works
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

      <section>
        <div className="container">
          <h2 className="sectionTitle">Practice Area Use Cases</h2>
          <p className="sectionSub">
            Customized intake workflows for every type of legal practice:
            <br />
            regardless of the number of practice areas you serve.
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
              <span className={`billingLabel ${!isAnnual ? "active" : ""}`} id="lblMonthly">
                Monthly
              </span>

              <div
                className={`switch ${isAnnual ? "on" : ""}`}
                id="billingSwitch"
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

              <span className={`billingLabel ${isAnnual ? "active" : ""}`} id="lblAnnual">
                Yearly (paid in full)
              </span>
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

              <div className="planPrice" id="price-core">
                {isAnnual ? prices.core.annual : prices.core.monthly} <small>/ mo</small>
              </div>
              <div className="priceSub" id="sub-core" style={{ opacity: isAnnual ? 1 : 0.55 }}>
                Yearly: $272.25<small>/ mo</small> *paid in full
              </div>

              <div className="planMeta">
                <div className="planMetaRow">
                  <span>Included minutes</span>
                  <b id="mins-core">{prices.core.mins}</b>
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
                  <a className="btn btn-outline" href="#demo">
                    Book a Demo
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

              <div className="planPrice" id="price-pro">
                {isAnnual ? prices.pro.annual : prices.pro.monthly} <small>/ mo</small>
              </div>
              <div className="priceSub" id="sub-pro" style={{ opacity: isAnnual ? 1 : 0.55 }}>
                Yearly: $330.83<small>/ mo</small> *paid in full
              </div>

              <div className="planMeta">
                <div className="planMetaRow">
                  <span>Included minutes</span>
                  <b id="mins-pro">{prices.pro.mins}</b>
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
                  <a className="btn btn-primary" href="#demo">
                    Book a Demo
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

              <div className="planPrice" id="price-elite">
                {isAnnual ? prices.elite.annual : prices.elite.monthly} <small>/ mo</small>
              </div>
              <div className="priceSub" id="sub-elite" style={{ opacity: isAnnual ? 1 : 0.55 }}>
                Yearly: $447.75<small>/ mo</small> *paid in full
              </div>

              <div className="planMeta">
                <div className="planMetaRow">
                  <span>Included minutes</span>
                  <b id="mins-elite">{prices.elite.mins}</b>
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
                  <a className="btn btn-outline" href="#demo">
                    Book a Demo
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

      <section id="demo" className="ctaBand">
        <div className="container">
          <h2 className="sectionTitle">Book a Demo / Contact Us</h2>
          <p className="sectionSub">
            Tell us about your firm and after-hours call volume. We’ll follow up to schedule a demo and confirm routing
            preferences.
          </p>

          <div className="formWrap">
            <div className="formCard">
              <div className="notice" style={{ marginBottom: 12 }}>
                <strong>Note:</strong> This form is designed to notify <strong>office@legalclientintake.com</strong> and
                send a confirmation email to the submitter once we connect the backend endpoint.
              </div>

              <form id="contactForm" onSubmit={submitContact}>
                <div className="row2">
                  <div>
                    <label htmlFor="name">Name *</label>
                    <input id="name" name="name" required placeholder="John Doe" />
                  </div>
                  <div>
                    <label htmlFor="firm">Law Firm Name *</label>
                    <input id="firm" name="firm" required placeholder="Smith & Associates" />
                  </div>
                </div>

                <div className="row2">
                  <div>
                    <label htmlFor="email">Email *</label>
                    <input id="email" name="email" type="email" required placeholder="john@lawfirm.com" />
                  </div>
                  <div>
                    <label htmlFor="phone">Phone *</label>
                    <IMaskInput
                      mask="(000) 000-0000"
                      unmask={false}
                      placeholder="(555) 123-4567"
                      id="phone"
                      name="phone"
                      required
                      onAccept={() => {}}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="practice">Practice Area *</label>
                  <select id="practice" name="practice" required defaultValue="">
                    <option value="" disabled>
                      Select a practice area
                    </option>
                    <option>Personal Injury</option>
                    <option>Criminal Defense</option>
                    <option>Family Law</option>
                    <option>DUI</option>
                    <option>Immigration</option>
                    <option>Bankruptcy</option>
                    <option>Civil Law</option>
                    <option>Real Estate Law</option>
                    <option>Business/Corporate Law</option>
                    <option>Labor &amp; Employment</option>
                    <option>Trusts &amp; Estates</option>
                    <option>Litigation &amp; Dispute Resolution</option>
                    <option>General Practice</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="msg">Message</label>
                  <textarea
                    id="msg"
                    name="message"
                    maxLength={700}
                    placeholder="Tell us about your after-hours call situation..."
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                  />
                  <div className="small">
                    <span id="count">{msgCount}</span>/700 characters
                  </div>
                </div>

                <div className="agree">
                  <input id="agree" name="agree" type="checkbox" required />
                  <label htmlFor="agree" style={{ fontSize: 13, fontWeight: 800, color: "var(--muted)" }}>
                    I understand that submitting this form does not create an attorney-client relationship. *
                  </label>
                </div>

                {formStatus.type !== "idle" && (
                  <div
                    id="formStatus"
                    className={`notice ${formStatus.type === "ok" ? "ok" : formStatus.type === "err" ? "err" : ""}`}
                    style={{ display: "block" }}
                  >
                    {formStatus.text}
                  </div>
                )}

                <div className="turnstileWrap" style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
                  {TURNSTILE_SITE_KEY ? (
                    <Turnstile
                      sitekey={TURNSTILE_SITE_KEY}
                      onVerify={(token) => setTurnstileToken(token)}
                      onExpire={() => setTurnstileToken("")}
                      onError={() => setTurnstileToken("")}
                    />
                  ) : (
                    <div className="notice err" style={{ maxWidth: 520 }}>
                      Missing NEXT_PUBLIC_TURNSTILE_SITE_KEY in your environment. Add it, restart dev server, and refresh.
                    </div>
                  )}
                </div>

                <div className="formActions">
                  <button
                    className="btn btn-primary"
                    id="submitBtn"
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

            <div className="formAside">
              <div>
                <h3 className="asideTitle">What happens after you submit</h3>
                <p className="asideP">
                  You’ll receive a confirmation email, and our team will follow up to schedule your demo and confirm
                  your after-hours routing preferences.
                </p>
              </div>

              <div className="asideBox">
                <h3 className="asideTitle">You’ll see:</h3>
                <ul className="asideList">
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

              <div className="asideBox">
                <h3 className="asideTitle">Email delivery</h3>
                <p className="asideP" style={{ margin: "8px 0 0" }}>
                  Internal notifications will go to <strong>office@legalclientintake.com</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          <div className="footerGrid">
            <div>
              <a className="footerBrand" href="#top" aria-label="Back to top">
                <img src="/images/logo-LCI-light2.png" alt="Legal Client Intake" />
              </a>
              <p className="footerP">Intelligent after-hours intake for law firms. Never miss a potential client again.</p>
            </div>

            <div className="footerCol">
              <h5>Company</h5>
              <a href="#how">How it works</a>
              <a href="#plans">Plans</a>
              <a href="#demo">Contact Us</a>
            </div>

            <div className="footerCol">
              <h5>Contact</h5>
              <a href="#demo">Book a demo / send a message</a>
              <a href="#demo">office@legalclientintake.com</a>
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

      <a href="#top" className={`btn btn-outline toTop ${showToTop ? "show" : ""}`} id="toTopBtn" aria-label="Back to top">
        ↑ Top
      </a>
    </main>
  );
}
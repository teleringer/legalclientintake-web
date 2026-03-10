import LiveHomepage from "./LiveHomepage";

const MAINTENANCE_MODE = true;

function MaintenancePage() {
  const year = new Date().getFullYear();

  return (
    <main className="maintenancePage">
      <style>{`
        :root{
          --bgTop:#07111f;
          --bgBottom:#0b1728;
          --cardBg:rgba(255,255,255,.07);
          --cardBorder:rgba(255,255,255,.12);
          --text:#f8fafc;
          --muted:rgba(248,250,252,.78);
          --muted2:rgba(248,250,252,.62);
          --teal:#5eead4;
          --gold:#d6b24a;
          --line:rgba(255,255,255,.10);
        }

        *{box-sizing:border-box}
        html,body{margin:0;padding:0}
        body{
          font-family:"Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
          background:
            radial-gradient(900px 500px at 20% 0%, rgba(20,184,166,.18), transparent 55%),
            radial-gradient(800px 500px at 100% 100%, rgba(59,130,246,.14), transparent 50%),
            linear-gradient(180deg, var(--bgTop), var(--bgBottom));
          color:var(--text);
        }

        a{color:inherit;text-decoration:none}
        img{display:block;max-width:100%}

        .wrap{
          min-height:100vh;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:32px 18px;
          position:relative;
          overflow:hidden;
        }

        .glow1,
        .glow2{
          position:absolute;
          border-radius:999px;
          filter:blur(70px);
          pointer-events:none;
        }

        .glow1{
          width:320px;
          height:320px;
          top:80px;
          left:50%;
          transform:translateX(-50%);
          background:rgba(45,212,191,.12);
        }

        .glow2{
          width:260px;
          height:260px;
          right:40px;
          bottom:40px;
          background:rgba(96,165,250,.10);
        }

        .card{
          width:100%;
          max-width:860px;
          position:relative;
          z-index:1;
          border:1px solid var(--cardBorder);
          background:var(--cardBg);
          backdrop-filter:blur(18px);
          border-radius:30px;
          box-shadow:0 30px 80px rgba(0,0,0,.35);
          padding:34px 24px 24px;
        }

        .status{
          width:fit-content;
          margin:0 auto 20px;
          display:flex;
          align-items:center;
          gap:10px;
          padding:10px 16px;
          border-radius:999px;
          border:1px solid rgba(94,234,212,.28);
          background:rgba(94,234,212,.08);
          color:#bffdf3;
          font-size:13px;
          font-weight:800;
          letter-spacing:.02em;
        }

        .dotWrap{
          position:relative;
          width:12px;
          height:12px;
          flex:none;
        }

        .dotPing{
          position:absolute;
          inset:0;
          border-radius:999px;
          background:#7ef7e6;
          opacity:.75;
          animation:ping 1.6s cubic-bezier(0,0,.2,1) infinite;
        }

        .dot{
          position:relative;
          width:12px;
          height:12px;
          border-radius:999px;
          background:#7ef7e6;
        }

        @keyframes ping{
          75%,100%{
            transform:scale(2);
            opacity:0;
          }
        }

        .logo{
          margin:0 auto 14px;
          height:72px;
          width:auto;
        }

        .eyebrow{
          text-align:center;
          text-transform:uppercase;
          letter-spacing:.24em;
          font-size:12px;
          font-weight:900;
          color:var(--muted2);
          margin:0 0 10px;
        }

        .title{
          margin:0;
          text-align:center;
          font-size:44px;
          line-height:1.04;
          letter-spacing:-.03em;
          font-weight:900;
        }

        .goldRule{
          width:84px;
          height:2px;
          border-radius:999px;
          background:var(--gold);
          margin:18px auto 18px;
        }

        .lead{
          max-width:680px;
          margin:0 auto;
          text-align:center;
          font-size:18px;
          line-height:1.75;
          color:var(--muted);
          font-weight:600;
        }

        .sublead{
          max-width:620px;
          margin:14px auto 0;
          text-align:center;
          font-size:15px;
          line-height:1.7;
          color:var(--muted2);
          font-weight:600;
        }

        .infoGrid{
          margin:28px 0 0;
          display:grid;
          grid-template-columns:repeat(3, minmax(0,1fr));
          gap:16px;
        }

        .infoCard{
          border:1px solid rgba(255,255,255,.10);
          background:rgba(0,0,0,.18);
          border-radius:20px;
          padding:18px;
        }

        .infoCard h3{
          margin:0 0 8px;
          font-size:16px;
          font-weight:900;
          letter-spacing:-.02em;
        }

        .infoCard p{
          margin:0;
          color:var(--muted2);
          font-size:14px;
          line-height:1.6;
          font-weight:600;
        }

        .actions{
          margin:28px 0 0;
          display:flex;
          justify-content:center;
          gap:14px;
          flex-wrap:wrap;
        }

        .btn{
          min-width:220px;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          padding:14px 18px;
          border-radius:14px;
          font-weight:900;
          font-size:14px;
          transition:.15s transform, .15s background, .15s border-color, .15s opacity;
        }

        .btn:active{transform:translateY(1px)}

        .btnPrimary{
          background:#fff;
          color:#0b1220;
          border:1px solid rgba(255,255,255,.14);
        }

        .btnPrimary:hover{
          transform:translateY(-1px);
        }

        .btnGhost{
          background:rgba(255,255,255,.06);
          color:#fff;
          border:1px solid rgba(255,255,255,.16);
        }

        .btnGhost:hover{
          background:rgba(255,255,255,.10);
          transform:translateY(-1px);
        }

        .footer{
          margin-top:28px;
          padding-top:18px;
          border-top:1px solid var(--line);
          text-align:center;
          color:var(--muted2);
          font-size:13px;
          font-weight:700;
        }

        @media (max-width: 820px){
          .title{font-size:34px}
          .lead{font-size:16px}
          .infoGrid{grid-template-columns:1fr}
          .logo{height:60px}
          .card{padding:28px 18px 20px}
        }
      `}</style>

      <div className="wrap">
        <div className="glow1" />
        <div className="glow2" />

        <div className="card">
          <div className="status">
            <span className="dotWrap">
              <span className="dotPing" />
              <span className="dot" />
            </span>
            Platform Update in Progress
          </div>

          <img
            className="logo"
            src="/images/logo-LCI-light2.png"
            alt="Legal Client Intake"
          />

          <p className="eyebrow">Legal Client Intake</p>

          <h1 className="title">We’re upgrading the platform.</h1>

          <div className="goldRule" aria-hidden="true" />

          <p className="lead">
            We’re making improvements to performance, reliability, and the overall
            experience for law firms using Legal Client Intake.
          </p>

          <p className="sublead">
            Please check back shortly. We appreciate your patience while we complete
            these updates.
          </p>

          <div className="infoGrid">
            <div className="infoCard">
              <h3>Performance</h3>
              <p>Improving responsiveness and speed across the platform.</p>
            </div>

            <div className="infoCard">
              <h3>Reliability</h3>
              <p>Strengthening uptime and delivery of critical lead notifications.</p>
            </div>

            <div className="infoCard">
              <h3>User Experience</h3>
              <p>Refining workflows for a cleaner and more professional experience.</p>
            </div>
          </div>

          <div className="actions">
            <a
              href="mailto:operations@legalclientintake.com"
              className="btn btnPrimary"
            >
              Contact Support
            </a>

            <a
              href="mailto:demo@legalclientintake.com?subject=Legal%20Client%20Intake%20Demo%20Inquiry"
              className="btn btnGhost"
            >
              Request Early Access
            </a>
          </div>

          <div className="footer">
            © {year} Teleringer LLC. Legal Client Intake is not a law firm and does not provide legal advice.
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Page() {
  if (MAINTENANCE_MODE) {
    return <MaintenancePage />;
  }

  return <LiveHomepage />;
}
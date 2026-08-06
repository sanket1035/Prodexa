"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Zap, Sparkles, FolderGit2, Lightbulb,
  CheckCircle2, Shield, Activity, Code2, GitBranch,
  BarChart3, Bot, ChevronRight,
} from "lucide-react";

const LIFECYCLE = [
  { step: "01", label: "Idea", desc: "Day 0 concept" },
  { step: "02", label: "Blueprint", desc: "AI architecture" },
  { step: "03", label: "Build", desc: "Starter kit" },
  { step: "04", label: "Audit", desc: "Readiness score" },
  { step: "05", label: "Investor Ready", desc: "Pitch artifacts" },
];

const FEATURES = [
  { icon: Lightbulb, title: "AI Blueprint Engine",      desc: "Turn any idea into a structured product document — quality score, competitor analysis, and mermaid architecture in under 15 seconds." },
  { icon: BarChart3, title: "Launch Readiness Score",   desc: "6 deterministic modules inspect your website, GitHub repo, performance, UX, and business viability." },
  { icon: Bot,       title: "AI Co-Founder",            desc: "Context-aware AI that remembers your entire product. Ask anything — pitch strategy, architecture, market sizing." },
  { icon: Code2,     title: "One-Click Starter Kit",    desc: "Export PRD, TRD, DB schema, and API contracts as a complete ZIP. Skip 20+ hours of documentation." },
  { icon: GitBranch, title: "GitHub Integration",       desc: "Read-only audit of your repository — README quality, LICENSE, commit freshness, and package manifest." },
  { icon: Shield,    title: "Copy-Fix Drawer",          desc: "Every issue ships with exact code fixes. No vague recommendations — copy-paste solutions for every gap." },
];

const STEPS = [
  { num: "01", title: "Describe your idea",        body: "Enter your product concept, problem, and target audience. No fluff — just what matters." },
  { num: "02", title: "AI generates blueprint",    body: "Prodexa produces a 6-section structured blueprint with quality score and system architecture." },
  { num: "03", title: "Connect your product",      body: "Add your website URL and GitHub repo to unlock the full launch readiness audit." },
  { num: "04", title: "Ship with confidence",      body: "Download your starter kit, fix flagged issues, and pitch investors with a readiness report." },
];

export default function LandingPage() {
  const { user, signInAsDemoUser } = useAuth();
  const router = useRouter();

  const goBlueprint = () => { if (!user) signInAsDemoUser(); router.push("/blueprint/new"); };
  const goAudit     = () => { if (!user) signInAsDemoUser(); router.push("/projects/new"); };
  const goDemo      = () => { signInAsDemoUser(); router.push("/blueprint/bp-prodexa-demo"); };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", display: "flex", flexDirection: "column" }}>
      {/* ── Navbar ── */}
      <header
        style={{
          position: "sticky", top: 0, zIndex: 50,
          height: "56px", display: "flex", alignItems: "center",
          padding: "0 24px", gap: "16px",
          background: "rgba(9,9,11,0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
          <div style={{ width: 24, height: 24, background: "var(--accent)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap style={{ width: 14, height: 14, color: "#fff" }} />
          </div>
          <span style={{ fontWeight: 600, fontSize: 13 }}>prodexa</span>
          <span style={{
            fontSize: 9, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em",
            background: "var(--surface)", color: "var(--text-faint)", border: "1px solid var(--border)",
            padding: "2px 6px", borderRadius: 4, marginLeft: 4,
          }}>
            AI OS
          </span>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: "20px", fontSize: 13, color: "var(--text-muted)" }}>
          <button onClick={goBlueprint} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", font: "inherit" }}
            className="hover-text">Blueprint</button>
          <button onClick={goAudit} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", font: "inherit" }}>Audit</button>
          <button onClick={goDemo} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", font: "inherit" }}>Demo</button>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {user ? (
            <button className="btn btn-primary btn-sm" onClick={() => router.push("/projects")}>
              Go to Workspace <ArrowRight style={{ width: 13, height: 13 }} />
            </button>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => router.push("/login")}>Sign In</button>
              <button className="btn btn-primary btn-sm" onClick={() => router.push("/login")}>
                Get Started <ArrowRight style={{ width: 13, height: 13 }} />
              </button>
            </>
          )}
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {/* ── HERO ── */}
        <section style={{ position: "relative", overflow: "hidden", borderBottom: "1px solid var(--border)", padding: "80px 24px 100px" }}>
          {/* Grid */}
          <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.5 }} />
          {/* Ambient glow */}
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 600, height: 300, background: "rgba(217,119,6,0.06)", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none" }} />

          <div style={{ position: "relative", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
            {/* Eyebrow */}
            <div className="anim-fade" style={{
              display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24,
              fontSize: 11, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em",
              color: "var(--accent)", background: "rgba(217,119,6,0.1)",
              border: "1px solid rgba(217,119,6,0.2)", padding: "6px 14px", borderRadius: 99,
            }}>
              <Zap style={{ width: 12, height: 12 }} />
              Autonomous Pre-Launch AI Operating System
            </div>

            <h1 className="anim-fade d-50" style={{
              fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 700,
              letterSpacing: "-0.03em", lineHeight: 1.08,
              color: "var(--text)", marginBottom: 20,
            }}>
              From an idea to a{" "}
              <span style={{ color: "var(--accent)" }}>launch-ready product.</span>
            </h1>

            <p className="anim-fade d-100" style={{
              fontSize: 17, color: "var(--text-secondary)", maxWidth: 580, margin: "0 auto 40px",
              lineHeight: 1.7,
            }}>
              Most tools start after a product exists.{" "}
              <strong style={{ color: "var(--text)" }}>Prodexa starts at Day 0</strong>{" "}
              — and stays with you through architecture, build, and launch readiness.
            </p>

            {/* CTAs */}
            <div className="anim-fade d-150" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 64 }}>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button onClick={goBlueprint} className="btn btn-primary btn-lg">
              <Lightbulb className="w-4 h-4" />
              <span>Generate AI Blueprint</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button onClick={goAudit} className="btn btn-secondary btn-lg">
              <Activity className="w-4 h-4" style={{ color: "var(--accent)" }} />
              <span>Audit Readiness</span>
            </button>

            <button onClick={goDemo} className="btn btn-secondary btn-lg">
              <Sparkles className="w-4 h-4" style={{ color: "var(--accent)" }} />
              <span>Explore Demo Workspace</span>
            </button>
          </div>
        </div>

            {/* Product preview */}
            <div className="anim-fade d-200" style={{
              maxWidth: 800, margin: "0 auto",
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
            }}>
              {/* Window chrome */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
                {["#EF4444", "#F59E0B", "#22C55E"].map((c, i) => (
                  <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c + "aa" }} />
                ))}
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-faint)", marginLeft: 10 }}>
                  prodexa.app/dashboard
                </span>
              </div>

              {/* Dashboard preview */}
              <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, minHeight: 200 }}>
                {/* Score */}
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <div style={{ fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Launch Score</div>
                  <div style={{ fontSize: 42, fontWeight: 700, color: "var(--accent)" }}>84</div>
                  <div style={{ fontSize: 10, color: "var(--success)", fontFamily: "monospace" }}>↑ +6 pts</div>
                  <div style={{ width: "100%", height: 4, background: "var(--bg)", borderRadius: 99, overflow: "hidden", marginTop: 6 }}>
                    <div style={{ width: "84%", height: "100%", background: "linear-gradient(90deg, var(--accent), var(--accent-hover))", borderRadius: 99 }} />
                  </div>
                </div>

                {/* Modules */}
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 4 }}>Audit Modules</div>
                  {[
                    { label: "Engineering",  score: 82 },
                    { label: "UX & Design",  score: 85 },
                    { label: "Performance",  score: 90 },
                    { label: "Accessibility",score: 78 },
                    { label: "Business",     score: 82 },
                  ].map((m) => (
                    <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "var(--text-secondary)", width: 90, flexShrink: 0, fontFamily: "monospace" }}>{m.label}</span>
                      <div style={{ flex: 1, height: 4, background: "var(--bg)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ width: `${m.score}%`, height: "100%", background: m.score >= 80 ? "rgba(34,197,94,0.7)" : "rgba(245,158,11,0.7)", borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-muted)", width: 24, textAlign: "right" }}>{m.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── LIFECYCLE ── */}
        <section style={{ borderBottom: "1px solid var(--border)", padding: "72px 24px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ fontSize: 11, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-faint)", marginBottom: 10 }}>Lifecycle</div>
              <h2 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)" }}>
                Idea → Blueprint → Build → Launch
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
              {LIFECYCLE.map((item, idx) => (
                <div key={idx} className="card anim-fade-up" style={{ padding: 16, textAlign: "center", animationDelay: `${idx * 60}ms` }}>
                  <div style={{ fontSize: 10, fontFamily: "monospace", color: "var(--accent)", marginBottom: 6, fontWeight: 700 }}>{item.step}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DUAL ENTRY ── */}
        <section style={{ borderBottom: "1px solid var(--border)", padding: "72px 24px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontSize: 11, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-faint)", marginBottom: 10 }}>Entry Point</div>
              <h2 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)" }}>
                Where are you today?
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {[
                {
                  icon: Lightbulb, badge: "Option A",
                  title: '"I only have an idea."',
                  desc: "Generate an AI Blueprint with Quality Score (0–100), mermaid architecture, and one-click starter kit.",
                  cta: "Generate AI Blueprint", action: goBlueprint, primary: true,
                },
                {
                  icon: FolderGit2, badge: "Option B",
                  title: '"I already built my product."',
                  desc: "Run your website and GitHub through 6 deterministic readiness modules with copy-fix solutions.",
                  cta: "Audit Readiness Now", action: goAudit, primary: false,
                },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.badge}
                    onClick={card.action}
                    style={{
                      background: "var(--surface)", border: `1px solid ${card.primary ? "rgba(217,119,6,0.25)" : "var(--border)"}`,
                      borderRadius: 14, padding: 24, cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    className="anim-fade-up"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = card.primary ? "rgba(217,119,6,0.5)" : "var(--border-hover)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = card.primary ? "rgba(217,119,6,0.25)" : "var(--border)"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                      <div style={{ width: 36, height: 36, background: card.primary ? "rgba(217,119,6,0.12)" : "var(--bg)", border: `1px solid ${card.primary ? "rgba(217,119,6,0.2)" : "var(--border)"}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon style={{ width: 18, height: 18, color: card.primary ? "var(--accent)" : "var(--text-muted)" }} />
                      </div>
                      <span className="badge badge-muted" style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em" }}>{card.badge}</span>
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--text)", marginBottom: 10, lineHeight: 1.3 }}>{card.title}</h3>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 16 }}>{card.desc}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: card.primary ? "var(--accent)" : "var(--text-secondary)" }}>
                      {card.cta} <ArrowRight style={{ width: 14, height: 14 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section style={{ borderBottom: "1px solid var(--border)", padding: "72px 24px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ fontSize: 11, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-faint)", marginBottom: 10 }}>Capabilities</div>
              <h2 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)" }}>
                Everything you need to launch.
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
              {FEATURES.map((f, idx) => {
                const Icon = f.icon;
                return (
                  <div key={idx} className="card anim-fade-up" style={{ padding: "18px 20px", animationDelay: `${idx * 50}ms` }}>
                    <div style={{ width: 32, height: 32, background: "rgba(217,119,6,0.1)", border: "1px solid rgba(217,119,6,0.15)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                      <Icon style={{ width: 15, height: 15, color: "var(--accent)" }} />
                    </div>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>{f.title}</h3>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{ borderBottom: "1px solid var(--border)", padding: "72px 24px" }}>
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ fontSize: 11, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-faint)", marginBottom: 10 }}>Process</div>
              <h2 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)" }}>
                Zero to launch in 4 steps.
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {STEPS.map((step, idx) => (
                <div key={idx} className="card anim-fade-up" style={{ padding: "16px 20px", display: "flex", gap: 16, alignItems: "flex-start", animationDelay: `${idx * 80}ms` }}>
                  <div style={{ width: 36, height: 36, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--accent)", fontWeight: 700 }}>{step.num}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{step.title}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{step.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ borderBottom: "1px solid var(--border)", padding: "72px 24px" }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(20px, 2.5vw, 26px)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)", marginBottom: 32, textAlign: "center" }}>
              Frequently Asked
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { q: "Do I need to write code?", a: "No. Prodexa is designed for all technical levels. The AI handles architecture and documentation — you bring the idea." },
                { q: "What is the Blueprint Quality Score?", a: "A composite score (0-100) across 6 dimensions: Technical Feasibility, Business Potential, Innovation, Scalability, Market Readiness, and AI Necessity." },
                { q: "Is my data private?", a: "Yes. Your blueprints and project data are stored privately in your account. Nothing is shared or used for model training." },
                { q: "Can I use this for a hackathon?", a: "Absolutely. Prodexa was built specifically for hackathon builders. Generate a full product blueprint in under 15 seconds." },
              ].map((item, idx) => (
                <details key={idx} className="card" style={{ padding: "14px 18px", cursor: "pointer" }}>
                  <summary style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "space-between", listStyle: "none", userSelect: "none" }}>
                    {item.q}
                    <ChevronRight style={{ width: 14, height: 14, color: "var(--text-faint)", flexShrink: 0 }} />
                  </summary>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, margin: "12px 0 0", paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ padding: "80px 24px", textAlign: "center" }}>
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <div className="badge badge-green" style={{ marginBottom: 20, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              <CheckCircle2 style={{ width: 12, height: 12 }} />
              Free for hackathons & open-source
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text)", lineHeight: 1.1, marginBottom: 16 }}>
              Ready to build?
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-muted)", marginBottom: 32, lineHeight: 1.7 }}>
              Generate your AI blueprint in seconds. No credit card required.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <button className="btn btn-primary btn-xl" onClick={goBlueprint}>
                <Sparkles style={{ width: 16, height: 16 }} />
                Start Building Free
                <ChevronRight style={{ width: 16, height: 16 }} />
              </button>
              <button onClick={goDemo} style={{ fontSize: 13, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 4 }}>
                View Sample Blueprint →
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 18, height: 18, background: "var(--accent)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap style={{ width: 11, height: 11, color: "#fff" }} />
          </div>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>Prodexa © 2026</span>
        </div>
        <span style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: "monospace" }}>
          AI Product Operating System · Idea → Build → Launch
        </span>
      </footer>
    </div>
  );
}

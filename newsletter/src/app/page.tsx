"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [newsletter, setNewsletter] = useState<{
    subject: string;
    htmlContent: string;
    createdAt: string;
  } | null>(null);
  const [subscriberCount, setSubscriberCount] = useState(0);

  useEffect(() => {
    fetch("/api/newsletter/latest")
      .then((res) => res.json())
      .then((data) => {
        if (data) setNewsletter(data);
      })
      .catch(() => {});

    // Animated counter effect
    const target = 847;
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setSubscriberCount(target);
        clearInterval(timer);
      } else {
        setSubscriberCount(Math.floor(current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, frequency }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(data.message);
        setEmail("");
        setName("");
      } else {
        setStatus("error");
        setMessage(data.error);
      }
    } catch {
      setStatus("error");
      setMessage("Error de conexion. Intenta de nuevo.");
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-indigo-500/5 blur-[150px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/5 backdrop-blur-xl bg-black/20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-indigo-500/25">
              T
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                TechPulse
              </span>
              <span className="text-xl font-bold text-white/60 ml-1">MX</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{subscriberCount}+ suscriptores</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-6xl mx-auto px-6">
        <section className="pt-20 pb-16 lg:pt-32 lg:pb-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Copy */}
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm mb-8">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                Newsletter semanal gratuito
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
                Tu dosis de{" "}
                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                  Tech, AI
                </span>
                <br />
                <span className="text-white/90">&</span>{" "}
                <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  Startups
                </span>
              </h1>

              <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-lg">
                Cada semana, recibe un resumen curado con las noticias mas
                importantes de tecnologia, tips de desarrollo y el pulso del
                ecosistema startup en Mexico y Silicon Valley.
              </p>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                {[
                  { icon: "🤖", label: "AI & Tech News", desc: "Lo ultimo en IA" },
                  { icon: "💻", label: "Dev Tips", desc: "Codigo practico" },
                  { icon: "🚀", label: "Startups", desc: "MX & Silicon Valley" },
                ].map((f) => (
                  <div
                    key={f.label}
                    className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-indigo-500/30 transition-colors"
                  >
                    <div className="text-2xl mb-2">{f.icon}</div>
                    <div className="font-semibold text-white/90 text-sm">{f.label}</div>
                    <div className="text-xs text-slate-500">{f.desc}</div>
                  </div>
                ))}
              </div>

              {/* Subscribe Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Tu nombre (opcional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 px-5 py-3.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm"
                  />
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 px-5 py-3.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="flex gap-2">
                    {(["weekly", "daily"] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFrequency(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          frequency === f
                            ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-300"
                            : "bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white"
                        }`}
                      >
                        {f === "weekly" ? "Semanal" : "Diario"}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-sm hover:from-indigo-400 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === "loading" ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Suscribiendo...
                      </span>
                    ) : (
                      "Suscribirme gratis"
                    )}
                  </button>
                </div>

                {status === "success" && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm animate-slide-up">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {message}
                  </div>
                )}
                {status === "error" && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm animate-slide-up">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {message}
                  </div>
                )}

                <p className="text-xs text-slate-600">
                  Sin spam. Cancela cuando quieras. Generado con IA.
                </p>
              </form>
            </div>

            {/* Right - Newsletter Preview */}
            <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="relative">
                {/* Glow behind card */}
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-3xl blur-2xl" />

                <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
                  {/* Preview header */}
                  <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/60" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                        <div className="w-3 h-3 rounded-full bg-green-500/60" />
                      </div>
                      <span className="text-xs text-slate-500 font-mono">newsletter-preview.html</span>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Ultima edicion
                    </span>
                  </div>

                  {/* Newsletter content */}
                  <div className="newsletter-preview">
                    {newsletter ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: newsletter.htmlContent }}
                        className="[&_a]:pointer-events-none"
                      />
                    ) : (
                      <div className="p-8">
                        <NewsletterPlaceholder />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats section */}
        <section className="py-16 border-t border-white/[0.04]">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: "52+", label: "Ediciones publicadas" },
              { value: "847+", label: "Suscriptores activos" },
              { value: "3", label: "Secciones por edicion" },
              { value: "100%", label: "Generado con IA" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 border-t border-white/[0.04]">
          <h2 className="text-2xl font-bold text-center mb-12 text-white/90">
            Como funciona
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "IA rastrea tendencias",
                desc: "Nuestro sistema analiza cientos de fuentes de tech, AI y startups en tiempo real.",
                icon: "🔍",
              },
              {
                step: "02",
                title: "Curado inteligente",
                desc: "Gemini 2.5 Flash selecciona y redacta las noticias mas relevantes con contexto.",
                icon: "✨",
              },
              {
                step: "03",
                title: "Directo a tu inbox",
                desc: "Recibe tu newsletter perfectamente formateado cada semana (o cada dia si prefieres).",
                icon: "📬",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/20 transition-all group"
              >
                <div className="absolute -top-3 -left-1 text-5xl font-black text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors">
                  {item.step}
                </div>
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-semibold text-white/90 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04] mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white text-xs">
              T
            </div>
            <span className="text-sm text-slate-500">
              TechPulse MX &copy; {new Date().getFullYear()}
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Hecho con Next.js, Gemini AI y mucho cafe ☕
          </p>
        </div>
      </footer>
    </div>
  );
}

function NewsletterPlaceholder() {
  return (
    <div className="space-y-6">
      <div className="text-center p-6 rounded-xl bg-gradient-to-r from-indigo-600/20 to-violet-600/20">
        <h3 className="text-lg font-bold text-indigo-300 mb-1">TechPulse MX</h3>
        <p className="text-xs text-slate-400">Tu newsletter semanal de tecnologia</p>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <div className="h-3 bg-white/[0.06] rounded-full w-3/4" />
          <div className="h-3 bg-white/[0.04] rounded-full w-full" />
          <div className="h-3 bg-white/[0.04] rounded-full w-5/6" />
          <div className="h-3 bg-white/[0.03] rounded-full w-2/3" />
        </div>
      ))}
      <p className="text-center text-sm text-slate-500 italic">
        Suscribete para ver el contenido completo
      </p>
    </div>
  );
}

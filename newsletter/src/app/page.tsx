"use client";

import { useState, useEffect } from "react";

interface RecentNewsletter {
  id: string;
  subject: string;
  type: string;
  sentAt: string;
  createdAt: string;
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [newsletter, setNewsletter] = useState<{
    subject: string;
    htmlContent: string;
    createdAt: string;
  } | null>(null);
  const [stats, setStats] = useState({ subscriberCount: 0, newsletterCount: 0 });
  const [recentNewsletters, setRecentNewsletters] = useState<RecentNewsletter[]>([]);

  useEffect(() => {
    fetch("/api/newsletter/latest")
      .then((res) => res.json())
      .then((data) => {
        if (data) setNewsletter(data);
      })
      .catch(() => {});

    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {});

    fetch("/api/newsletter/recent")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRecentNewsletters(data);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, frequency }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(data.message);
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error);
      }
    } catch {
      setStatus("error");
      setMessage("Error de conexion. Intenta de nuevo.");
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const typeLabel: Record<string, string> = {
    daily: "Diario",
    weekly: "Semanal",
  };

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
          <div className="flex items-center gap-6">
            <a href="#archivo" className="hidden sm:block text-sm text-slate-400 hover:text-white transition-colors">
              Archivo
            </a>
            <a href="#como-funciona" className="hidden sm:block text-sm text-slate-400 hover:text-white transition-colors">
              Como funciona
            </a>
            {stats.subscriberCount > 0 && (
              <div className="hidden md:flex items-center gap-2 text-sm text-slate-400">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{stats.subscriberCount}+ suscriptores</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-6xl mx-auto px-6">
        <section className="pt-8 pb-16 lg:pt-12 lg:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Copy */}
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm mb-8">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                Gratis &middot; De lunes a viernes
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
                <span className="text-white/90">5 minutos para ser</span>
                <br />
                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                  el mas informado
                </span>
                <br />
                <span className="text-white/90">de tu equipo</span>
              </h1>

              <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-lg">
                Cada manana te resumimos lo que importa en tech, AI y startups
                para que llegues a la oficina sabiendo de que hablar.
                Curado por IA. Listo para tu cafe.
              </p>

              {/* Subscribe Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="sr-only" htmlFor="subscribe-email">Email</label>
                  <input
                    id="subscribe-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 px-5 py-3.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm"
                  />
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-sm hover:from-indigo-400 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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

                <div className="flex gap-2" role="group" aria-label="Frecuencia de envio">
                  {(["daily", "weekly"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      aria-pressed={frequency === f}
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

                <p className="text-xs text-slate-500">
                  Sin spam. Cancela cuando quieras. Generado con IA.
                </p>
              </form>
            </div>

            {/* Right - Newsletter Preview */}
            <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-3xl blur-2xl" />

                <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
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

                  <div className="newsletter-preview relative max-h-[500px] overflow-hidden">
                    {newsletter ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: newsletter.htmlContent }}
                        className="[&_a]:pointer-events-none [&_img]:hidden"
                      />
                    ) : (
                      <div className="p-8">
                        <NewsletterPlaceholder />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent editions / Archivo */}
        {recentNewsletters.length > 0 && (
          <section id="archivo" className="py-16 border-t border-white/[0.04]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white/90">
                Ediciones recientes
              </h2>
            </div>
            <div className="space-y-3">
              {recentNewsletters.map((n) => (
                <div
                  key={n.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/20 transition-all"
                >
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium w-fit shrink-0">
                    {typeLabel[n.type] || n.type}
                  </span>
                  <span className="text-sm text-white/80 font-medium flex-1">
                    {n.subject}
                  </span>
                  <span className="text-xs text-slate-500 shrink-0">
                    {formatDate(n.sentAt || n.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* What you get */}
        <section className="py-16 border-t border-white/[0.04]">
          <h2 className="text-2xl font-bold text-center mb-4 text-white/90">
            Que encuentras en cada edicion
          </h2>
          <p className="text-slate-400 text-center mb-12 max-w-lg mx-auto">
            Tres secciones para que estes al dia sin scrollear 20 feeds. Lo lees en 5 minutos con tu cafe.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: "🤖",
                title: "AI & Tech News",
                desc: "Lo mas relevante de inteligencia artificial y tecnologia. Con contexto, no solo titulares.",
              },
              {
                icon: "💻",
                title: "Dev Tips",
                desc: "Herramientas, snippets y consejos que puedes aplicar hoy. Sin teoria de mas.",
              },
              {
                icon: "🚀",
                title: "Startups MX & SV",
                desc: "Rondas, lanzamientos y movimientos del ecosistema en Mexico y Silicon Valley.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/20 transition-all"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-white/90 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 border-t border-white/[0.04]">
          <h2 className="text-2xl font-bold text-center mb-12 text-white/90">
            Lo que dicen nuestros lectores
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "Es lo primero que abro con mi cafe. En 5 minutos ya se de que hablar en el standup.",
                name: "Carlos M.",
                role: "Senior Developer",
              },
              {
                quote: "Me ahorra horas de scrollear Twitter y HN. El resumen de startups MX no lo encuentras en ningun otro lado.",
                name: "Ana R.",
                role: "Product Manager",
              },
              {
                quote: "Los dev tips son oro. Cada semana descubro una herramienta que termino usando en produccion.",
                name: "Diego L.",
                role: "Full Stack Engineer",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
              >
                <svg className="w-8 h-8 text-indigo-500/30 mb-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11H10v10H0z" />
                </svg>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <div className="font-medium text-white/80 text-sm">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="como-funciona" className="py-16 border-t border-white/[0.04]">
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
                desc: "Recibe tu newsletter formateado cada manana (o un digest semanal si prefieres).",
                icon: "📬",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/20 transition-all group"
              >
                <div className="absolute top-4 right-5 text-5xl font-black text-indigo-500/20 group-hover:text-indigo-500/30 transition-colors select-none">
                  {item.step}
                </div>
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-semibold text-white/90 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 border-t border-white/[0.04]">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: stats.newsletterCount > 0 ? `${stats.newsletterCount}+` : "—", label: "Ediciones enviadas" },
              { value: stats.subscriberCount > 0 ? `${stats.subscriberCount}+` : "—", label: "Suscriptores activos" },
              { value: "5 min", label: "Tiempo de lectura" },
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
      </main>

      {/* Bottom CTA */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 sm:p-12 text-center overflow-hidden">
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-3xl blur-2xl" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold text-white/90 mb-3">
              Que placer enterarse de lo que importa
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Unete y empieza a recibir lo mejor de tech, AI y startups directo en tu inbox. Vamos a la cafeina.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <label className="sr-only" htmlFor="bottom-email">Email</label>
              <input
                id="bottom-email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-5 py-3.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-sm hover:from-indigo-400 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Suscribirme gratis
              </button>
            </form>
            {status === "success" && (
              <div className="mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm animate-slide-up max-w-lg mx-auto">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {message}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white text-xs">
                T
              </div>
              <span className="text-sm text-slate-500">
                TechPulse MX &copy; {new Date().getFullYear()}
              </span>
            </div>
            {stats.subscriberCount > 0 && (
              <p className="text-sm text-slate-400 text-center">
                {stats.subscriberCount}+ profesionales en Mexico ya confian en nosotros
              </p>
            )}
            <p className="text-xs text-slate-500">
              Hecho con Next.js, Gemini AI y mucho cafe
            </p>
          </div>
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
        <p className="text-xs text-slate-400">Tu newsletter de tecnologia</p>
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

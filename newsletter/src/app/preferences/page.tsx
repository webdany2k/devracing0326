"use client";

import { useState, useEffect } from "react";
import { TOPICS, TopicSlug, TOPIC_SLUGS } from "@/lib/topics";

interface PreferencesData {
  email: string;
  name: string | null;
  frequency: string;
  topics: string[];
  customPrompt: string | null;
}

export default function PreferencesPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<PreferencesData | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [frequency, setFrequency] = useState("weekly");
  const [customPrompt, setCustomPrompt] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    setToken(t);

    if (!t) {
      setError("Token no proporcionado");
      setLoading(false);
      return;
    }

    fetch(`/api/preferences?token=${t}`)
      .then((res) => {
        if (!res.ok) throw new Error("No encontrado");
        return res.json();
      })
      .then((d: PreferencesData) => {
        setData(d);
        setSelectedTopics(d.topics);
        setFrequency(d.frequency);
        setCustomPrompt(d.customPrompt || "");
        setLoading(false);
      })
      .catch(() => {
        setError("No se pudieron cargar tus preferencias. Verifica el enlace.");
        setLoading(false);
      });
  }, []);

  function toggleTopic(slug: string) {
    setSelectedTopics((prev) => {
      if (prev.includes(slug)) {
        if (prev.length <= 1) return prev; // min 1 topic
        return prev.filter((t) => t !== slug);
      }
      return [...prev, slug];
    });
  }

  async function handleSave() {
    if (!token || selectedTopics.length === 0) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          topics: selectedTopics,
          frequency,
          customPrompt: customPrompt.trim() || null,
        }),
      });

      if (res.ok) {
        setSuccess("Preferencias actualizadas correctamente");
      } else {
        const d = await res.json();
        setError(d.error || "Error al guardar");
      }
    } catch {
      setError("Error de conexion");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-center">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <nav className="relative z-10 border-b border-white/5 backdrop-blur-xl bg-black/20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <a href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-indigo-500/25">
              T
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                TechPulse
              </span>
              <span className="text-xl font-bold text-white/60 ml-1">MX</span>
            </div>
          </a>
        </div>
      </nav>

      <main className="relative z-10 max-w-xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-white/90 mb-2">Tus preferencias</h1>
        <p className="text-slate-400 text-sm mb-8">
          {data?.email} &middot; Personaliza el contenido de tu newsletter
        </p>

        {/* Topic picker */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-white/80 mb-3">
            Temas que te interesan
          </label>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((topic) => (
              <button
                key={topic.slug}
                type="button"
                onClick={() => toggleTopic(topic.slug)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  selectedTopics.includes(topic.slug)
                    ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-300"
                    : "bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white hover:border-white/[0.12]"
                }`}
              >
                <span>{topic.emoji}</span>
                <span>{topic.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">Selecciona al menos 1 tema</p>
        </div>

        {/* Frequency */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-white/80 mb-3">
            Frecuencia de envio
          </label>
          <div className="flex gap-2">
            {(["daily", "weekly"] as const).map((f) => (
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
        </div>

        {/* Custom prompt */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-white/80 mb-3">
            Personaliza tu newsletter (opcional)
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Ej: Me interesan mas las noticias de Mexico que de Silicon Valley"
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm resize-none"
          />
          <p className="text-xs text-slate-500 mt-1">{customPrompt.length}/500</p>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || selectedTopics.length === 0}
          className="w-full px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-sm hover:from-indigo-400 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Guardando..." : "Guardar preferencias"}
        </button>

        {success && (
          <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {success}
          </div>
        )}
        {error && data && (
          <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}

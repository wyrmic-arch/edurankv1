"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FileUp, X } from "lucide-react";
import { api, type Subject } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { PTS, Spinner } from "@/components/hud";
import { GRADES, POINTS_RULES } from "@edurank/shared";

export default function UploadPage() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [grade, setGrade] = useState<string>(user?.grade ? String(user.grade) : "");
  const [topic, setTopic] = useState("");
  const [pricing, setPricing] = useState<"free" | "paid">("free");
  const [pricePoints, setPricePoints] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.subjects().then((r) => setSubjects(r.items)).catch(() => setSubjects([]));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Attach your file first.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", title);
      form.append("description", description);
      form.append("subjectId", subjectId);
      form.append("grade", grade);
      form.append("topic", topic);
      form.append("pricing", pricing);
      if (pricing === "paid") form.append("pricePoints", String(pricePoints));
      await api.uploadNote(form);
      await refresh();
      router.push("/upload/success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  if (!user || subjects === null) return <Spinner label="OPENING THE DROP ZONE…" />;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="hud-label mb-1">DROP ZONE</div>
      <h1 className="font-display uppercase text-4xl mb-2">Submit a note</h1>
      <p className="text-mute text-sm mb-8">
        Approved uploads earn <PTS value={POINTS_RULES.UPLOAD_APPROVED} size="sm" /> instantly — plus{" "}
        <span className="font-mono text-volt">+10 PTS</span> every time someone downloads and a{" "}
        <span className="font-mono text-gold">50% cut</span> of any unlock price you set.
      </p>

      <form onSubmit={submit} className="space-y-5">
        {/* drop zone */}
        <label
          className={`block border border-dashed clip-hud p-8 text-center cursor-pointer transition-colors ${
            file ? "border-volt/60 bg-volt/5" : "border-line hover:border-ink/40 bg-surface-1"
          }`}
        >
          <input
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.docx,.pptx,.xlsx,.zip"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileUp className="w-5 h-5 text-volt" />
              <span className="font-mono text-sm">{file.name}</span>
              <button type="button" onClick={(e) => { e.preventDefault(); setFile(null); }} className="text-dim hover:text-blood">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <FileUp className="w-6 h-6 mx-auto text-dim mb-2" />
              <div className="font-display uppercase tracking-wider">Drop your file / click to browse</div>
              <div className="hud-label mt-1.5 !text-[9px]">PDF · IMAGES · DOCX · PPTX · XLSX · TXT · ZIP — MAX 20MB</div>
            </>
          )}
        </label>

        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} maxLength={120}
            placeholder="e.g. Quadratics Survival Guide" className="w-full px-3 py-2.5 clip-hud-sm" />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="District (subject)">
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required className="w-full px-3 py-2.5 clip-hud-sm">
              <option value="">—</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Grade">
            <select value={grade} onChange={(e) => setGrade(e.target.value)} required className="w-full px-3 py-2.5 clip-hud-sm">
              <option value="">—</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
          </Field>
          <Field label="Topic">
            <input value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={80}
              placeholder="e.g. Trigonometry" className="w-full px-3 py-2.5 clip-hud-sm" />
          </Field>
        </div>

        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} rows={3}
            placeholder="What's inside? Who is it for?" className="w-full px-3 py-2.5 clip-hud-sm resize-none" />
        </Field>

        {/* pricing */}
        <div className="panel p-4">
          <div className="hud-label mb-3">ACCESS PRICING</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPricing("free")}
              className={`clip-hud-sm border px-4 py-3 text-left transition-colors ${
                pricing === "free" ? "border-volt bg-volt/10" : "border-line hover:border-ink/30"
              }`}
            >
              <div className="font-display uppercase tracking-wider text-sm">Free</div>
              <div className="hud-label mt-1">MAX REACH · +10 PTS PER DOWNLOAD</div>
            </button>
            <button
              type="button"
              onClick={() => setPricing("paid")}
              className={`clip-hud-sm border px-4 py-3 text-left transition-colors ${
                pricing === "paid" ? "border-gold bg-gold/10" : "border-line hover:border-ink/30"
              }`}
            >
              <div className="font-display uppercase tracking-wider text-sm text-gold">Premium</div>
              <div className="hud-label mt-1">SET A PTS PRICE · YOU KEEP 50%</div>
            </button>
          </div>
          {pricing === "paid" && (
            <div className="mt-4 flex items-center gap-4">
              <input
                type="range" min={5} max={1000} step={5}
                value={pricePoints}
                onChange={(e) => setPricePoints(Number(e.target.value))}
                className="flex-1 accent-[#FFC24B]"
              />
              <PTS value={pricePoints} tone="gold" size="lg" />
            </div>
          )}
        </div>

        {error && <p className="text-blood text-sm border border-blood/40 bg-blood/5 px-3 py-2 clip-hud-sm">{error}</p>}

        <button disabled={busy} className="btn-volt w-full py-3.5 text-base">
          {busy ? "TRANSMITTING…" : "SEND FOR REVIEW"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="hud-label block mb-1.5">{label}</span>
      {children}
    </label>
  );
}

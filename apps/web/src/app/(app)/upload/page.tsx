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

  if (!user || subjects === null) return <Spinner label="OPENING THE UPLOAD DESK…" />;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="label">UPLOAD</div>
      <h1 className="font-serif text-5xl font-medium tracking-tight leading-none mt-1 mb-3">Submit a note.</h1>
      <p className="text-mute text-[14px] mb-10">
        Approved uploads earn <PTS value={POINTS_RULES.UPLOAD_APPROVED} size="sm" /> instantly — plus{" "}
        <span className="font-mono font-bold">+10 PTS</span> every time someone downloads and a{" "}
        <span className="font-mono font-bold">50% cut</span> of any unlock price you set.
      </p>

      <form onSubmit={submit} className="space-y-6">
        <label className={`block border border-dashed p-8 text-center cursor-pointer transition-colors ${file ? "border-mark bg-mark/5" : "border-ruleSoft hover:border-ink"}`}>
          <input
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.docx,.pptx,.xlsx,.zip"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileUp className="w-5 h-5" />
              <span className="font-mono text-[13px]">{file.name}</span>
              <button type="button" onClick={(e) => { e.preventDefault(); setFile(null); }} className="text-mute hover:text-mark">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <FileUp className="w-6 h-6 mx-auto text-dim mb-2" />
              <div className="font-medium">Drop your file / click to browse</div>
              <div className="label !text-[9px] mt-2">PDF · IMAGES · DOCX · PPTX · XLSX · TXT · ZIP — MAX 20MB</div>
            </>
          )}
        </label>

        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} maxLength={120}
            placeholder="e.g. Quadratics Survival Guide" className="w-full px-3 py-2.5" />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Subject">
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required className="w-full px-3 py-2.5">
              <option value="">—</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Grade">
            <select value={grade} onChange={(e) => setGrade(e.target.value)} required className="w-full px-3 py-2.5">
              <option value="">—</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
          </Field>
          <Field label="Topic">
            <input value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={80}
              placeholder="e.g. Trigonometry" className="w-full px-3 py-2.5" />
          </Field>
        </div>

        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} rows={3}
            placeholder="What's inside? Who is it for?" className="w-full px-3 py-2.5 resize-none" />
        </Field>

        <div className="panel p-5">
          <div className="label mb-4">ACCESS PRICING</div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPricing("free")}
              className={`border px-4 py-4 text-left transition-colors ${pricing === "free" ? "border-ink bg-ink text-paper" : "border-ruleSoft hover:border-ink"}`}
            >
              <div className="font-medium">Free</div>
              <div className="label !text-[9px] mt-1">MAX REACH · +10 PTS PER DOWNLOAD</div>
            </button>
            <button
              type="button"
              onClick={() => setPricing("paid")}
              className={`border px-4 py-4 text-left transition-colors ${pricing === "paid" ? "border-mark bg-mark/5" : "border-ruleSoft hover:border-ink"}`}
            >
              <div className="font-medium">Premium</div>
              <div className="label !text-[9px] mt-1">SET A PTS PRICE · YOU KEEP 50%</div>
            </button>
          </div>
          {pricing === "paid" && (
            <div className="mt-5 flex items-center gap-4">
              <input
                type="range" min={5} max={1000} step={5}
                value={pricePoints}
                onChange={(e) => setPricePoints(Number(e.target.value))}
                className="flex-1 accent-mark"
              />
              <PTS value={pricePoints} tone="mark" size="lg" />
            </div>
          )}
        </div>

        {error && <p className="text-mark text-[13px] border border-mark bg-mark/5 px-3 py-2">{error}</p>}

        <button disabled={busy} type="submit" className="btn-solid w-full py-4 text-base">
          {busy ? "TRANSMITTING…" : "SEND FOR REVIEW"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label block mb-2">{label}</span>
      {children}
    </label>
  );
}
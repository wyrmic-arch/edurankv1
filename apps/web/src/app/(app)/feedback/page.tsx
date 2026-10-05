"use client";

import { useEffect, useState } from "react";
import { Lightbulb, Send, Trash2 } from "lucide-react";
import type { SuggestionDTO, SuggestionCategory, SuggestionStatus } from "@edurank/shared";
import { SUGGESTION_CATEGORIES, SUGGESTION_STATUSES } from "@edurank/shared";
import { api } from "@/lib/api";
import { Spinner } from "@/components/hud";
import { timeAgo } from "@/lib/format";

const STATUS_STYLE: Record<SuggestionStatus, string> = {
  open: "border-cinder text-ghost",
  planned: "border-accent text-accent",
  done: "border-ash text-ash",
  declined: "border-cinder text-mute line-through",
};

export default function FeedbackPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<SuggestionCategory>("idea");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mine, setMine] = useState<SuggestionDTO[] | null>(null);

  function load() {
    api.mySuggestions().then((r) => setMine(r.items)).catch(() => setMine([]));
  }
  useEffect(load, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFlash(null);
    if (title.trim().length < 3 || body.trim().length < 10) {
      setError("Add a short title and a bit more detail.");
      return;
    }
    setBusy(true);
    try {
      await api.submitSuggestion({ title: title.trim(), body: body.trim(), category });
      setTitle("");
      setBody("");
      setCategory("idea");
      setFlash("Thanks — your idea is in. You'll see its status below.");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send that.");
    } finally {
      setBusy(false);
    }
  }

  async function withdraw(id: string) {
    try {
      await api.withdrawSuggestion(id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not withdraw.");
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <div className="label inline-flex items-center gap-2">
          <Lightbulb className="w-3.5 h-3.5 text-accent" /> FEEDBACK
        </div>
        <h1 className="font-serif text-5xl font-medium tracking-tight leading-none mt-1">Ideas &amp; improvements.</h1>
        <p className="text-ghost text-[15px] mt-4 max-w-xl">
          Got an idea to make EduRank better? Found something broken? Want a feature or note added?
          Tell us — you can track the status of everything you send.
        </p>
      </div>

      <form onSubmit={submit} className="panel p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {SUGGESTION_CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`font-mono text-[10px] uppercase tracking-label px-3 py-1.5 border transition-colors ${
                category === c.id ? "border-accent text-accent" : "border-cinder text-ghost hover:border-ash hover:text-ash"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="label block mb-2">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="e.g. Add a dark-mode toggle for the leaderboard"
            className="w-full px-3 py-2.5 text-[14px]"
          />
        </label>

        <label className="block">
          <span className="label block mb-2">Details</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            rows={5}
            placeholder="What would you change, and why? The more specific, the better."
            className="w-full px-3 py-2.5 text-[14px] resize-none"
          />
          <span className="label !text-[9px] mt-1 block">{body.length}/2000</span>
        </label>

        {error && <p className="text-[13px] border px-3 py-2 border-mark text-mark bg-mark/5">{error}</p>}
        {flash && <p className="text-[13px] border px-3 py-2 border-accent text-accent bg-accent/5">{flash}</p>}

        <button disabled={busy} type="submit" className="btn-mark !text-[11px] inline-flex items-center gap-2">
          <Send className="w-3.5 h-3.5" /> {busy ? "SENDING…" : "SUBMIT IDEA"}
        </button>
      </form>

      <div>
        <div className="label mb-4">YOUR SUBMISSIONS</div>
        {mine === null ? (
          <Spinner label="LOADING…" />
        ) : mine.length === 0 ? (
          <p className="text-mute text-[13px] py-8 text-center border border-dashed border-ruleSoft">
            Nothing yet. Your ideas will show up here with their status.
          </p>
        ) : (
          <ul className="panel divide-y divide-ruleSoft">
            {mine.map((s) => (
              <li key={s.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{s.title}</span>
                      <span className={`font-mono text-[9px] uppercase tracking-label border px-2 py-0.5 ${STATUS_STYLE[s.status]}`}>
                        {SUGGESTION_STATUSES[s.status]}
                      </span>
                    </div>
                    <p className="text-mute text-[13px] mt-1 whitespace-pre-wrap">{s.body}</p>
                    {s.adminNote && (
                      <p className="text-accent text-[12px] mt-1.5">Reply: {s.adminNote}</p>
                    )}
                    <div className="label !text-[9px] mt-1.5">{timeAgo(s.createdAt)}</div>
                  </div>
                  {s.status === "open" && (
                    <button onClick={() => void withdraw(s.id)} className="text-mute hover:text-mark" title="Withdraw">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

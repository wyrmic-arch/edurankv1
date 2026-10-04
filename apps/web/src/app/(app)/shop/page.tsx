"use client";

import { useEffect, useState } from "react";
import { Check, Frame as FrameIcon, Layers, Palette, ShoppingBag } from "lucide-react";
import { api, type ShopItemView } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { PTS, ErrorPanel, Spinner } from "@/components/hud";
import { Avatar } from "@/components/avatar";

const KINDS = [
  { key: "frame", label: "FRAMES", icon: FrameIcon },
  { key: "badge", label: "TITLES", icon: Palette },
  { key: "skin", label: "THEMES", icon: Layers },
] as const;

export default function ShopPage() {
  const { user, setUser, refresh } = useAuth();
  const [items, setItems] = useState<ShopItemView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<(typeof KINDS)[number]["key"]>("frame");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  function load() {
    api.shop().then((r) => { setItems(r.items); setError(null); }).catch((e) => setError(e.message));
  }
  useEffect(load, []);
  useEffect(() => {
    if (flash) {
      const id = setTimeout(() => setFlash(null), 4000);
      return () => clearTimeout(id);
    }
  }, [flash]);

  async function buy(item: ShopItemView) {
    setBusyId(item.id);
    setError(null);
    try {
      const res = await api.purchase(item.id);
      setUser((u) => (u ? { ...u, balance: res.balanceAfter } : u));
      setFlash(`"${item.name}" is yours. It auto-equipped.`);
      load();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Purchase failed");
    } finally {
      setBusyId(null);
    }
  }

  if (!user || items === null) return <Spinner label="ROLLING UP THE SHUTTERS…" />;

  const visible = items.filter((i) => i.kind === kind);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="label inline-flex items-center gap-2"><ShoppingBag className="w-3.5 h-3.5" /> THE SHOP · GEAR</div>
          <h1 className="font-serif text-5xl font-medium tracking-tight leading-none mt-1">The shop.</h1>
        </div>
        <div className="hairline px-5 py-3">
          <span className="label mr-3">WALLET</span>
          <PTS value={user.balance} size="lg" />
        </div>
      </div>

      <div className="rule" />

      {flash && (
        <div className="hairline border-cinder px-4 py-2.5 text-[13px] inline-flex items-center gap-2">
          <Check className="w-4 h-4" /> {flash}
        </div>
      )}
      {error && <ErrorPanel message={error} onRetry={load} />}

      <div className="flex gap-1">
        {KINDS.map((k) => (
          <button
            key={k.key}
            onClick={() => setKind(k.key)}
            className={`inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-label px-4 py-2 border transition-colors ${
              kind === k.key ? "border-ash bg-ash text-night" : "border-cinder text-ghost hover:border-ash hover:text-ash"
            }`}
          >
            <k.icon className="w-3.5 h-3.5" /> {k.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((item) => (
          <ItemCard key={item.id} item={item} busy={busyId === item.id} balance={user.balance} onBuy={() => void buy(item)} />
        ))}
      </div>

      {visible.length === 0 && <p className="text-mute text-[13px] py-8 text-center">Nothing stocked in this aisle yet.</p>}
    </div>
  );
}

function ItemCard({
  item,
  busy,
  balance,
  onBuy,
}: {
  item: ShopItemView;
  busy: boolean;
  balance: number;
  onBuy: () => void;
}) {
  const color = ((item.config?.accent ?? item.config?.color) as string) ?? "#0A0A0A";
  const afford = balance >= item.pricePoints;

  let preview: React.ReactNode;
  if (item.kind === "frame") {
    preview = <Avatar name="Preview One" frameColor={color} size={64} />;
  } else if (item.kind === "skin") {
    preview = (
      <div className="relative w-24 h-14 border overflow-hidden" style={{ borderColor: color }}>
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(to right,#D8D8D4 1px,transparent 1px),linear-gradient(to bottom,#D8D8D4 1px,transparent 1px)", backgroundSize: "12px 12px" }} />
        <div className="absolute bottom-1 left-2 right-6 h-px" style={{ background: color }} />
        <div className="absolute top-1 right-2 w-2 h-2 rotate-45" style={{ background: color }} />
      </div>
    );
  } else {
    preview = (
      <span
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-label px-3 py-1.5 border"
        style={{ color, borderColor: color }}
      >
        <Palette className="w-3.5 h-3.5" /> {item.name}
      </span>
    );
  }

  return (
    <div className={`panel p-5 flex flex-col gap-3 ${item.equipped ? "border-mark" : ""}`}>
      <div className="h-16 flex items-center">{preview}</div>
      <div>
        <div className="font-medium">{item.name}</div>
        <p className="text-mute text-[12px] mt-1 leading-relaxed">{item.description}</p>
      </div>
      <div className="mt-auto pt-2 flex items-center justify-between gap-2">
        <PTS value={item.pricePoints} />
        {item.owned ? (
          item.equipped ? (
            <span className="font-mono text-[10px] uppercase tracking-label border border-mark text-mark px-2 py-0.5 inline-flex items-center gap-1">
              <Check className="w-3 h-3" /> EQUIPPED
            </span>
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-label border border-ruleSoft text-mute px-2 py-0.5">OWNED</span>
          )
        ) : (
          <button onClick={onBuy} disabled={busy || !afford} className={afford ? "btn-solid" : "btn-ghost"}>
            {!afford ? `NEED ${item.pricePoints - balance} MORE` : busy ? "…" : "BUY"}
          </button>
        )}
      </div>
    </div>
  );
}
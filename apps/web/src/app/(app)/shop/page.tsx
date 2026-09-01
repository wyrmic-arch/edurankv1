"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Check, Frame as FrameIcon, Layers, Palette, ShoppingBag } from "lucide-react";
import { api, type ShopItemView } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { PTS, ErrorPanel, Spinner } from "@/components/hud";
import { Avatar } from "@/components/avatar";

const KINDS = [
  { key: "frame", label: "FRAMES", icon: FrameIcon },
  { key: "skin", label: "MAP SKINS", icon: Layers },
  { key: "badge", label: "TITLES", icon: Palette },
] as const;

export default function ShopPage() {
  const { user, setUser, refresh } = useAuth();
  const [items, setItems] = useState<ShopItemView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<(typeof KINDS)[number]["key"]>("frame");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  function load() {
    api.shop().then((r) => setItems(r.items)).catch((e) => setError(e.message));
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
      if (user) setUser({ ...user, balance: res.balanceAfter });
      setFlash(`"${item.name}" is yours. It auto-equipped — go flex.`);
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="hud-label mb-1 inline-flex items-center gap-2"><ShoppingBag className="w-3.5 h-3.5" /> AMMU-NOTES · GEAR</div>
          <h1 className="font-display uppercase text-4xl">The shop</h1>
        </div>
        <div className="border border-volt/30 bg-volt/5 clip-hud-sm px-4 py-2">
          <span className="hud-label mr-3">WALLET</span>
          <PTS value={user.balance} size="lg" />
        </div>
      </div>

      {flash && (
        <div className="border border-volt/40 bg-volt/5 clip-hud px-4 py-2.5 text-sm inline-flex items-center gap-2">
          <Check className="w-4 h-4 text-volt" /> {flash}
        </div>
      )}
      {error && <ErrorPanel message={error} onRetry={load} />}

      <div className="flex gap-1">
        {KINDS.map((k) => (
          <button
            key={k.key}
            onClick={() => setKind(k.key)}
            className={`inline-flex items-center gap-2 font-display uppercase tracking-wider text-xs px-4 py-2 border clip-hud-sm transition-colors ${
              kind === k.key ? "border-volt text-volt bg-volt/10" : "border-line text-mute hover:text-ink"
            }`}
          >
            <k.icon className="w-3.5 h-3.5" /> {k.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visible.map((item) => (
          <ItemCard key={item.id} item={item} busy={busyId === item.id} balance={user.balance} onBuy={() => void buy(item)} />
        ))}
      </div>

      {visible.length === 0 && <p className="text-mute text-sm py-8 text-center">Nothing stocked in this aisle yet.</p>}
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
  const color = (item.config?.color as string) ?? "#A6FF3F";
  const afford = balance >= item.pricePoints;

  let preview: React.ReactNode;
  if (item.kind === "frame") {
    preview = <Avatar name="Preview One" frameColor={color} size={64} />;
  } else if (item.kind === "skin") {
    preview = (
      <div className="relative w-24 h-14 border overflow-hidden" style={{ borderColor: color }}>
        <div className="absolute inset-0 bg-[#0A0E14]" style={{ backgroundImage: "linear-gradient(to right,#151C28 1px,transparent 1px),linear-gradient(to bottom,#151C28 1px,transparent 1px)", backgroundSize: "12px 12px" }} />
        <div className="absolute bottom-1 left-2 right-6 h-px" style={{ background: color }} />
        <div className="absolute top-1 right-2 w-2 h-2 rotate-45" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      </div>
    );
  } else {
    preview = (
      <span
        className="inline-flex items-center gap-2 font-mono text-xs tracking-hud uppercase px-3 py-1.5 border"
        style={{ color, borderColor: `${color}66`, background: `${color}11` }}
      >
        <BadgeCheck className="w-4 h-4" /> {item.name}
      </span>
    );
  }

  return (
    <div className={`panel p-5 flex flex-col gap-3 ${item.equipped ? "border-volt/50 shadow-glow-volt" : ""}`}>
      <div className="h-16 flex items-center">{preview}</div>
      <div>
        <div className="font-display uppercase tracking-wider">{item.name}</div>
        <p className="text-mute text-xs mt-1 leading-relaxed">{item.description}</p>
      </div>
      <div className="mt-auto pt-2 flex items-center justify-between gap-2">
        <PTS value={item.pricePoints} tone={item.kind === "skin" ? "gold" : "volt"} />
        {item.owned ? (
          item.equipped ? (
            <span className="chip border-volt/50 text-volt"><Check className="w-3 h-3" /> EQUIPPED</span>
          ) : (
            <span className="chip">OWNED · INVENTORY</span>
          )
        ) : (
          <button onClick={onBuy} disabled={busy || !afford} className={`${afford ? "btn-gold" : "btn-ghost"} !py-1.5 text-[10px]`}>
            {!afford ? `NEED ${item.pricePoints - balance} MORE` : busy ? "…" : "BUY"}
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Loader2,
  Navigation,
  Package,
  Search,
  UserRound,
} from "lucide-react";
import type { SearchHit, SearchResults } from "@/lib/search";

const GROUP_DEFS: { key: keyof SearchResults; label: string }[] = [
  { key: "pages", label: "Pages" },
  { key: "invoices", label: "Invoices" },
  { key: "clients", label: "Clients" },
  { key: "products", label: "Products" },
];

const TYPE_ICONS: Record<SearchHit["type"], typeof FileText> = {
  page: Navigation,
  invoice: FileText,
  client: UserRound,
  product: Package,
};

function ResultItem({
  hit,
  onSelect,
}: {
  hit: SearchHit;
  onSelect: () => void;
}) {
  const Icon = TYPE_ICONS[hit.type];
  return (
    <Link
      href={hit.href}
      onClick={onSelect}
      className="flex items-start gap-3 rounded-md px-3 py-2 hover:bg-accent"
    >
      <Icon size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-foreground">
          {hit.title}
        </span>
        {hit.subtitle ? (
          <span className="truncate text-xs text-muted-foreground">
            {hit.subtitle}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

export function GlobalSearch() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const query = q.trim();

  useEffect(() => {
    if (!query) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (cancelled) return;
        if (!res.ok) throw new Error(`search returned ${res.status}`);
        const data = (await res.json()) as SearchResults;
        setResults(data);
        setFailed(false);
      } catch (err) {
        if (!cancelled) {
          console.error("[search] request failed:", err);
          setResults(null);
          setFailed(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const showDropdown = open && query.length > 0;
  const visibleGroups =
    results && GROUP_DEFS.filter((g) => (results[g.key]?.length ?? 0) > 0);

  return (
    <div ref={wrapRef} className="paper-search relative">
      <div className="paper-search-group">
        <Search className="paper-search-icon" size={16} />
        <input
          type="text"
          className="paper-search-input"
          placeholder="Search…"
          aria-label="Search"
          value={q}
          onChange={(e) => {
            const value = e.target.value;
            setQ(value);
            setOpen(true);
            if (!value.trim()) {
              setResults(null);
              setLoading(false);
              setFailed(false);
            } else {
              setLoading(true);
            }
          }}
          onFocus={() => setOpen(true)}
        />
      </div>
      {showDropdown ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-xl">
          <div className="max-h-[min(60vh,24rem)] overflow-y-auto p-1.5">
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                <Loader2 size={14} className="animate-spin" />
                Searching…
              </div>
            ) : failed ? (
              <p className="px-3 py-3 text-sm text-muted-foreground">
                Search failed. Try again.
              </p>
            ) : visibleGroups && visibleGroups.length > 0 ? (
              visibleGroups.map((g) => (
                <div key={g.key}>
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {g.label}
                  </p>
                  {results![g.key].map((hit) => (
                    <ResultItem
                      key={hit.objectID}
                      hit={hit}
                      onSelect={() => {
                        setOpen(false);
                        setQ("");
                      }}
                    />
                  ))}
                </div>
              ))
            ) : (
              <p className="px-3 py-3 text-sm text-muted-foreground">
                No results for “{query}”
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

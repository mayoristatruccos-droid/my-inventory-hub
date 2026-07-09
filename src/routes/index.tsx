import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Package, X, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/use-products";
import { formatCOP, productsStore, type Product } from "@/lib/products-store";
import { AddProductDialog } from "@/components/add-product-dialog";

const RECENT_KEY = "bodega.recentSearches.v1";
const RECENT_MAX = 8;

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function formatInventoryDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const day = d.getDate();
  const month = MESES[d.getMonth()];
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day} de ${month} de ${year} — ${hh}:${mm}`;
}


function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    /* noop */
  }
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Colombia Moda — Buscar referencias" },
      {
        name: "description",
        content:
          "Busca una o varias referencias de tu bodega por código, descripción o SKU y consulta precios mayorista y detal.",
      },
      { property: "og:title", content: "Colombia Moda — Buscar referencias" },
      {
        property: "og:description",
        content:
          "Busca una o varias referencias de tu bodega por código, descripción o SKU y consulta precios mayorista y detal.",
      },
    ],
  }),
  component: Index,
});

function parseTerms(input: string): string[] {
  return input
    .split(/[\s,;\n]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function matchesTerm(p: Product, term: string): boolean {
  const t = term.toLowerCase();
  return (
    p.reference.toLowerCase().includes(t) ||
    p.description.toLowerCase().includes(t) ||
    p.variants.some((v) => v.sku.toLowerCase().includes(t))
  );
}

function Index() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const { items, ready } = useProducts();
  const navigate = useNavigate();

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  const terms = useMemo(() => parseTerms(submitted), [submitted]);

  const results = useMemo(() => {
    if (terms.length === 0) return items;
    const seen = new Set<string>();
    const out: Product[] = [];
    for (const term of terms) {
      for (const p of items) {
        if (!seen.has(p.id) && matchesTerm(p, term)) {
          seen.add(p.id);
          out.push(p);
        }
      }
    }
    return out;
  }, [items, terms]);

  const notFound = useMemo(
    () => terms.filter((t) => !items.some((p) => matchesTerm(p, t))),
    [items, terms],
  );

  const pushRecent = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setRecent((prev) => {
      const next = [trimmed, ...prev.filter((x) => x !== trimmed)].slice(
        0,
        RECENT_MAX,
      );
      saveRecent(next);
      return next;
    });
  };

  const runSearch = (raw?: string) => {
    const value = raw ?? query;
    const parsed = parseTerms(value);
    setSubmitted(value);
    if (raw !== undefined) setQuery(value);
    pushRecent(value);
    if (parsed.length === 1) {
      const exact = items.find(
        (p) =>
          p.reference.toLowerCase() === parsed[0].toLowerCase() ||
          p.variants.some(
            (v) => v.sku.toLowerCase() === parsed[0].toLowerCase(),
          ),
      );
      if (exact) {
        navigate({ to: "/producto/$id", params: { id: exact.id } });
      }
    }
  };

  const clearSearch = () => {
    setQuery("");
    setSubmitted("");
  };

  const removeRecent = (value: string) => {
    setRecent((prev) => {
      const next = prev.filter((x) => x !== value);
      saveRecent(next);
      return next;
    });
  };

  const clearRecent = () => {
    setRecent([]);
    saveRecent([]);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10">
        <header className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-none">Bodega</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Buscador de referencias
            </p>
          </div>
        </header>

        <form
          className="flex flex-col items-stretch gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            runSearch();
          }}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
            <textarea
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  runSearch();
                }
              }}
              placeholder="Busca una o varias referencias, SKUs o descripciones. Sepáralas con coma, espacio o Enter…"
              rows={2}
              className="min-h-14 w-full resize-y rounded-2xl border border-border bg-card px-12 py-4 text-base shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            {(query || submitted) && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="lg" className="h-12 flex-1 rounded-2xl">
              <Search className="mr-2 h-4 w-4" />
              Buscar {terms.length > 1 ? `(${terms.length})` : ""}
            </Button>
            {(query || submitted) && (
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={clearSearch}
                className="h-12 rounded-2xl"
                aria-label="Limpiar"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              size="lg"
              variant="secondary"
              onClick={() => setOpen(true)}
              className="h-12 rounded-2xl"
              aria-label="Agregar referencia"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {!submitted && recent.length > 0 && (
          <section className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Búsquedas recientes
              </div>
              <button
                type="button"
                onClick={clearRecent}
                className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <Trash2 className="h-3 w-3" />
                Limpiar
              </button>
            </div>
            <ul className="flex flex-wrap gap-2">
              {recent.map((r) => (
                <li key={r}>
                  <div className="group flex items-center gap-1 rounded-full border border-border bg-card pl-3 pr-1 py-1 text-xs">
                    <button
                      type="button"
                      onClick={() => runSearch(r)}
                      className="max-w-[200px] truncate text-left transition-colors hover:text-primary"
                      title={r}
                    >
                      {r}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRecent(r)}
                      aria-label={`Eliminar ${r}`}
                      className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-8 flex-1">
          {ready && items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Aún no tienes referencias. Agrega la primera para empezar.
              </p>
            </div>
          ) : (
            <>
              {submitted && (
                <p className="mb-3 text-xs text-muted-foreground">
                  {results.length} resultado
                  {results.length === 1 ? "" : "s"}
                  {terms.length > 1 ? ` para ${terms.length} búsquedas` : ""}
                </p>
              )}

              <ul className="flex flex-col gap-2">
                {results.map((p) => {
                  const stock = productsStore.totalStock(p);
                  return (
                    <li key={p.id}>
                      <Link
                        to="/producto/$id"
                        params={{ id: p.id }}
                        className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3 transition-colors hover:bg-accent"
                      >
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.description}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <Package className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {p.description}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {p.reference} · {stock} und
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs tabular-nums">
                            <span>
                              <span className="text-muted-foreground">
                                May.{" "}
                              </span>
                              <span className="font-medium">
                                {formatCOP(p.wholesalePrice)}
                              </span>
                            </span>
                            <span>
                              <span className="text-muted-foreground">
                                Detal{" "}
                              </span>
                              <span className="font-semibold">
                                {formatCOP(p.retailPrice)}
                              </span>
                            </span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {ready && submitted && results.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10 text-center text-sm text-muted-foreground">
                  Sin resultados.
                </div>
              )}

              {notFound.length > 0 && results.length > 0 && (
                <div className="mt-4 rounded-2xl border border-dashed border-border bg-card/50 px-4 py-3 text-xs text-muted-foreground">
                  Sin coincidencia para:{" "}
                  <span className="font-medium text-foreground">
                    {notFound.join(", ")}
                  </span>
                </div>
              )}
            </>
          )}
        </section>

        <footer className="mt-10 border-t border-border pt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Última actualización del inventario
          </p>
          <p className="mt-1 text-xs font-medium text-foreground">
            {formatInventoryDate(__INVENTORY_UPDATED_AT__)}
          </p>
        </footer>
      </div>


      <AddProductDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={(p) => {
          setOpen(false);
          navigate({ to: "/producto/$id", params: { id: p.id } });
        }}
        onSubmit={(data) => productsStore.add(data)}
      />
    </main>
  );
}

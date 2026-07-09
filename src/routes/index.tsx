import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Package, X, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/use-products";
import { formatCOP, productsStore, type Product } from "@/lib/products-store";
import { AddProductDialog } from "@/components/add-product-dialog";
import { ProductDetails } from "@/components/product-details";


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

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  const { items, ready } = useProducts();


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


  const runSearch = (raw?: string) => {
    const value = raw ?? query;
    const parsed = parseTerms(value);
    setSubmitted(value);
    setSelectedProductId(null);
    if (raw !== undefined) setQuery(value);

    
    if (parsed.length === 1) {
      const exact = items.find(
        (p) =>
          p.reference.toLowerCase() === parsed[0].toLowerCase() ||
          p.variants.some(
            (v) => v.sku.toLowerCase() === parsed[0].toLowerCase(),
          ),
      );
      if (exact) {
        setSelectedProductId(exact.id);
      }
    }
  };

  const clearSearch = () => {
    setQuery("");
    setSubmitted("");
    setSelectedProductId(null);
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

          </div>
        </form>


        <section className="mt-8 flex-1">
          {ready && items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Aún no tienes referencias. Agrega la primera para empezar.
              </p>
            </div>
          ) : selectedProductId ? (
            <ProductDetails
              productId={selectedProductId}
              onClose={() => setSelectedProductId(null)}
            />
          ) : (
            <>

              <ul className="flex flex-col gap-2">
                {results.map((p) => {
                  const stock = productsStore.totalStock(p);
                  return (
                    <li key={p.id}>
                      <button
                        onClick={() => setSelectedProductId(p.id)}
                        className="w-full text-left flex items-center gap-4 rounded-2xl border border-border bg-card p-3 transition-colors hover:bg-accent"
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
                      </button>
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
          setSelectedProductId(p.id);
        }}
        onSubmit={(data) => productsStore.add(data)}
      />
    </main>
  );
}

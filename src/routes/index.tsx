import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/use-products";
import { formatCOP, productsStore } from "@/lib/products-store";
import { AddProductDialog } from "@/components/add-product-dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bodega — Buscar referencias" },
      {
        name: "description",
        content:
          "Busca referencias de tu bodega por código, descripción o SKU. Consulta precios y stock por talla y color.",
      },
      { property: "og:title", content: "Bodega — Buscar referencias" },
      {
        property: "og:description",
        content: "Buscador de referencias de bodega con precios y stock.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { items, ready } = useProducts();
  const navigate = useNavigate();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (p) =>
        p.reference.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.variants.some((v) => v.sku.toLowerCase().includes(q)),
    );
  }, [items, query]);

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

        <div className="flex flex-col items-stretch gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por referencia, descripción o SKU…"
              className="h-14 rounded-2xl border-border bg-card pl-12 pr-4 text-base shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button
            size="lg"
            onClick={() => setOpen(true)}
            className="h-12 rounded-2xl"
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar referencia
          </Button>
        </div>

        <section className="mt-8 flex-1">
          {ready && items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Aún no tienes referencias. Agrega la primera para empezar.
              </p>
            </div>
          ) : (
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
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
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
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatCOP(p.retailPrice)}
                        </p>
                        <p className="text-xs text-muted-foreground">detal</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
              {ready && results.length === 0 && query && (
                <li className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10 text-center text-sm text-muted-foreground">
                  Sin resultados para “{query}”.
                </li>
              )}
            </ul>
          )}
        </section>
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

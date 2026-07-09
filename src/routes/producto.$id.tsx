import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Package, Warehouse } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProduct } from "@/hooks/use-products";
import { formatCOP, productsStore } from "@/lib/products-store";

export const Route = createFileRoute("/producto/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Referencia ${params.id} — Bodega` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProductView,
});

function ProductView() {
  const { id } = Route.useParams();
  const { product, ready } = useProduct(id);


  const grouped = useMemo(() => {
    if (!product) return { sizes: [] as string[], colors: [] as string[], matrix: {} as Record<string, Record<string, number>> };
    const sizes = Array.from(new Set(product.variants.map((v) => v.size)));
    const colors = Array.from(new Set(product.variants.map((v) => v.color)));
    // Sort sizes numerically when possible
    sizes.sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
    colors.sort((a, b) => a.localeCompare(b));
    const matrix: Record<string, Record<string, number>> = {};
    for (const c of colors) {
      matrix[c] = {};
      for (const s of sizes) matrix[c][s] = 0;
    }
    for (const v of product.variants) {
      matrix[v.color][v.size] = (matrix[v.color][v.size] ?? 0) + v.stock;
    }
    return { sizes, colors, matrix };
  }, [product]);

  if (ready && !product) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No encontramos esta referencia.
          </p>
          <Button asChild className="mt-6" variant="secondary">
            <Link to="/">Volver al buscador</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (!product) return null;

  const totalStock = productsStore.totalStock(product);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEdit(true)}
              aria-label="Editar"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              aria-label="Eliminar"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <article className="flex flex-col gap-6">
          <div className="aspect-square w-full overflow-hidden rounded-3xl border border-border bg-muted">
            {product.image ? (
              <img
                src={product.image}
                alt={product.description}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <Package className="h-14 w-14" />
              </div>
            )}
          </div>

          <header>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {product.reference}
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-foreground">
              {product.description}
            </h1>
            {product.warehouse && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Warehouse className="h-3.5 w-3.5" />
                {product.warehouse}
              </p>
            )}
          </header>

          <div className="grid grid-cols-2 gap-3">
            <PriceCard
              label="Precio mayorista"
              value={formatCOP(product.wholesalePrice)}
              variant="muted"
            />
            <PriceCard
              label="Precio detal"
              value={formatCOP(product.retailPrice)}
              variant="primary"
            />
          </div>

          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold">Existencias</h2>
              <Badge variant="secondary" className="rounded-full">
                {totalStock} und en total
              </Badge>
            </div>

            {product.variants.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 px-4 py-8 text-center text-sm text-muted-foreground">
                Esta referencia aún no tiene variantes cargadas.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-3 py-2 text-left font-medium">
                          Color
                        </th>
                        {grouped.sizes.map((s) => (
                          <th
                            key={s}
                            className="px-3 py-2 text-center font-medium"
                          >
                            T {s}
                          </th>
                        ))}
                        <th className="px-3 py-2 text-right font-medium">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {grouped.colors.map((c) => {
                        const row = grouped.matrix[c];
                        const total = Object.values(row).reduce(
                          (a, b) => a + b,
                          0,
                        );
                        return (
                          <tr
                            key={c}
                            className="border-b border-border last:border-0"
                          >
                            <td className="px-3 py-2.5 font-medium capitalize">
                              {c.toLowerCase()}
                            </td>
                            {grouped.sizes.map((s) => (
                              <td
                                key={s}
                                className={
                                  "px-3 py-2.5 text-center tabular-nums " +
                                  (row[s] === 0
                                    ? "text-muted-foreground/50"
                                    : "text-foreground")
                                }
                              >
                                {row[s] || "—"}
                              </td>
                            ))}
                            <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                              {total}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {product.variants.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold">SKUs</h2>
              <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {product.variants.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs">{v.sku}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        T {v.size} · <span className="capitalize">{v.color.toLowerCase()}</span>
                      </p>
                    </div>
                    <Badge
                      variant={v.stock > 0 ? "default" : "outline"}
                      className="rounded-full tabular-nums"
                    >
                      {v.stock} und
                    </Badge>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </div>

      <AddProductDialog
        open={edit}
        onOpenChange={setEdit}
        initial={product}
        onSubmit={(data) => {
          productsStore.update(product.id, data);
          return { ...product, ...data };
        }}
        onCreated={() => setEdit(false)}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta referencia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                productsStore.remove(product.id);
                navigate({ to: "/" });
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function PriceCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: "muted" | "primary";
}) {
  const isPrimary = variant === "primary";
  return (
    <div
      className={
        "rounded-2xl border p-4 " +
        (isPrimary
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-border bg-card")
      }
    >
      <p
        className={
          "text-xs " +
          (isPrimary ? "text-primary-foreground/80" : "text-muted-foreground")
        }
      >
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

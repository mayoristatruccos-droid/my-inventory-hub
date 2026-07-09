import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Package, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useProduct } from "@/hooks/use-products";
import { formatCOP, productsStore } from "@/lib/products-store";
import { AddProductDialog } from "@/components/add-product-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/producto/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Referencia ${params.id.slice(0, 6)} — Bodega` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProductView,
});

function ProductView() {
  const { id } = Route.useParams();
  const { product, ready } = useProduct(id);
  const [edit, setEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const navigate = useNavigate();

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
                alt={product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <Package className="h-14 w-14" />
              </div>
            )}
          </div>

          <header>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              SKU {product.sku}
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-foreground">
              {product.title}
            </h1>
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
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

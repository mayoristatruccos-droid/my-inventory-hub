import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Product } from "@/lib/products-store";

type Payload = Omit<Product, "id" | "createdAt">;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Payload) => Product;
  onCreated: (p: Product) => void;
  initial?: Product;
};

export function AddProductDialog({
  open,
  onOpenChange,
  onSubmit,
  onCreated,
  initial,
}: Props) {
  const [title, setTitle] = useState("");
  const [sku, setSku] = useState("");
  const [image, setImage] = useState("");
  const [wholesale, setWholesale] = useState("");
  const [retail, setRetail] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setSku(initial?.sku ?? "");
      setImage(initial?.image ?? "");
      setWholesale(initial ? String(initial.wholesalePrice) : "");
      setRetail(initial ? String(initial.retailPrice) : "");
    }
  }, [open, initial]);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !sku.trim()) return;
    const created = onSubmit({
      title: title.trim(),
      sku: sku.trim(),
      image,
      wholesalePrice: Number(wholesale) || 0,
      retailPrice: Number(retail) || 0,
    });
    onCreated(created);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Editar referencia" : "Nueva referencia"}
          </DialogTitle>
          <DialogDescription>
            Registra los datos del producto de tu bodega.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label className="mb-2 block">Imagen</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            {image ? (
              <div className="relative overflow-hidden rounded-xl border border-border">
                <img
                  src={image}
                  alt="Vista previa"
                  className="h-40 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImage("")}
                  className="absolute right-2 top-2 rounded-full bg-background/90 p-1 text-foreground shadow-sm"
                  aria-label="Quitar imagen"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground transition hover:bg-muted"
              >
                <ImagePlus className="h-6 w-6" />
                <span className="text-sm">Subir imagen</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Camiseta básica negra"
                required
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="sku">Código / SKU</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ej. CAM-001"
                required
              />
            </div>
            <div>
              <Label htmlFor="wholesale">Precio mayorista</Label>
              <Input
                id="wholesale"
                inputMode="numeric"
                value={wholesale}
                onChange={(e) =>
                  setWholesale(e.target.value.replace(/[^\d]/g, ""))
                }
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="retail">Precio detal</Label>
              <Input
                id="retail"
                inputMode="numeric"
                value={retail}
                onChange={(e) =>
                  setRetail(e.target.value.replace(/[^\d]/g, ""))
                }
                placeholder="0"
              />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {initial ? "Guardar cambios" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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

type Payload = Omit<Product, "id" | "createdAt" | "variants">;

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
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [image, setImage] = useState("");
  const [wholesale, setWholesale] = useState("");
  const [retail, setRetail] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setReference(initial?.reference ?? "");
      setDescription(initial?.description ?? "");
      setWarehouse(initial?.warehouse ?? "");
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
    if (!reference.trim() || !description.trim()) return;
    const created = onSubmit({
      reference: reference.trim(),
      description: description.trim(),
      warehouse: warehouse.trim(),
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
              <Label htmlFor="reference">Referencia</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ej. B01020061"
                disabled={!!initial}
                required
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. BERMUDA CARGO"
                required
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="warehouse">Bodega</Label>
              <Input
                id="warehouse"
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                placeholder="Ej. PRINCIPAL 1004"
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

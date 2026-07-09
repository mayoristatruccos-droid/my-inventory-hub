import seedCsv from "@/data/seed.csv?raw";

export type Variant = {
  id: string;
  size: string;
  color: string;
  colorCode: string;
  sku: string;
  stock: number;
};

export type Product = {
  id: string; // reference code
  reference: string;
  description: string;
  warehouse: string;
  image: string;
  wholesalePrice: number;
  retailPrice: number;
  variants: Variant[];
  createdAt: number;
};

const KEY = "bodega.products.v2";

function parseCsv(csv: string): Product[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = lines.shift();
  if (!header) return [];
  const map = new Map<string, Product>();
  for (const line of lines) {
    // Simple CSV split — no quoted commas in seed
    const cols = line.split(",").map((c) => c.trim());
    const [
      reference,
      warehouse,
      description,
      ,
      color,
      saldo,
      talla,
      codColor,
      sku,
      pvm,
      pvp,
    ] = cols;
    if (!reference) continue;
    let p = map.get(reference);
    if (!p) {
      p = {
        id: reference,
        reference,
        description,
        warehouse,
        image: "",
        wholesalePrice: Number(pvm) || 0,
        retailPrice: Number(pvp) || 0,
        variants: [],
        createdAt: Date.now(),
      };
      map.set(reference, p);
    }
    p.variants.push({
      id: sku || `${reference}-${talla}-${codColor}`,
      size: talla,
      color,
      colorCode: codColor,
      sku,
      stock: Number(saldo) || 0,
    });
  }
  return [...map.values()];
}

function read(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Product[];
    const seeded = parseCsv(seedCsv);
    window.localStorage.setItem(KEY, JSON.stringify(seeded));
    return seeded;
  } catch {
    return [];
  }
}

function write(items: Product[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("products:changed"));
}

export const productsStore = {
  list(): Product[] {
    return read().sort((a, b) => a.reference.localeCompare(b.reference));
  },
  get(id: string): Product | undefined {
    return read().find((p) => p.id === id);
  },
  search(query: string): Product[] {
    const q = query.trim().toLowerCase();
    const all = this.list();
    if (!q) return all;
    return all.filter(
      (p) =>
        p.reference.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.variants.some((v) => v.sku.toLowerCase().includes(q)),
    );
  },
  add(
    input: Omit<Product, "id" | "createdAt" | "variants"> & {
      variants?: Variant[];
    },
  ): Product {
    const item: Product = {
      ...input,
      id: input.reference,
      variants: input.variants ?? [],
      createdAt: Date.now(),
    };
    const items = read().filter((p) => p.id !== item.id);
    write([item, ...items]);
    return item;
  },
  update(id: string, patch: Partial<Omit<Product, "id" | "createdAt">>) {
    const items = read().map((p) => (p.id === id ? { ...p, ...patch } : p));
    write(items);
  },
  remove(id: string) {
    write(read().filter((p) => p.id !== id));
  },
  totalStock(p: Product): number {
    return p.variants.reduce((s, v) => s + v.stock, 0);
  },
};

export function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

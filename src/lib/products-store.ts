export type Product = {
  id: string;
  sku: string;
  title: string;
  image: string; // data URL or empty
  wholesalePrice: number;
  retailPrice: number;
  createdAt: number;
};

const KEY = "bodega.products.v1";

function read(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Product[]) : [];
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
    return read().sort((a, b) => b.createdAt - a.createdAt);
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
        p.title.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q),
    );
  },
  add(input: Omit<Product, "id" | "createdAt">): Product {
    const item: Product = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    write([item, ...read()]);
    return item;
  },
  update(id: string, patch: Partial<Omit<Product, "id" | "createdAt">>) {
    const items = read().map((p) => (p.id === id ? { ...p, ...patch } : p));
    write(items);
  },
  remove(id: string) {
    write(read().filter((p) => p.id !== id));
  },
};

export function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

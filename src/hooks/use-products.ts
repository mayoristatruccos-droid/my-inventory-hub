import { useEffect, useState } from "react";
import { productsStore, type Product } from "@/lib/products-store";

export function useProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const refresh = () => setItems(productsStore.list());
    refresh();
    setReady(true);
    const onChange = () => refresh();
    window.addEventListener("products:changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("products:changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return { items, ready };
}

export function useProduct(id: string) {
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const refresh = () => setProduct(productsStore.get(id));
    refresh();
    setReady(true);
    const onChange = () => refresh();
    window.addEventListener("products:changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("products:changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [id]);

  return { product, ready };
}

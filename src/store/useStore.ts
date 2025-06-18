import { create } from "zustand";
import { Product, Filter } from "@/types/product";
import initialData from "../data/store.json";
import { persist } from "zustand/middleware";

interface StoreState {
  products: Product[];
  cart: { product: Product; quantity: number }[];
  filters: Filter;
  setProducts: (products: Product[]) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  setFilters: (filters: Filter) => void;
  clearCart: () => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  checkExpiredProducts: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      products: initialData.products || [],
      cart: [],
      filters: {
        search: undefined,
        category: undefined,
        subcategory: undefined,
        brand: undefined,
        color: undefined,
        size: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        supplier: undefined,
        sortBy: undefined,
      },
      setProducts: (products) => set({ products }),
      addToCart: (product, quantity = 1) =>
        set((state) => {
          const existingItem = state.cart.find(
            (item) => item.product.id === product.id
          );

          if (existingItem) {
            return {
              cart: state.cart.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }

          return {
            cart: [...state.cart, { product, quantity }],
          };
        }),
      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.product.id !== productId),
        })),
      updateCartItemQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              cart: state.cart.filter((item) => item.product.id !== productId),
            };
          }
          return {
            cart: state.cart.map((item) =>
              item.product.id === productId ? { ...item, quantity } : item
            ),
          };
        }),
      setFilters: (filters) => set({ filters }),
      clearCart: () => set({ cart: [] }),
      addProduct: (product) => {
        const products = get().products;
        set({ products: [...products, product] });
      },
      updateProduct: (updatedProduct) => {
        const products = get().products;
        set({
          products: products.map((p) =>
            p.id === updatedProduct.id ? updatedProduct : p
          ),
        });
      },
      deleteProduct: (productId) => {
        const products = get().products;
        set({
          products: products.filter((p) => p.id !== productId),
        });
      },
      checkExpiredProducts: () => {
        const products = get().products;
        const now = new Date();
        const updatedProducts = products.map((product) => {
          if (
            product.expirationDate &&
            new Date(product.expirationDate) < now &&
            !product.isArchived
          ) {
            return { ...product, isArchived: true };
          }
          return product;
        });
        set({ products: updatedProducts });
      },
    }),
    {
      name: "shop-storage",
      partialize: (state) => ({
        cart: state.cart,
      }),
    }
  )
);

// Check for expired products every minute
setInterval(() => {
  useStore.getState().checkExpiredProducts();
}, 60000);

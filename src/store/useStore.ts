import { create } from "zustand";
import { Product, Filter } from "@/types/product";
import initialData from "../data/store.json";
import { persist } from "zustand/middleware";

interface CartItem {
  productId: string;
  quantity: number;
  selectedSize?: string;
  selectedExtra?: string;
}

interface StoreState {
  products: Product[];
  cart: CartItem[];
  filters: Filter;
  setProducts: (products: Product[]) => void;
  addToCart: (
    product: Product,
    quantity?: number,
    selectedSize?: string,
    selectedExtra?: string
  ) => void;
  removeFromCart: (productId: string) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  setFilters: (filters: Filter) => void;
  clearCart: () => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  checkExpiredProducts: () => void;
  updateCartItemOptions: (
    productId: string,
    selectedSize?: string,
    selectedExtra?: string
  ) => void;
  refreshProducts: () => void;
}

// Function to load products from store.json
const loadProductsFromFile = (): Product[] => {
  try {
    return initialData.products || [];
  } catch (error) {
    console.error("Error loading products from store.json:", error);
    return [];
  }
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      products: loadProductsFromFile(),
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
      addToCart: (product, quantity = 1, selectedSize, selectedExtra) =>
        set((state) => {
          const existingItem = state.cart.find(
            (cartItem) =>
              cartItem.productId === product.id &&
              cartItem.selectedSize === selectedSize &&
              cartItem.selectedExtra === selectedExtra
          );

          if (existingItem) {
            return {
              cart: state.cart.map((cartItem) =>
                cartItem.productId === product.id &&
                cartItem.selectedSize === selectedSize &&
                cartItem.selectedExtra === selectedExtra
                  ? { ...cartItem, quantity: cartItem.quantity + quantity }
                  : cartItem
              ),
            };
          }

          return {
            cart: [
              ...state.cart,
              { productId: product.id, quantity, selectedSize, selectedExtra },
            ],
          };
        }),
      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.productId !== productId),
        })),
      updateCartItemQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              cart: state.cart.filter((item) => item.productId !== productId),
            };
          }
          return {
            cart: state.cart.map((item) =>
              item.productId === productId ? { ...item, quantity } : item
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
      updateCartItemOptions: (
        productId: string,
        selectedSize?: string,
        selectedExtra?: string
      ) =>
        set((state) => {
          const item = state.cart.find((i) => i.productId === productId);
          if (!item) return {};
          if (
            item.selectedSize === selectedSize &&
            item.selectedExtra === selectedExtra
          )
            return {};
          const newCart = state.cart.filter((i) => i.productId !== productId);
          newCart.push({
            ...item,
            selectedSize,
            selectedExtra,
          });
          return { cart: newCart };
        }),
      refreshProducts: () => {
        const freshProducts = loadProductsFromFile();
        set((state) => ({
          products: freshProducts,
          cart: state.cart.filter((item) =>
            freshProducts.some((p) => p.id === item.productId)
          ),
        }));
      },
    }),
    {
      name: "shop-storage",
      partialize: (state) => ({
        cart: state.cart,
        filters: state.filters,
      }),
    }
  )
);

// Check for expired products every minute
setInterval(() => {
  useStore.getState().checkExpiredProducts();
}, 60000);

// Refresh products from file every 5 minutes
setInterval(() => {
  useStore.getState().refreshProducts();
}, 300000);

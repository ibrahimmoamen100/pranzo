import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "@/store/useStore";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Topbar } from "@/components/Topbar";
import { ProductCard } from "@/components/ProductCard";
import { ProductFilters } from "@/components/ProductFilters";
import { ProductModal } from "@/components/ProductModal";
import { Product } from "@/types/product";
import Footer from "@/components/Footer";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { ProductSearch } from "@/components/ProductSearch";
import { DEFAULT_SUPPLIER } from "@/constants/supplier";

export default function Products() {
  const { t } = useTranslation();
  const products = useStore((state) => state.products);
  const filters = useStore((state) => state.filters);
  const setFilters = useStore((state) => state.setFilters);
  const refreshProducts = useStore((state) => state.refreshProducts);
  const [searchParams] = useSearchParams();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [openDrawer, setOpenDrawer] = useState(false);
  const productsPerPage = 12;

  // Refresh products from store.json when component mounts
  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  // Handle URL parameters on page load
  useEffect(() => {
    const category = searchParams.get("category");
    if (category) {
      setFilters({
        ...filters,
        category,
        subcategory: undefined,
        color: undefined,
        size: undefined,
      });
    } else if (
      window.location.pathname === "/products" &&
      !searchParams.toString()
    ) {
      setFilters({
        category: undefined,
        subcategory: undefined,
        color: undefined,
        size: undefined,
      });
    }
  }, [searchParams, setFilters]);

  // Get active products (non-archived)
  const activeProducts = useMemo(() => {
    return products?.filter((product) => !product.isArchived) || [];
  }, [products]);

  // Apply all filters
  const filteredProducts = useMemo(() => {
    return activeProducts.filter((product) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!product.name.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Category filter
      if (filters.category && product.category !== filters.category) {
        return false;
      }

      // Subcategory filter
      if (filters.subcategory && product.subcategory !== filters.subcategory) {
        return false;
      }

      // Price range filter
      if (filters.minPrice && product.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice && product.price > filters.maxPrice) {
        return false;
      }

      // Color filter
      if (filters.color) {
        const productColors =
          product.color?.split(",").map((c) => c.trim()) || [];
        if (!productColors.includes(filters.color)) {
          return false;
        }
      }

      // Size filter
      if (filters.size) {
        const productSizes =
          product.size?.split(",").map((s) => s.trim()) || [];
        if (!productSizes.includes(filters.size)) {
          return false;
        }
      }

      return true;
    });
  }, [activeProducts, filters]);

  // Apply sorting
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (filters.sortBy === "price-asc") {
        return a.price - b.price;
      } else if (filters.sortBy === "price-desc") {
        return b.price - a.price;
      } else if (filters.sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      } else if (filters.sortBy === "name-desc") {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });
  }, [filteredProducts, filters.sortBy]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = sortedProducts.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <Navbar />

      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">{t("products.title")}</h1>

        <div className="w-full mb-6">
          <ProductSearch
            value={filters.search || ""}
            onChange={(value) => setFilters({ ...filters, search: value })}
          />
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Mobile Filter Button */}
          <div className="md:hidden mb-4">
            <Drawer open={openDrawer} onOpenChange={setOpenDrawer}>
              <DrawerTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  {t("filters.title")}
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                  <DrawerHeader>
                    <DrawerTitle>{t("filters.title")}</DrawerTitle>
                  </DrawerHeader>
                  <div className="p-4 overflow-y-auto max-h-[80vh]">
                    <ProductFilters />
                  </div>
                  <DrawerFooter className="border-t">
                    <Button
                      variant="outline"
                      onClick={() => setOpenDrawer(false)}
                    >
                      {t("common.close")}
                    </Button>
                  </DrawerFooter>
                </div>
              </DrawerContent>
            </Drawer>
          </div>

          {/* Desktop Filters */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <ProductFilters />
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="mb-6">
              <p className="text-muted-foreground">
                {t("products.showing")} {startIndex + 1}-
                {Math.min(endIndex, sortedProducts.length)} {t("products.of")}{" "}
                {sortedProducts.length} {t("products.products")}
              </p>
            </div>

            {currentProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {t("products.noProductsFound")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onView={() => handleViewProduct(product)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(currentPage - 1)}
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(currentPage + 1)}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />

      <ProductModal
        product={selectedProduct}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}

import { useState, useMemo, useCallback } from "react";
import { useStore } from "@/store/useStore";
import { Product } from "@/types/product";
import { Navbar } from "@/components/Navbar";
import { Topbar } from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditProductModal } from "@/components/EditProductModal";
import { ProductSearch } from "@/components/ProductSearch";
import { ProductTable } from "@/components/ProductTable";
import { ProductForm } from "@/components/ProductForm";
import { AdminFilters } from "@/components/AdminFilters";
import { toast } from "sonner";
import { exportStoreToFile } from "@/utils/exportStore";
import {
  Download,
  Package,
  Tag,
  Percent,
  Timer,
  Building2,
  Calendar as CalendarIcon,
  ChevronDown,
  Filter,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { DEFAULT_SUPPLIER } from "@/constants/supplier";
import { Card } from "@/components/ui/card";

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [filters, setFilters] = useState({
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    category: undefined as string | undefined,
    supplier: undefined as string | undefined,
    isArchived: false,
    archivedStatus: "active" as "all" | "archived" | "active",
    specialOffer: "all" as "all" | "with-offer" | "without-offer",
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const { products, addProduct, deleteProduct, updateProduct } = useStore();

  // Get unique suppliers from products
  const uniqueSuppliers = useMemo(() => {
    const suppliers = new Set<string>();
    products?.forEach((product) => {
      if (product.wholesaleInfo?.supplierName) {
        suppliers.add(product.wholesaleInfo.supplierName);
      }
    });
    return Array.from(suppliers);
  }, [products]);

  // Memoize statistics calculations
  const statistics = useMemo(
    () => ({
      totalProducts: products?.length || 0,
      totalCategories: new Set(products?.map((p) => p.category)).size,
      totalSuppliers: uniqueSuppliers.length,
      productsWithOffers: products?.filter((p) => p.specialOffer).length || 0,
      archivedProducts: products?.filter((p) => p.isArchived).length || 0,
    }),
    [products, uniqueSuppliers]
  );

  const filterProductsByDate = (products: Product[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      today.getDate()
    );
    const yearAgo = new Date(
      today.getFullYear() - 1,
      today.getMonth(),
      today.getDate()
    );

    return products.filter((product) => {
      const productDate = new Date(product.createdAt || new Date());
      let matchesDate = true;

      if (dateRange?.from && dateRange?.to) {
        const startDate = new Date(dateRange.from);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateRange.to);
        endDate.setHours(23, 59, 59, 999);
        matchesDate = productDate >= startDate && productDate <= endDate;
      } else {
        switch (dateFilter) {
          case "today":
            matchesDate = productDate >= today;
            break;
          case "week":
            matchesDate = productDate >= weekAgo;
            break;
          case "month":
            matchesDate = productDate >= monthAgo;
            break;
          case "year":
            matchesDate = productDate >= yearAgo;
            break;
          default:
            matchesDate = true;
        }
      }

      const matchesPrice =
        (!filters.minPrice || product.price >= filters.minPrice) &&
        (!filters.maxPrice || product.price <= filters.maxPrice);

      const matchesCategory =
        !filters.category || product.category === filters.category;

      const matchesSupplier =
        !filters.supplier ||
        (filters.supplier === DEFAULT_SUPPLIER.name
          ? !product.wholesaleInfo?.supplierName
          : product.wholesaleInfo?.supplierName === filters.supplier);

      const matchesArchiveStatus =
        filters.archivedStatus === "all" ||
        (filters.archivedStatus === "archived" && product.isArchived) ||
        (filters.archivedStatus === "active" && !product.isArchived);

      const matchesSpecialOffer =
        filters.specialOffer === "all" ||
        (filters.specialOffer === "with-offer" && product.specialOffer) ||
        (filters.specialOffer === "without-offer" && !product.specialOffer);

      return (
        matchesDate &&
        matchesPrice &&
        matchesCategory &&
        matchesSupplier &&
        matchesArchiveStatus &&
        matchesSpecialOffer
      );
    });
  };

  const filteredProducts = filterProductsByDate(products);

  // Memoize handlers
  const handleLogin = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (password === "4508") {
        setIsAuthenticated(true);
      } else {
        toast.error("Invalid password");
      }
    },
    [password]
  );

  const handleExport = useCallback(() => {
    try {
      exportStoreToFile();
      toast.success("Store data exported successfully");
    } catch (error) {
      toast.error("Failed to export store data");
    }
  }, []);

  const handleEdit = useCallback((product: Product) => {
    setEditingProduct(product);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        try {
          const response = await fetch(
            `http://localhost:3001/api/products/${id}`,
            {
              method: "DELETE",
            }
          );

          if (response.ok) {
            console.log("Product deleted from store.json via API");
          } else {
            console.warn("API delete failed, using direct store update");
          }
        } catch (apiError) {
          console.log("API server not available, using direct store update");
        }

        deleteProduct(id);
        toast.success("Product deleted successfully");
      } catch (error) {
        toast.error("Failed to delete product");
      }
    },
    [deleteProduct]
  );

  const handleSaveEdit = useCallback(
    async (updatedProduct: Product) => {
      try {
        try {
          const response = await fetch(
            `http://localhost:3001/api/products/${updatedProduct.id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(updatedProduct),
            }
          );

          if (response.ok) {
            console.log("Product updated in store.json via API");
          } else {
            console.warn("API update failed, using direct store update");
          }
        } catch (apiError) {
          console.log("API server not available, using direct store update");
        }

        updateProduct(updatedProduct);
        setEditingProduct(null);
        toast.success("Product updated successfully");
      } catch (error) {
        toast.error("Failed to update product");
      }
    },
    [updateProduct]
  );

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Helmet>
          <title>Admin Login</title>
          <meta
            name="description"
            content="Admin login page for the store management system"
          />
        </Helmet>
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm space-y-4"
          role="form"
          aria-label="Admin login form"
        >
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            aria-label="Password"
            required
          />
          <Button type="submit" className="w-full" aria-label="Login button">
            Login
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>لوحة التحكم</title>
        <meta
          name="description"
          content="لوحة تحكم المسؤول لإدارة منتجات المتجر والمخزون"
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Topbar />
      <Navbar />
      <main className="max-w-[90%] mx-auto py-8">
        <div className="mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold">لوحة التحكم</h1>
            <Button
              onClick={handleExport}
              className="gap-2"
              aria-label="تصدير بيانات المتجر"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              تصدير بيانات المتجر
            </Button>
          </div>

          {/* Statistics Section */}
          <div
            className="grid gap-4 md:grid-cols-6 mb-8"
            role="region"
            aria-label="إحصائيات المتجر"
          >
            <div className="bg-card rounded-lg border p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Package
                  className="h-5 w-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-medium">إجمالي المنتجات</h3>
              </div>
              <p className="text-2xl font-bold mt-2">
                {statistics.totalProducts}
              </p>
            </div>
            <div className="bg-card rounded-lg border p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Tag
                  className="h-5 w-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-medium">التصنيفات</h3>
              </div>
              <p className="text-2xl font-bold mt-2">
                {statistics.totalCategories}
              </p>
            </div>
            <div className="bg-card rounded-lg border p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Building2
                  className="h-5 w-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-medium">الموردين</h3>
              </div>
              <p className="text-2xl font-bold mt-2">
                {statistics.totalSuppliers}
              </p>
            </div>
            <div className="bg-card rounded-lg border p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Percent
                  className="h-5 w-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-medium">العروض النشطة</h3>
              </div>
              <p className="text-2xl font-bold mt-2">
                {statistics.productsWithOffers}
              </p>
            </div>
            <div className="bg-card rounded-lg border p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Timer
                  className="h-5 w-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-medium">المنتجات المؤرشفة</h3>
              </div>
              <p className="text-2xl font-bold mt-2">
                {statistics.archivedProducts}
              </p>
            </div>
          </div>

          <ProductForm onSubmit={addProduct} />

          <hr />
          <div className="mt-28 mb-8">
            <Card className="p-6 mb-6 bg-card shadow-sm">
              <Collapsible
                open={isFiltersOpen}
                onOpenChange={setIsFiltersOpen}
                className="w-full space-y-2"
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Filter className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-bold">تصفية المنتجات</h3>
                    </div>
                    <Button variant="ghost" size="sm" className="w-9 p-0">
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          isFiltersOpen ? "rotate-180" : "rotate-0"
                        }`}
                      />
                      <span className="sr-only">Toggle filters</span>
                    </Button>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4">
                  <AdminFilters
                    filters={filters}
                    onFilterChange={setFilters}
                    uniqueSuppliers={uniqueSuppliers}
                  />
                </CollapsibleContent>
              </Collapsible>
            </Card>
            <div className="flex gap-4 mb-4 w-full">
              <ProductSearch value={searchQuery} onChange={setSearchQuery} />
              <div className="flex gap-2">
                <Select
                  value={dateFilter}
                  onValueChange={(value) => {
                    setDateFilter(value);
                    if (value !== "custom") {
                      setDateRange(undefined);
                    }
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="فلتر حسب التاريخ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="today">اليوم</SelectItem>
                    <SelectItem value="week">الأسبوع</SelectItem>
                    <SelectItem value="month">الشهر</SelectItem>
                    <SelectItem value="year">السنة</SelectItem>
                    <SelectItem value="custom">تحديد نطاق تاريخ</SelectItem>
                  </SelectContent>
                </Select>
                {dateFilter === "custom" && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[300px] justify-start text-left font-normal",
                          !dateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "PPP", { locale: ar })} -{" "}
                              {format(dateRange.to, "PPP", { locale: ar })}
                            </>
                          ) : (
                            format(dateRange.from, "PPP", { locale: ar })
                          )
                        ) : (
                          <span>اختر نطاق التاريخ</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        initialFocus
                        locale={ar}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          </div>

          <ProductTable
            products={filteredProducts}
            searchQuery={searchQuery}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </main>

      <EditProductModal
        product={editingProduct}
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default Admin;

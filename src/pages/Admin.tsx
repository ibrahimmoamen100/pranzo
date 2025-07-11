import { useState, useMemo, useCallback, useEffect } from "react";
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
  Pencil,
  Trash2,
  ShoppingCart,
  BarChart3,
  LogOut,
  Users,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { orderService } from "@/services/firebase";
import { isAdminAuthenticated, setAdminAuth, clearAdminAuth } from "@/utils/auth";

// Branch form state type
interface BranchForm {
  name: string;
  address: string;
  phone: string;
  openTime: string;
  closeTime: string;
}

const BASE_URL = import.meta.env.DEV ? "http://localhost:3001" : "";

const Admin = () => {
  const { t } = useTranslation();
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
    archivedStatus: "all" as "all" | "archived" | "active",
    specialOffer: "all" as "all" | "with-offer" | "without-offer",
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const { products, addProduct, deleteProduct, updateProduct } = useStore();

  // Check authentication on component mount
  useEffect(() => {
    if (isAdminAuthenticated()) {
      setIsAuthenticated(true);
    }
  }, []);

  // Redirect to orders if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Stay on admin page, don't redirect automatically
    }
  }, [isAuthenticated]);

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
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const adminPassword = await orderService.getAdminPanelPassword();
        if (password === adminPassword) {
          setAdminAuth(); // Save to cookies for 1 day
          setIsAuthenticated(true);
        } else {
          toast.error("Invalid password");
        }
      } catch (err) {
        toast.error("حدث خطأ أثناء التحقق من كلمة السر");
      }
    },
    [password]
  );

  const handleLogout = useCallback(() => {
    clearAdminAuth();
    setIsAuthenticated(false);
    setPassword("");
    toast.success("تم تسجيل الخروج بنجاح");
  }, []);

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

  // Branch form state
  const [branchForm, setBranchForm] = useState<BranchForm>({
    name: "",
    address: "",
    phone: "",
    openTime: "",
    closeTime: "",
  });

  // Branches list state
  const [branches, setBranches] = useState<BranchForm[]>([]);
  // Store data state (for editing/deleting branches)
  const [storeData, setStoreData] = useState<any>(null);

  // Fetch branches and store data from API on mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/store");
        if (!response.ok) throw new Error("فشل في تحميل بيانات الفروع");
        const data = await response.json();
        if (Array.isArray(data.branches)) {
          setBranches(data.branches);
        }
        setStoreData(data);
      } catch (error) {
        // يمكن عرض رسالة خطأ إذا رغبت
      }
    };
    fetchBranches();
  }, []);

  // Handle branch form submit
  const handleBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !branchForm.name ||
      !branchForm.address ||
      !branchForm.phone ||
      !branchForm.openTime ||
      !branchForm.closeTime
    ) {
      toast.error("يرجى ملء جميع الحقول للفروع");
      return;
    }
    try {
      const response = await fetch("http://localhost:3001/api/branches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(branchForm),
      });
      if (!response.ok) {
        throw new Error("فشل في حفظ الفرع في قاعدة البيانات");
      }
      setBranches((prev) => [...prev, branchForm]);
      toast.success("تم إضافة الفرع وحفظه في قاعدة البيانات");
      setBranchForm({
        name: "",
        address: "",
        phone: "",
        openTime: "",
        closeTime: "",
      });
    } catch (error) {
      toast.error("حدث خطأ أثناء حفظ الفرع");
    }
  };

  const [editBranchIdx, setEditBranchIdx] = useState<number | null>(null);
  const [editBranchForm, setEditBranchForm] = useState<BranchForm | null>(null);
  const [deleteBranchIdx, setDeleteBranchIdx] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Handle edit branch
  const handleEditBranch = (idx: number) => {
    setEditBranchIdx(idx);
    setEditBranchForm(branches[idx]);
    setIsEditDialogOpen(true);
  };

  const handleEditBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBranchForm || !storeData) return;
    try {
      // تحديث الفرع في store.json
      const response = await fetch("http://localhost:3001/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...storeData,
          branches: branches.map((b, i) =>
            i === editBranchIdx ? editBranchForm : b
          ),
        }),
      });
      if (!response.ok) throw new Error();
      // تحديث الحالة محلياً
      setBranches((prev) =>
        prev.map((b, i) => (i === editBranchIdx ? editBranchForm : b))
      );
      toast.success("تم تعديل بيانات الفرع بنجاح");
      setIsEditDialogOpen(false);
    } catch {
      toast.error("حدث خطأ أثناء تعديل بيانات الفرع");
    }
  };

  // Handle delete branch
  const handleDeleteBranch = (idx: number) => {
    setDeleteBranchIdx(idx);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteBranch = async () => {
    try {
      if (!storeData) throw new Error();
      const newBranches = branches.filter((_, i) => i !== deleteBranchIdx);
      // تحديث store.json
      const response = await fetch("http://localhost:3001/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...storeData,
          branches: newBranches,
        }),
      });
      if (!response.ok) throw new Error();
      setBranches(newBranches);
      toast.success("تم حذف الفرع بنجاح");
      setIsDeleteDialogOpen(false);
    } catch {
      toast.error("حدث خطأ أثناء حذف الفرع");
    }
  };

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
            <h1 className="text-3xl font-bold">{t("admin.dashboard")}</h1>
            <div className="flex gap-2">
              <Link to="/admin/cashier">
                <Button variant="outline" className="gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  الكاشير
                </Button>
              </Link>
              <Link to="/admin/orders">
                <Button variant="outline" className="gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  {t("admin.orders")}
                </Button>
              </Link>
              <Link to="/admin/analytics">
                <Button variant="outline" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  {t("admin.analytics")}
                </Button>
              </Link>
              <Link to="/admin/visitor-analytics">
                <Button variant="outline" className="gap-2">
                  <Users className="h-4 w-4" />
                  {t("admin.visitorAnalytics")}
                </Button>
              </Link>
              <Button
                onClick={handleExport}
                className="gap-2"
                aria-label={t("admin.exportStore")}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {t("admin.exportStore")}
              </Button>
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="gap-2"
                aria-label="تسجيل الخروج"
              >
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </Button>
            </div>
          </div>

          {/* Statistics Section */}
          <div
            className="grid gap-4 md:grid-cols-6 mb-8"
            role="region"
            aria-label={t("analytics.title")}
          >
            <div className="bg-card rounded-lg border p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Package
                  className="h-5 w-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-medium">
                  {t("analytics.metrics.totalProducts")}
                </h3>
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
                <h3 className="text-sm font-medium">
                  {t("analytics.metrics.totalCategories")}
                </h3>
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
                <h3 className="text-sm font-medium">
                  {t("analytics.metrics.totalSuppliers")}
                </h3>
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
                <h3 className="text-sm font-medium">
                  {t("analytics.metrics.activeOffers")}
                </h3>
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
                <h3 className="text-sm font-medium">
                  {t("analytics.metrics.archivedProducts")}
                </h3>
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
                      <h3 className="text-xl font-bold">
                        {t("analytics.filters.title")}
                      </h3>
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
                    <SelectValue
                      placeholder={t("analytics.filters.dateFilter")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="today">اليوم</SelectItem>
                    <SelectItem value="week">الأسبوع</SelectItem>
                    <SelectItem value="month">الشهر</SelectItem>
                    <SelectItem value="year">السنة</SelectItem>
                    <SelectItem value="custom">
                      {t("analytics.filters.customRange")}
                    </SelectItem>
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
                          <span>{t("analytics.filters.selectDateRange")}</span>
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

      <Card className="p-6 mb-8 max-w-[90%] mx-auto shadow-lg border border-primary/30 bg-white rounded-2xl">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-primary">
          <Building2 className="inline-block w-6 h-6 text-primary" />
          {t("admin.branches.title")}
        </h2>
        <form onSubmit={handleBranchSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-semibold text-gray-700">
                {t("admin.branches.form.name")}
              </label>
              <Input
                value={branchForm.name}
                onChange={(e) =>
                  setBranchForm({ ...branchForm, name: e.target.value })
                }
                placeholder={t("admin.branches.form.name")}
                required
                className="rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-gray-700">
                {t("admin.branches.form.address")}
              </label>
              <Input
                value={branchForm.address}
                onChange={(e) =>
                  setBranchForm({ ...branchForm, address: e.target.value })
                }
                placeholder={t("admin.branches.form.address")}
                required
                className="rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-gray-700">
                {t("admin.branches.form.phone")}
              </label>
              <Input
                value={branchForm.phone}
                onChange={(e) =>
                  setBranchForm({ ...branchForm, phone: e.target.value })
                }
                placeholder={t("admin.branches.form.phone")}
                required
                className="rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block mb-1 font-semibold text-gray-700">
                  {t("admin.branches.form.openTime")}
                </label>
                <Input
                  type="time"
                  value={branchForm.openTime}
                  onChange={(e) =>
                    setBranchForm({ ...branchForm, openTime: e.target.value })
                  }
                  placeholder={t("admin.branches.form.openTime")}
                  required
                  step="60"
                  className="rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>
              <div className="flex-1">
                <label className="block mb-1 font-semibold text-gray-700">
                  {t("admin.branches.form.closeTime")}
                </label>
                <Input
                  type="time"
                  value={branchForm.closeTime}
                  onChange={(e) =>
                    setBranchForm({ ...branchForm, closeTime: e.target.value })
                  }
                  placeholder={t("admin.branches.form.closeTime")}
                  required
                  step="60"
                  className="rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full py-3 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90 transition"
          >
            <Building2 className="inline-block w-5 h-5 mr-2" />
            {t("admin.branches.form.addBranch")}
          </Button>
        </form>
      </Card>

      {/* Branches Table */}
      <div className="max-w-[90%] mx-auto mb-12">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
          <Building2 className="inline-block w-5 h-5 text-primary" />
          {t("admin.branches.list")}
        </h3>
        <div className="overflow-x-auto rounded-2xl shadow border border-primary/20 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-center">
            <thead className="bg-primary/10">
              <tr>
                <th className="px-4 py-3 font-bold text-primary">
                  {t("admin.branches.table.name")}
                </th>
                <th className="px-4 py-3 font-bold text-primary">
                  {t("admin.branches.table.address")}
                </th>
                <th className="px-4 py-3 font-bold text-primary">
                  {t("admin.branches.table.phone")}
                </th>
                <th className="px-4 py-3 font-bold text-primary">
                  {t("admin.branches.table.openTime")}
                </th>
                <th className="px-4 py-3 font-bold text-primary">
                  {t("admin.branches.table.closeTime")}
                </th>
                <th className="px-4 py-3 font-bold text-primary">
                  {t("admin.branches.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {branches.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-muted-foreground text-lg"
                  >
                    {t("admin.branches.noBranches")}
                  </td>
                </tr>
              ) : (
                branches.map((branch, idx) => (
                  <tr key={idx} className="hover:bg-primary/5 transition">
                    <td className="px-4 py-2 font-medium">{branch.name}</td>
                    <td className="px-4 py-2">{branch.address}</td>
                    <td className="px-4 py-2">{branch.phone}</td>
                    <td className="px-4 py-2">{branch.openTime}</td>
                    <td className="px-4 py-2">{branch.closeTime}</td>
                    <td className="px-4 py-2 flex gap-2 justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditBranch(idx)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteBranch(idx)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.branches.actions.edit")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditBranchSubmit} className="space-y-4">
            <Input
              value={editBranchForm?.name || ""}
              onChange={(e) =>
                setEditBranchForm((f) =>
                  f ? { ...f, name: e.target.value } : f
                )
              }
              placeholder={t("admin.branches.form.name")}
              required
            />
            <Input
              value={editBranchForm?.address || ""}
              onChange={(e) =>
                setEditBranchForm((f) =>
                  f ? { ...f, address: e.target.value } : f
                )
              }
              placeholder={t("admin.branches.form.address")}
              required
            />
            <Input
              value={editBranchForm?.phone || ""}
              onChange={(e) =>
                setEditBranchForm((f) =>
                  f ? { ...f, phone: e.target.value } : f
                )
              }
              placeholder={t("admin.branches.form.phone")}
              required
            />
            <div className="flex gap-4">
              <Input
                type="time"
                value={editBranchForm?.openTime || ""}
                onChange={(e) =>
                  setEditBranchForm((f) =>
                    f ? { ...f, openTime: e.target.value } : f
                  )
                }
                required
              />
              <Input
                type="time"
                value={editBranchForm?.closeTime || ""}
                onChange={(e) =>
                  setEditBranchForm((f) =>
                    f ? { ...f, closeTime: e.target.value } : f
                  )
                }
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                {t("admin.branches.actions.cancel")}
              </Button>
              <Button type="submit">{t("admin.branches.actions.save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.branches.actions.delete")}</DialogTitle>
          </DialogHeader>
          <p>{t("admin.branches.actions.confirmDelete")}</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              {t("admin.branches.actions.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDeleteBranch}>
              {t("admin.branches.actions.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;

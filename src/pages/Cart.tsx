import { useStore } from "@/store/useStore";
import { ProductModal } from "@/components/ProductModal";
import { useState, useEffect } from "react";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Trash2,
  Eye,
  Plus,
  Minus,
  AlertCircle,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Navbar } from "@/components/Navbar";
import { Topbar } from "@/components/Topbar";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { DEFAULT_SUPPLIER } from "@/constants/supplier";
import { formatPrice } from "@/utils/format";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { orderService } from "@/services/firebase";
import { OrderFormData } from "@/types/order";
import storeData from "@/data/store.json";

interface DeliveryFormData {
  fullName: string;
  phoneNumber: string;
  address: string;
  city: string;
  notes?: string;
}

interface SupplierGroup {
  supplierName: string;
  supplierPhone: string;
  items: { product: Product; quantity: number }[];
  total: number;
}

const Cart = () => {
  const products = useStore((state) => state.products);
  const cart = useStore((state) => state.cart);
  const removeFromCart = useStore((state) => state.removeFromCart);
  const addToCart = useStore((state) => state.addToCart);
  const clearCart = useStore((state) => state.clearCart);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { t } = useTranslation();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [showClearCartAlert, setShowClearCartAlert] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryFormData>({
    fullName: "",
    phoneNumber: "",
    address: "",
    city: "",
    notes: "",
  });
  const [branches, setBranches] = useState<{ name: string; phone: string }[]>(
    storeData.branches || []
  );
  const [selectedBranch, setSelectedBranch] = useState<{
    name: string;
    phone: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DeliveryFormData>({
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      address: "",
      city: "",
      notes: "",
    },
  });

  // Watch form fields for validation
  const fullName = watch("fullName");
  const phoneNumber = watch("phoneNumber");
  const address = watch("address");
  const city = watch("city");

  // Check if all required fields are filled
  const isFormValid = fullName && phoneNumber && address && city;

  // Update delivery info when form fields change
  useEffect(() => {
    setDeliveryInfo({
      fullName: fullName || "",
      phoneNumber: phoneNumber || "",
      address: address || "",
      city: city || "",
      notes: watch("notes") || "",
    });
  }, [fullName, phoneNumber, address, city, watch]);

  // اربط cart مع المنتجات
  const cartWithProducts = cart
    .map((item) => ({
      ...item,
      product: products.find((p) => p.id === item.productId),
    }))
    .filter((item) => item.product); // تجاهل العناصر التي لم يعد لها منتج

  // Group cart items by supplier
  const supplierGroups: SupplierGroup[] = cartWithProducts.reduce(
    (groups: SupplierGroup[], item) => {
      const supplierName =
        item.product?.wholesaleInfo?.supplierName || DEFAULT_SUPPLIER.name;
      const supplierPhone = (
        item.product?.wholesaleInfo?.supplierPhone || DEFAULT_SUPPLIER.phone
      ).replace(/^0/, "20");

      const existingGroup = groups.find(
        (group) => group.supplierName === supplierName
      );
      const price =
        item.product?.specialOffer && item.product?.discountPercentage
          ? item.product.price -
            (item.product.price * item.product.discountPercentage) / 100
          : item.product.price;

      if (existingGroup) {
        existingGroup.items.push(item);
        existingGroup.total += price * item.quantity;
      } else {
        groups.push({
          supplierName,
          supplierPhone,
          items: [item],
          total: price * item.quantity,
        });
      }

      return groups;
    },
    []
  );

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId);
    setShowDeleteAlert(true);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      removeFromCart(productToDelete);
      setShowDeleteAlert(false);
      setProductToDelete(null);
    }
  };

  const handleClearCart = () => {
    clearCart();
    toast.success(t("cart.cartCleared"));
  };

  const onSubmit = async (data: DeliveryFormData) => {
    if (!selectedBranch) {
      toast.error("يرجى اختيار الفرع أولاً");
      return;
    }

    if (cartWithProducts.length === 0) {
      toast.error("السلة فارغة");
      return;
    }

    setIsSubmitting(true);

    // دالة لتنظيف البيانات من القيم undefined
    const cleanData = (obj: any) => {
      const cleaned: any = {};
      Object.keys(obj).forEach(key => {
        if (obj[key] !== undefined && obj[key] !== null) {
          cleaned[key] = obj[key];
        }
      });
      return cleaned;
    };

    // تجهيز بيانات الطلب
    const orderItems = cartWithProducts.map((item) => cleanData({
      productId: item.productId,
      productName: item.product!.name,
      quantity: item.quantity,
      price: item.product!.price,
      selectedSize: item.selectedSize,
      selectedExtra: item.selectedExtra,
    }));

    const totalAmount = cartWithProducts.reduce((total, item) => {
      let sizePrice = 0;
      let extraPrice = 0;
      if (item.selectedSize && item.product?.sizesWithPrices) {
        const foundSize = item.product.sizesWithPrices.find(
          (s) => s.size === item.selectedSize
        );
        if (foundSize) sizePrice = Number(foundSize.price || 0);
      }
      if (item.selectedExtra && item.product?.extras) {
        const foundExtra = item.product.extras.find(
          (e) => e.name === item.selectedExtra
        );
        if (foundExtra) extraPrice = Number(foundExtra.price || 0);
      }
      const basePrice =
        item.product?.specialOffer && item.product?.discountPercentage
          ? item.product.price -
            (item.product.price * item.product.discountPercentage) / 100
          : item.product.price;
      return total + (basePrice + sizePrice + extraPrice) * item.quantity;
    }, 0);

    const orderData = cleanData({
      customerName: data.fullName,
      customerPhone: data.phoneNumber,
      customerAddress: `${data.address}, ${data.city}`,
      selectedBranch: selectedBranch.name,
      items: orderItems,
      totalAmount: totalAmount,
      status: "pending" as const,
      notes: data.notes,
      // لا ترسل تواريخ هنا، سيتم توليدها في السيرفر
    });

    // --- الحفظ المتفائل ---
    clearCart();
    toast.success("تم إرسال طلبك بنجاح! سنتواصل معك قريباً");
    navigate("/");

    // أرسل الطلب إلى Firebase في الخلفية
    try {
      await orderService.createOrder(orderData);
    } catch (error: any) {
      toast.error("حدث خطأ أثناء حفظ الطلب في النظام. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigate = useNavigate();

  const updateCartItemOptions = (
    productId: string,
    selectedSize?: string,
    selectedExtra?: string
  ) => {
    // إزالة العنصر القديم بنفس المنتج والحجم/الإضافة القديمة
    const item = cartWithProducts.find((i) => i.product.id === productId);
    if (!item) return;
    removeFromCart(productId);
    // أضف العنصر الجديد بنفس الكمية ولكن بالحجم/الإضافة الجديدة
    addToCart(item.product, item.quantity, selectedSize, selectedExtra);
  };

  return (
    <div className="min-h-screen">
      <Topbar />
      <Navbar />
      <main className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{t("cart.title")}</h1>
          {cart.length > 0 && (
            <AlertDialog
              open={showClearCartAlert}
              onOpenChange={setShowClearCartAlert}
            >
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t("cart.clearCart")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("cart.clearCart")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("cart.clearCartConfirm")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearCart}>
                    {t("cart.confirmClear")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {cart.length > 0 && (
          <div className="bg-blue-50 border-r-4 border-blue-400 p-4 mb-8 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-blue-800 font-semibold mb-1">تنبيه هام</h3>
                <p className="text-blue-700">
                  يرجى ملء معلومات التوصيل أولاً قبل الضغط على زر إتمام الطلب.
                  هذه المعلومات ضرورية لتوصيل طلبك بشكل صحيح.
                </p>
              </div>
            </div>
          </div>
        )}

        {cart.length === 0 ? (
          <p className="text-center text-muted-foreground">{t("cart.empty")}</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-3 space-y-8">
              {supplierGroups.map((group, index) => (
                <div
                  key={group.supplierName}
                  className="bg-white rounded-lg border shadow-sm overflow-hidden"
                >
                  {/* Products List */}
                  <div className="divide-y">
                    {cartWithProducts.map((item, idx) => {
                      // حساب السعر حسب الحجم والإضافة المختارة
                      let sizePrice = 0;
                      let extraPrice = 0;
                      if (item.selectedSize && item.product?.sizesWithPrices) {
                        const foundSize = item.product.sizesWithPrices.find(
                          (s) => s.size === item.selectedSize
                        );
                        if (foundSize) sizePrice = Number(foundSize.price || 0);
                      }
                      if (item.selectedExtra && item.product?.extras) {
                        const foundExtra = item.product.extras.find(
                          (e) => e.name === item.selectedExtra
                        );
                        if (foundExtra)
                          extraPrice = Number(foundExtra.price || 0);
                      }
                      const basePrice =
                        item.product?.specialOffer &&
                        item.product?.discountPercentage
                          ? item.product.price -
                            (item.product.price *
                              item.product.discountPercentage) /
                              100
                          : item.product.price;
                      const totalPrice =
                        (basePrice + sizePrice + extraPrice) * item.quantity;
                      return (
                        <div
                          key={item.product.id + "-" + idx}
                          className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                        >
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="h-20 w-20 rounded-md object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium">{item.product.name}</h3>
                            {/* تفاصيل الحجم والإضافة */}
                            <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                              {item.product.sizesWithPrices &&
                                item.product.sizesWithPrices.length > 0 && (
                                  <Select
                                    value={item.selectedSize || undefined}
                                    onValueChange={(value) =>
                                      updateCartItemOptions(
                                        item.product.id,
                                        value,
                                        item.selectedExtra
                                      )
                                    }
                                  >
                                    <SelectTrigger className="w-auto min-w-[100px]">
                                      <SelectValue placeholder="اختر الحجم" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {item.product.sizesWithPrices.map(
                                        (sizeObj, i) => (
                                          <SelectItem
                                            key={sizeObj.size + i}
                                            value={sizeObj.size}
                                          >
                                            {sizeObj.size}{" "}
                                            {sizeObj.price &&
                                            Number(sizeObj.price) > 0
                                              ? `(+${sizeObj.price} ج.م)`
                                              : ""}
                                          </SelectItem>
                                        )
                                      )}
                                    </SelectContent>
                                  </Select>
                                )}
                              {item.product.extras &&
                                item.product.extras.length > 0 && (
                                  <Select
                                    value={item.selectedExtra || undefined}
                                    onValueChange={(value) =>
                                      updateCartItemOptions(
                                        item.product.id,
                                        item.selectedSize,
                                        value || undefined
                                      )
                                    }
                                  >
                                    <SelectTrigger className="w-auto min-w-[100px]">
                                      <SelectValue placeholder="اختر الإضافة" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value={undefined}>
                                        بدون إضافة
                                      </SelectItem>
                                      {item.product.extras.map(
                                        (extraObj, i) => (
                                          <SelectItem
                                            key={extraObj.name + i}
                                            value={extraObj.name}
                                          >
                                            {extraObj.name}{" "}
                                            {extraObj.price &&
                                            Number(extraObj.price) > 0
                                              ? `(+${extraObj.price} ج.م)`
                                              : ""}
                                          </SelectItem>
                                        )
                                      )}
                                    </SelectContent>
                                  </Select>
                                )}
                            </div>
                            <div className="flex md:flex-row flex-col md:items-center items-start gap-4 mt-2">
                              <div className="flex items-center gap-0">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    addToCart(
                                      item.product,
                                      -1,
                                      item.selectedSize,
                                      item.selectedExtra
                                    )
                                  }
                                  className="rounded-full"
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="px-3 font-bold text-lg">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    addToCart(
                                      item.product,
                                      1,
                                      item.selectedSize,
                                      item.selectedExtra
                                    )
                                  }
                                  className="rounded-full"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                              <span className="text-green-700 font-bold">
                                {formatPrice(
                                  basePrice + sizePrice + extraPrice
                                )}{" "}
                                جنيه
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                navigate(`/products/${item.product.id}`)
                              }
                              className="rounded-full mb-2"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteClick(item.product.id)}
                              className="rounded-full"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Total Orders Section */}
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-t flex flex-col items-center gap-2 rounded-b-lg mt-2">
                    <span className="text-xl font-bold text-primary flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-7 h-7 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 9V7a5 5 0 00-10 0v2a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2z"
                        />
                      </svg>
                      مجموع طلباتك
                    </span>
                    <span className="text-2xl font-extrabold text-green-700 tracking-wider">
                      {cartWithProducts
                        .reduce((total, item) => {
                          let sizePrice = 0;
                          let extraPrice = 0;
                          if (
                            item.selectedSize &&
                            item.product?.sizesWithPrices
                          ) {
                            const foundSize = item.product.sizesWithPrices.find(
                              (s) => s.size === item.selectedSize
                            );
                            if (foundSize)
                              sizePrice = Number(foundSize.price || 0);
                          }
                          if (item.selectedExtra && item.product?.extras) {
                            const foundExtra = item.product.extras.find(
                              (e) => e.name === item.selectedExtra
                            );
                            if (foundExtra)
                              extraPrice = Number(foundExtra.price || 0);
                          }
                          const basePrice =
                            item.product?.specialOffer &&
                            item.product?.discountPercentage
                              ? item.product.price -
                                (item.product.price *
                                  item.product.discountPercentage) /
                                  100
                              : item.product.price;
                          return (
                            total +
                            (basePrice + sizePrice + extraPrice) * item.quantity
                          );
                        }, 0)
                        .toLocaleString()}{" "}
                      جنيه
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="md:col-span-2">
              <div className="rounded-lg border bg-card p-6 sticky top-20">
                <div className="mb-6 p-4 bg-[#36fc7f]/10 rounded-lg border border-[#25D366]/20">
                  <div className="flex items-center gap-3 text-[#146130]">
                    <FaWhatsapp className="h-7 w-7" />
                    <div className="space-y-1">
                      <p className="text-sm">
                        عند النقر على زر "إتمام الطلب"، سيتم فتح واتساب لإرسال
                        تفاصيل طلبك إلى خدمة التوصيل
                      </p>
                      <p className="text-sm font-medium">
                        سنقوم بالتواصل معك قريباً
                      </p>
                    </div>
                  </div>
                </div>
                <h2 className="text-xl font-semibold mb-4">
                  {t("cart.deliveryInfo")}
                </h2>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-4 bg-white rounded-lg border p-6 mb-8"
                >
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-medium mb-1"
                    >
                      {t("cart.fullName")}*
                    </label>
                    <Input
                      id="fullName"
                      {...register("fullName", { required: true })}
                      className={errors.fullName ? "border-destructive" : ""}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive mt-1">
                        {t("cart.fieldRequired")}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="phoneNumber"
                      className="block text-sm font-medium mb-1"
                    >
                      {t("cart.phoneNumber")}*
                    </label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      {...register("phoneNumber", { required: true })}
                      className={errors.phoneNumber ? "border-destructive" : ""}
                    />
                    {errors.phoneNumber && (
                      <p className="text-sm text-destructive mt-1">
                        {t("cart.fieldRequired")}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="address"
                      className="block text-sm font-medium mb-1"
                    >
                      {t("cart.address")}*
                    </label>
                    <Textarea
                      id="address"
                      {...register("address", { required: true })}
                      className={errors.address ? "border-destructive" : ""}
                    />
                    {errors.address && (
                      <p className="text-sm text-destructive mt-1">
                        {t("cart.fieldRequired")}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="city"
                      className="block text-sm font-medium mb-1"
                    >
                      {t("cart.city")}*
                    </label>
                    <Input
                      id="city"
                      {...register("city", { required: true })}
                      className={errors.city ? "border-destructive" : ""}
                    />
                    {errors.city && (
                      <p className="text-sm text-destructive mt-1">
                        {t("cart.fieldRequired")}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="notes"
                      className="block text-sm font-medium mb-1"
                    >
                      {t("cart.notes")}
                    </label>
                    <Textarea id="notes" {...register("notes")} />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-gray-700">
                      اختر الفرع الذي سيتم إرسال الطلب إليه *
                    </label>
                    <Select
                      value={selectedBranch?.name || ""}
                      onValueChange={(value) => {
                        const branch = branches.find((b) => b.name === value);
                        setSelectedBranch(branch || null);
                      }}
                      required
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختر فرع التوصيل" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch, idx) => (
                          <SelectItem
                            key={branch.name + "-" + idx}
                            value={branch.name}
                          >
                            {branch.name} - {branch.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-4 border-t"></div>

                  <Button
                    type="submit"
                    className="w-full flex gap-2 items-center"
                    disabled={!isFormValid || !selectedBranch || isSubmitting}
                  >
                    <FaWhatsapp className="w-4 h-4" />
                    {isSubmitting
                      ? "جاري الإرسال..."
                      : "إرسال الطلب للفرع المختار"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}
        <ProductModal
          product={selectedProduct}
          open={modalOpen}
          onOpenChange={setModalOpen}
          hideAddToCart={true}
        />
      </main>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cart.confirmRemove")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("cart.confirmRemoveDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Cart;

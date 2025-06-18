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

  // Group cart items by supplier
  const supplierGroups: SupplierGroup[] = cart.reduce(
    (groups: SupplierGroup[], item) => {
      const supplierName =
        item.product.wholesaleInfo?.supplierName || DEFAULT_SUPPLIER.name;
      const supplierPhone = (
        item.product.wholesaleInfo?.supplierPhone || DEFAULT_SUPPLIER.phone
      ).replace(/^0/, "20");

      const existingGroup = groups.find(
        (group) => group.supplierName === supplierName
      );
      const price =
        item.product.specialOffer && item.product.discountPercentage
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

  const onSubmit = (data: DeliveryFormData) => {
    // Send message to each supplier
    supplierGroups.forEach((group) => {
      if (group.supplierPhone) {
        const orderDetails = group.items
          .map((item) => {
            const price =
              item.product.specialOffer && item.product.discountPercentage
                ? item.product.price -
                  (item.product.price * item.product.discountPercentage) / 100
                : item.product.price;
            return (
              `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
              `📌 *${item.product.name}*\n` +
              `🆔 رقم المنتج: ${item.product.id}\n` +
              `🔢 الكمية: ${item.quantity}\n` +
              `💰 السعر: ${price.toLocaleString()} EGP\n` +
              `💵 المجموع: ${(price * item.quantity).toLocaleString()} EGP`
            );
          })
          .join("\n");

        const message =
          `🛍️ *طلب جديد*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `👤 *معلومات العميل:*\n` +
          `${data.fullName ? `الاسم: ${data.fullName}\n` : ""}` +
          `${data.phoneNumber ? `رقم الهاتف: ${data.phoneNumber}\n` : ""}` +
          `${data.address ? `العنوان: ${data.address}\n` : ""}` +
          `${data.city ? `المدينة: ${data.city}\n` : ""}` +
          `${data.notes ? `\n📝 *ملاحظات:*\n${data.notes}\n` : ""}` +
          `\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `📦 *تفاصيل الطلب:*\n` +
          `${orderDetails}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `💰 *المجموع:* ${group.total.toLocaleString()} EGP\n\n` +
          `⏰ *تاريخ الطلب:* ${new Date().toLocaleString("ar-EG")}\n` +
          `🏪 *اسم المتجر:* ${group.supplierName}`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${group.supplierPhone}?text=${encodedMessage}`;
        window.open(whatsappUrl, "_blank");
      }
    });
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
              {/* Total Sum Section */}
              <div className="bg-white rounded-lg border p-4 mb-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">المجموع الكلي</h3>
                  <span className="text-xl font-bold text-green-700">
                    {supplierGroups
                      .reduce((total, group) => total + group.total, 0)
                      .toLocaleString()}{" "}
                    EGP
                  </span>
                </div>
              </div>

              {supplierGroups.map((group, index) => (
                <div
                  key={group.supplierName}
                  className="bg-white rounded-lg border shadow-sm overflow-hidden"
                >
                  {/* Supplier Header */}
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {group.supplierName === DEFAULT_SUPPLIER.name ? (
                          <div className="bg-primary/0 p-2 rounded-full">
                            <img
                              src="/logo1.png"
                              alt={group.supplierName}
                              className="h-12 w-12 object-contain"
                            />
                          </div>
                        ) : null}
                        <div>
                          <h2 className="text-lg font-bold text-primary">
                            {group.supplierName}
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            يمكنك التواصل مع البائع عبر الواتساب
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={!isFormValid}
                        onClick={() => {
                          const orderDetails = group.items
                            .map((item) => {
                              const price =
                                item.product.specialOffer &&
                                item.product.discountPercentage
                                  ? item.product.price -
                                    (item.product.price *
                                      item.product.discountPercentage) /
                                      100
                                  : item.product.price;
                              return (
                                `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                                `📌 *${item.product.name}*\n` +
                                `🆔 رقم المنتج: ${item.product.id}\n` +
                                `🔢 الكمية: ${item.quantity}\n` +
                                `💰 السعر: ${price.toLocaleString()} EGP\n` +
                                `💵 المجموع: ${(
                                  price * item.quantity
                                ).toLocaleString()} EGP`
                              );
                            })
                            .join("\n");

                          const message =
                            `🛍️ *طلب جديد*\n` +
                            `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                            `👤 *معلومات العميل:*\n` +
                            `${
                              deliveryInfo.fullName
                                ? `الاسم: ${deliveryInfo.fullName}\n`
                                : ""
                            }` +
                            `${
                              deliveryInfo.phoneNumber
                                ? `رقم الهاتف: ${deliveryInfo.phoneNumber}\n`
                                : ""
                            }` +
                            `${
                              deliveryInfo.address
                                ? `العنوان: ${deliveryInfo.address}\n`
                                : ""
                            }` +
                            `${
                              deliveryInfo.city
                                ? `المدينة: ${deliveryInfo.city}\n`
                                : ""
                            }` +
                            `${
                              deliveryInfo.notes
                                ? `\n📝 *ملاحظات:*\n${deliveryInfo.notes}\n`
                                : ""
                            }` +
                            `\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                            `📦 *تفاصيل الطلب:*\n` +
                            `${orderDetails}\n\n` +
                            `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                            `💰 *المجموع:* ${group.total.toLocaleString()} EGP\n\n` +
                            `⏰ *تاريخ الطلب:* ${new Date().toLocaleString(
                              "ar-EG"
                            )}\n` +
                            `🏪 *اسم المتجر:* ${group.supplierName}`;
                          const encodedMessage = encodeURIComponent(message);
                          const whatsappUrl = `https://wa.me/${group.supplierPhone}?text=${encodedMessage}`;
                          window.open(whatsappUrl, "_blank");
                        }}
                      >
                        <FaWhatsapp className="w-4 h-4" />
                        {t("cart.completeOrder")}
                      </Button>
                    </div>
                  </div>

                  {/* Products List */}
                  <div className="divide-y">
                    {group.items.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                      >
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="h-20 w-20 rounded-md object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium">{item.product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {item.product.brand}
                          </p>
                          <div className="flex md:flex-row flex-col md:items-center items-start gap-4 mt-2">
                            <div className="flex items-center gap-0">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  const newQuantity = Math.max(
                                    0,
                                    item.quantity - 1
                                  );
                                  if (newQuantity === 0) {
                                    handleDeleteClick(item.product.id);
                                  } else {
                                    addToCart(item.product, -1);
                                  }
                                }}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => addToCart(item.product, 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {item.product.specialOffer &&
                                item.product.discountPercentage
                                  ? formatPrice(
                                      (item.product.price -
                                        (item.product.price *
                                          item.product.discountPercentage) /
                                          100) *
                                        item.quantity
                                    )
                                  : formatPrice(
                                      item.product.price * item.quantity
                                    )}{" "}
                                EGP
                              </span>
                              {item.product.specialOffer &&
                                item.product.discountPercentage && (
                                  <span className="text-xs text-red-600">
                                    -{item.product.discountPercentage}%{" "}
                                    {t("products.off")}
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setSelectedProduct(item.product);
                              setModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteClick(item.product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Supplier Total */}
                  <div className="bg-gray-50 p-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        مجموع الطلب من هذا البائع
                      </span>
                      <span className="text-lg font-semibold text-primary">
                        {group.total.toLocaleString()} EGP
                      </span>
                    </div>
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
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

                  <div className="pt-4 border-t"></div>
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

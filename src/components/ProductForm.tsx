import { useState, useEffect, useMemo } from "react";
import { Product, ProductSchema } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusCircle,
  X,
  Calendar as CalendarIcon,
  Timer,
  Package,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { Calendar as CalendarIconAr } from "lucide-react";
import { ar } from "date-fns/locale";
import { formatPrice } from "@/utils/format";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "@/styles/quill-custom.css";
import { useTranslation } from "react-i18next";

interface ProductFormProps {
  onSubmit: (product: Product) => void;
}

// Common size options

// Fixed category options
const fixedCategories = [
  "السندوتشات",
  "سندوتشات شاورما",
  "سندوتشات الكيزر و الفرنساوي",
  "الكريب",
  "الفته",
  "فراخ مشويه",
  "فراخ بروستد",
  "المشروبات",
  "الوجبات",
  "المشروبات",
  "الاضافات",
];

export function ProductForm({ onSubmit }: ProductFormProps) {
  const { products } = useStore();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    id: crypto.randomUUID(),
    name: "",
    price: "",
    category: "",
    subcategory: "",
    images: [] as string[],
    description: "",
    specialOffer: false,
    discountPercentage: "",
    offerEndsAt: "",
    isArchived: false,
    expirationDate: undefined as string | undefined,
    wholesaleInfo: {
      supplierName: "",
      supplierPhone: "",
      supplierEmail: "",
      supplierLocation: "",
      purchasePrice: 0,
      minimumOrderQuantity: 1,
      notes: "",
    },
    sizesWithPrices: [] as { size: string; price: string }[],
    extras: [] as { name: string; price: string }[],
  });
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [offerEndDate, setOfferEndDate] = useState<Date | undefined>(undefined);
  const [customSubcategory, setCustomSubcategory] = useState("");
  const [showCustomSubcategory, setShowCustomSubcategory] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [discountPrice, setDiscountPrice] = useState("");
  const [showWholesaleInfo, setShowWholesaleInfo] = useState(false);
  const [newSize, setNewSize] = useState("");
  const [newSizePrice, setNewSizePrice] = useState("");
  const [newExtraName, setNewExtraName] = useState("");
  const [newExtraPrice, setNewExtraPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get unique subcategories from existing products
  const getUniqueSubcategories = (category: string) => {
    const subcategories = products
      .filter((product) => product.category === category)
      .map((product) => product.subcategory)
      .filter(Boolean) as string[];
    return [...new Set(subcategories)].sort();
  };

  const uniqueSubcategories = formData.category
    ? getUniqueSubcategories(formData.category)
    : [];

  const addColor = (colorValue: string) => {
    if (!colors.includes(colorValue)) {
      setColors([...colors, colorValue]);
    }
  };

  const removeColor = (colorToRemove: string) => {
    setColors(colors.filter((color) => color !== colorToRemove));
  };

  const addSize = (size: string) => {
    if (!sizes.includes(size)) {
      setSizes([...sizes, size]);
    }
  };

  const removeSize = (sizeToRemove: string) => {
    setSizes(sizes.filter((size) => size !== sizeToRemove));
  };

  const addImageUrl = () => {
    if (imageUrl && !formData.images.includes(imageUrl)) {
      setFormData({ ...formData, images: [...formData.images, imageUrl] });
      setImageUrl("");
    }
  };

  const removeImage = (urlToRemove: string) => {
    setFormData({
      ...formData,
      images: formData.images.filter((url) => url !== urlToRemove),
    });
  };

  // Calculate discount percentage based on price and discount price
  const calculateDiscountPercentage = (
    price: number,
    discountPrice: number
  ) => {
    if (!price || !discountPrice) return "";
    const percentage = ((price - discountPrice) / price) * 100;
    return percentage.toFixed(0);
  };

  // Update form data when discount price changes
  const handleDiscountPriceChange = (value: string) => {
    setDiscountPrice(value);
    const price = Number(formData.price);
    const discountPriceNum = Number(value);
    if (price && discountPriceNum) {
      const percentage = calculateDiscountPercentage(price, discountPriceNum);
      setFormData({
        ...formData,
        discountPercentage: percentage,
      });
    }
  };

  // Add new size with price
  const handleAddSizeWithPrice = () => {
    if (newSize && newSizePrice) {
      setFormData({
        ...formData,
        sizesWithPrices: [
          ...formData.sizesWithPrices,
          { size: newSize, price: newSizePrice },
        ],
      });
      setNewSize("");
      setNewSizePrice("");
    }
  };

  // Remove size with price
  const handleRemoveSizeWithPrice = (index: number) => {
    setFormData({
      ...formData,
      sizesWithPrices: formData.sizesWithPrices.filter((_, i) => i !== index),
    });
  };

  // Add new extra
  const handleAddExtra = () => {
    if (newExtraName && newExtraPrice) {
      setFormData({
        ...formData,
        extras: [
          ...formData.extras,
          { name: newExtraName, price: newExtraPrice },
        ],
      });
      setNewExtraName("");
      setNewExtraPrice("");
    }
  };

  // Remove extra
  const handleRemoveExtra = (index: number) => {
    setFormData({
      ...formData,
      extras: formData.extras.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const product = {
        id: formData.id,
        name: formData.name,
        price: Number(formData.price),
        category: formData.category,
        subcategory: formData.subcategory,
        images: formData.images,
        description: formData.description,
        color: colors.length > 0 ? colors.join(", ") : undefined,
        size: sizes.length > 0 ? sizes.join(", ") : undefined,
        specialOffer: formData.specialOffer,
        discountPercentage: formData.discountPercentage
          ? Number(formData.discountPercentage)
          : undefined,
        offerEndsAt: formData.offerEndsAt || undefined,
        sizesWithPrices:
          formData.sizesWithPrices.length > 0
            ? formData.sizesWithPrices
            : undefined,
        isArchived: formData.isArchived,
        createdAt: new Date().toISOString(),
        expirationDate: formData.expirationDate,
        wholesaleInfo: showWholesaleInfo ? formData.wholesaleInfo : undefined,
        extras: formData.extras,
      };

      // Save via API
      const response = await fetch(`${apiUrl}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(product),
      });

      if (!response.ok) {
        throw new Error("Failed to save product via API");
      }

      // Update the store
      onSubmit(product);

      // Reset form
      setFormData({
        id: crypto.randomUUID(),
        name: "",
        price: "",
        category: "",
        subcategory: "",
        images: [],
        description: "",
        specialOffer: false,
        discountPercentage: "",
        offerEndsAt: "",
        isArchived: false,
        expirationDate: undefined,
        wholesaleInfo: {
          supplierName: "",
          supplierPhone: "",
          supplierEmail: "",
          supplierLocation: "",
          purchasePrice: 0,
          minimumOrderQuantity: 1,
          notes: "",
        },
        sizesWithPrices: [],
        extras: [],
      });
      setColors([]);
      setSizes([]);
      setImageUrl("");
      setOfferEndDate(undefined);
      setCustomSubcategory("");
      setShowCustomSubcategory(false);
      setShowCustomCategory(false);
      setDiscountPrice("");
      setShowWholesaleInfo(false);
      setNewSize("");
      setNewSizePrice("");
      setNewExtraName("");
      setNewExtraPrice("");
      toast.success("تمت إضافة المنتج بنجاح");
    } catch (error) {
      console.error("خطأ في إضافة المنتج:", error);
      toast.error("فشل في إضافة المنتج");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 border p-6 rounded-lg bg-card shadow-sm"
    >
      <div className="flex items-center gap-2 mb-6">
        <Package className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold">إضافة منتج جديد</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">الاسم *</label>
          <Input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm font-medium">السعر *</label>
          <Input
            required
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value })
            }
          />
          {formData.price && (
            <p className="text-sm text-muted-foreground mt-1">
              {formatPrice(Number(formData.price))} جنيه
            </p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">التصنيف *</label>
          <div className="space-y-2">
            <Select
              value={showCustomCategory ? "custom" : formData.category}
              onValueChange={(value) => {
                if (value === "custom") {
                  setShowCustomCategory(true);
                  setFormData({ ...formData, category: "", subcategory: "" });
                } else {
                  setShowCustomCategory(false);
                  setFormData({
                    ...formData,
                    category: value,
                    subcategory: "",
                  });
                }
              }}
            >
              <SelectTrigger className="shrink-0">
                <SelectValue placeholder="اختر تصنيفًا" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                {[...new Set(fixedCategories)].map((category, idx) => (
                  <SelectItem key={category + "-" + idx} value={category}>
                    {category}
                  </SelectItem>
                ))}
                <SelectItem
                  value="custom"
                  className="text-blue-600 font-medium"
                >
                  + إضافة تصنيف جديد
                </SelectItem>
              </SelectContent>
            </Select>
            {showCustomCategory && (
              <Input
                type="text"
                placeholder="أدخل تصنيف جديد"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="mt-2"
              />
            )}
          </div>
        </div>

        {formData.category && (
          <div>
            <label className="text-sm font-medium">التصنيف الفرعي *</label>
            {!showCustomSubcategory ? (
              <div className="space-y-2">
                <Select
                  value={formData.subcategory}
                  onValueChange={(value) => {
                    if (value === "add-new") {
                      setShowCustomSubcategory(true);
                      setFormData({ ...formData, subcategory: "" });
                    } else {
                      setFormData({ ...formData, subcategory: value });
                    }
                  }}
                >
                  <SelectTrigger className="shrink-0">
                    <SelectValue placeholder="اختر تصنيفًا فرعيًا" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    {uniqueSubcategories.map((subcategory, idx) => (
                      <SelectItem
                        key={subcategory + "-" + idx}
                        value={subcategory}
                      >
                        {subcategory}
                      </SelectItem>
                    ))}
                    <SelectItem
                      value="add-new"
                      className="text-blue-600 font-medium"
                    >
                      + إضافة تصنيف فرعي جديد
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  required
                  value={customSubcategory}
                  onChange={(e) => setCustomSubcategory(e.target.value)}
                  placeholder="أدخل اسم تصنيف فرعي جديد"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCustomSubcategory(false);
                    setCustomSubcategory("");
                  }}
                >
                  العودة إلى الاختيار
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Special Offer Section */}
      <div className="rounded-md border p-4 space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="special-offer"
            checked={formData.specialOffer}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, specialOffer: checked })
            }
          />
          <Label htmlFor="special-offer" className="font-medium">
            عرض خاص
          </Label>
        </div>

        {formData.specialOffer && (
          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <div>
              <label className="text-sm font-medium">سعر الخصم *</label>
              <div className="flex items-center">
                <Input
                  type="number"
                  min="1"
                  value={discountPrice}
                  onChange={(e) => handleDiscountPriceChange(e.target.value)}
                  className="flex-1"
                  placeholder="أدخل سعر الخصم"
                />
                <span className="ms-2 text-lg">ج.م</span>
              </div>
              {formData.price && discountPrice && (
                <p className="text-sm text-muted-foreground mt-1">
                  الخصم: {formData.discountPercentage}%
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">
                تاريخ انتهاء العرض *
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !offerEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {offerEndDate ? (
                      format(offerEndDate, "PPP", { locale: ar })
                    ) : (
                      <span>اختر تاريخًا</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={offerEndDate}
                    onSelect={setOfferEndDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                    className={cn("p-3 pointer-events-auto")}
                    locale={ar}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </div>

      {/* Color section */}
      {/* <div>
        <label className="text-sm font-medium">الألوان *</label>
        <div className="space-y-2">
          <Select onValueChange={addColor}>
            <SelectTrigger className="w-full shrink-0">
              <SelectValue placeholder="اختر لونًا" />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4}>
              {commonColors.map((color) => (
                <SelectItem key={color.value} value={color.value}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: color.value }}
                    ></div>
                    {color.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2 mt-2">
            {colors.map((color, idx) => (
              <div key={color + '-' + idx} className="relative inline-flex items-center">
                <div
                  className="h-9 w-9 rounded-full border"
                  style={{ backgroundColor: color }}
                />
                <div className="ml-2">{color}</div>
                <button
                  type="button"
                  onClick={() => removeColor(color)}
                  className="absolute -right-1 -top-1 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div> */}

      {/* sizes section */}
      <div className="mb-4">
        <label className="text-sm font-medium block mb-2">
          الأحجام والأسعار
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="الحجم (مثال: صغير)"
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            className="w-1/2"
          />
          <Input
            placeholder="السعر لهذا الحجم"
            type="number"
            min="0"
            value={newSizePrice}
            onChange={(e) => setNewSizePrice(e.target.value)}
            className="w-1/2"
          />
          <Button type="button" onClick={handleAddSizeWithPrice}>
            إضافة
          </Button>
        </div>
        {formData.sizesWithPrices.length > 0 && (
          <div className="space-y-2">
            {formData.sizesWithPrices.map((item, idx) => (
              <div
                key={item.size + "-" + idx}
                className="flex gap-2 items-center"
              >
                <span className="px-2 py-1 bg-gray-100 rounded">
                  {item.size}
                </span>
                <span className="px-2 py-1 bg-gray-100 rounded">
                  {item.price} جنيه
                </span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveSizeWithPrice(idx)}
                >
                  حذف
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Extras section */}
      <div className="mb-4">
        <label className="text-sm font-medium block mb-2">الإضافات</label>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="اسم الإضافة (مثال: جبنة)"
            value={newExtraName}
            onChange={(e) => setNewExtraName(e.target.value)}
            className="w-1/2"
          />
          <Input
            placeholder="سعر الإضافة"
            type="number"
            min="0"
            value={newExtraPrice}
            onChange={(e) => setNewExtraPrice(e.target.value)}
            className="w-1/2"
          />
          <Button type="button" onClick={handleAddExtra}>
            إضافة
          </Button>
        </div>
        {formData.extras.length > 0 && (
          <div className="space-y-2">
            {formData.extras.map((item, idx) => (
              <div
                key={item.name + "-" + idx}
                className="flex gap-2 items-center"
              >
                <span className="px-2 py-1 bg-gray-100 rounded">
                  {item.name}
                </span>
                <span className="px-2 py-1 bg-gray-100 rounded">
                  {item.price} جنيه
                </span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveExtra(idx)}
                >
                  حذف
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">الصور</label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="أدخل رابط الصورة"
              className="flex-1"
            />
            <Button
              type="button"
              onClick={addImageUrl}
              variant="outline"
              className="flex gap-1 items-center"
            >
              <PlusCircle className="h-4 w-4" />
              إضافة
            </Button>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {formData.images.map((url, index) => (
              <div key={url + "-" + index} className="relative">
                <img
                  src={url}
                  alt={`Product ${index + 1}`}
                  className="aspect-square rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute -right-1 -top-1 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="space-y-2">
          <label className="text-sm font-medium">الوصف *</label>
          <div
            className="prose prose-sm max-w-none dark:prose-invert
            prose-headings:font-semibold
            prose-p:leading-relaxed
            prose-ul:list-disc prose-ul:pl-4
            prose-ol:list-decimal prose-ol:pl-4
            prose-li:my-1
            prose-strong:text-foreground
            prose-em:text-foreground/80
            prose-ul:marker:text-foreground
            prose-ol:marker:text-foreground"
          >
            <ReactQuill
              theme="snow"
              value={formData.description}
              onChange={(value) =>
                setFormData({ ...formData, description: value })
              }
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ["bold", "italic", "underline", "strike"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["clean"],
                ],
              }}
              className="min-h-[200px] resize-y rtl-quill"
              style={{
                height: "auto",
                minHeight: "200px",
                maxHeight: "1000px",
              }}
              formats={[
                "header",
                "bold",
                "italic",
                "underline",
                "strike",
                "list",
                "bullet",
              ]}
            />
          </div>
        </div>
      </div>

      {/* Archive Status */}
      <div className="rounded-md border p-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="archive-status"
            checked={formData.isArchived}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isArchived: checked })
            }
          />
          <Label htmlFor="archive-status" className="font-medium">
            أرشفة المنتج
          </Label>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          المنتجات المؤرشفة لن تكون مرئية للعملاء
        </p>
      </div>

      {/* Wholesale Information */}
      <div className="rounded-md border p-4 space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="wholesale-info"
            checked={showWholesaleInfo}
            onCheckedChange={(checked) => {
              setShowWholesaleInfo(checked);
              if (!checked) {
                setFormData({
                  ...formData,
                  wholesaleInfo: undefined,
                });
              } else if (!formData.wholesaleInfo) {
                setFormData({
                  ...formData,
                  wholesaleInfo: {
                    supplierName: "",
                    supplierPhone: "",
                    supplierEmail: "",
                    supplierLocation: "",
                    purchasePrice: 0,
                    minimumOrderQuantity: 1,
                    notes: "",
                  },
                });
              }
            }}
          />
          <Label htmlFor="wholesale-info" className="font-medium">
            معلومات البائع
          </Label>
        </div>

        {showWholesaleInfo && formData.wholesaleInfo && (
          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <div>
              <label className="text-sm font-medium">اسم البائع *</label>
              <Input
                value={formData.wholesaleInfo.supplierName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    wholesaleInfo: {
                      ...formData.wholesaleInfo!,
                      supplierName: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">رقم هاتف البائع *</label>
              <Input
                value={formData.wholesaleInfo.supplierPhone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    wholesaleInfo: {
                      ...formData.wholesaleInfo!,
                      supplierPhone: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">موقع البائع *</label>
              <Input
                value={formData.wholesaleInfo.supplierLocation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    wholesaleInfo: {
                      ...formData.wholesaleInfo!,
                      supplierLocation: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                بريد البائع الإلكتروني *
              </label>
              <Input
                type="text"
                value={formData.wholesaleInfo.supplierEmail}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    wholesaleInfo: {
                      ...formData.wholesaleInfo!,
                      supplierEmail: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">سعر الشراء *</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.wholesaleInfo.purchasePrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    wholesaleInfo: {
                      ...formData.wholesaleInfo!,
                      purchasePrice: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                الحد الأدنى لكمية الطلب *
              </label>
              <Input
                type="number"
                min="1"
                value={formData.wholesaleInfo.minimumOrderQuantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    wholesaleInfo: {
                      ...formData.wholesaleInfo!,
                      minimumOrderQuantity: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">ملاحظات</label>
              <Textarea
                value={formData.wholesaleInfo.notes || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    wholesaleInfo: {
                      ...formData.wholesaleInfo!,
                      notes: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* Expiration Date Section */}
      <div className="rounded-md border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">تاريخ انتهاء الصلاحية</h3>
          <Switch
            id="expiration-date"
            checked={!!formData.expirationDate}
            onCheckedChange={(checked) => {
              if (checked) {
                // Set default expiration date to 30 days from now if not set
                const defaultDate = new Date();
                defaultDate.setDate(defaultDate.getDate() + 30);
                setFormData({
                  ...formData,
                  expirationDate: defaultDate.toISOString(),
                });
              } else {
                setFormData({ ...formData, expirationDate: undefined });
              }
            }}
          />
        </div>
        {formData.expirationDate && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.expirationDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.expirationDate ? (
                  format(new Date(formData.expirationDate), "PPP", {
                    locale: ar,
                  })
                ) : (
                  <span>اختر تاريخ انتهاء الصلاحية</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={
                  formData.expirationDate
                    ? new Date(formData.expirationDate)
                    : undefined
                }
                onSelect={(date) => {
                  if (date) {
                    setFormData({
                      ...formData,
                      expirationDate: date.toISOString(),
                    });
                  }
                }}
                initialFocus
                locale={ar}
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          عند انتهاء الصلاحية، سيتم أرشفة المنتج تلقائياً ولن يظهر للعملاء
        </p>
      </div>

      <Button type="submit" className="w-full">
        إضافة المنتج
      </Button>
    </form>
  );
}

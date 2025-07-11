import { useState, useEffect } from "react";
import { Product } from "@/types/product";
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
import { PlusCircle, X, Calendar as CalendarIcon } from "lucide-react";
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
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ar } from "date-fns/locale";
import { formatPrice } from "@/utils/format";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "@/styles/quill-custom.css";

// Common color options
const commonColors = [
  { name: "Black", value: "#000000" },
  { name: "White", value: "#FFFFFF" },
  { name: "Red", value: "#FF0000" },
  { name: "Green", value: "#008000" },
  { name: "Blue", value: "#0000FF" },
  { name: "Yellow", value: "#FFFF00" },
  { name: "Purple", value: "#800080" },
  { name: "Orange", value: "#FFA500" },
  { name: "Pink", value: "#FFC0CB" },
  { name: "Gray", value: "#808080" },
];

// Common size options
const commonSizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "One Size"];

interface EditProductModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (product: Product) => void;
}

export function EditProductModal({
  product,
  open,
  onOpenChange,
  onSave,
}: EditProductModalProps) {
  const { products } = useStore();
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Product | null>(null);
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [offerEndDate, setOfferEndDate] = useState<Date | undefined>(undefined);
  const [customBrand, setCustomBrand] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [customSubcategory, setCustomSubcategory] = useState("");
  const [showCustomBrand, setShowCustomBrand] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [showCustomSubcategory, setShowCustomSubcategory] = useState(false);
  const [discountPrice, setDiscountPrice] = useState("");
  const [showWholesaleInfo, setShowWholesaleInfo] = useState(false);
  const [sizesWithPrices, setSizesWithPrices] = useState<
    { size: string; price: string }[]
  >([]);
  const [newSize, setNewSize] = useState("");
  const [newSizePrice, setNewSizePrice] = useState("");
  const [extras, setExtras] = useState<{ name: string; price: string }[]>([]);
  const [newExtraName, setNewExtraName] = useState("");
  const [newExtraPrice, setNewExtraPrice] = useState("");

  // Get unique brands and categories from existing products
  const getUniqueBrands = () => {
    const brands = products.map((product) => product.brand).filter(Boolean);
    return [...new Set(brands)].sort();
  };

  const getUniqueCategories = () => {
    const categories = products
      .map((product) => product.category)
      .filter(Boolean);
    return [...new Set(categories)].sort();
  };

  const getUniqueSubcategories = (category: string) => {
    const subcategories = products
      .filter((product) => product.category === category)
      .map((product) => product.subcategory)
      .filter(Boolean);
    return [...new Set(subcategories)].sort();
  };

  const uniqueBrands = getUniqueBrands();
  const uniqueCategories = getUniqueCategories();
  const uniqueSubcategories = formData?.category
    ? getUniqueSubcategories(formData.category)
    : [];

  useEffect(() => {
    if (product) {
      // Reset all form state
      setFormData({
        ...product,
        wholesaleInfo: product.wholesaleInfo
          ? {
              ...product.wholesaleInfo,
              supplierLocation: product.wholesaleInfo.supplierLocation || "",
            }
          : undefined,
      });
      setColors(product.color ? product.color.split(",") : []);
      setSizes(product.size ? product.size.split(",") : []);
      setOfferEndDate(
        product.offerEndsAt ? new Date(product.offerEndsAt) : undefined
      );
      setCustomBrand("");
      setCustomCategory("");
      setCustomSubcategory("");
      setShowCustomBrand(false);
      setShowCustomCategory(false);
      setShowCustomSubcategory(false);
      setShowWholesaleInfo(!!product.wholesaleInfo);
      setSizesWithPrices(
        (product.sizesWithPrices || []).map((item) => ({
          size: item.size || "",
          price: item.price || "",
        }))
      );
      setExtras(
        (product.extras || []).map((item) => ({
          name: item.name || "",
          price: item.price || "",
        }))
      );
      setNewSize("");
      setNewSizePrice("");
      setNewExtraName("");
      setNewExtraPrice("");

      if (product.specialOffer && product.discountPercentage) {
        const originalPrice = product.price;
        const discountPercentage = product.discountPercentage;
        const calculatedDiscountPrice =
          originalPrice - (originalPrice * discountPercentage) / 100;
        setDiscountPrice(calculatedDiscountPrice.toString());
      } else {
        setDiscountPrice("");
      }
    } else {
      // Reset all form state when modal is closed
      setFormData(null);
      setColors([]);
      setSizes([]);
      setOfferEndDate(undefined);
      setCustomBrand("");
      setCustomCategory("");
      setCustomSubcategory("");
      setShowCustomBrand(false);
      setShowCustomCategory(false);
      setShowCustomSubcategory(false);
      setShowWholesaleInfo(false);
      setDiscountPrice("");
      setSizesWithPrices([]);
      setExtras([]);
      setNewSize("");
      setNewSizePrice("");
      setNewExtraName("");
      setNewExtraPrice("");
    }
  }, [product]);

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
    if (imageUrl && formData && !formData.images.includes(imageUrl)) {
      setFormData({ ...formData, images: [...formData.images, imageUrl] });
      setImageUrl("");
    }
  };

  const removeImage = (urlToRemove: string) => {
    if (formData) {
      setFormData({
        ...formData,
        images: formData.images.filter((url) => url !== urlToRemove),
      });
    }
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
    if (formData) {
      const price = Number(formData.price);
      const discountPriceNum = Number(value);
      if (price && discountPriceNum) {
        const percentage = calculateDiscountPercentage(price, discountPriceNum);
        setFormData({
          ...formData,
          discountPercentage: Number(percentage),
        });
      }
    }
  };

  // Add new size with price
  const handleAddSizeWithPrice = () => {
    if (newSize && newSizePrice) {
      setSizesWithPrices([
        ...sizesWithPrices,
        { size: newSize, price: newSizePrice },
      ]);
      setNewSize("");
      setNewSizePrice("");
    }
  };

  // Remove size with price
  const handleRemoveSizeWithPrice = (index: number) => {
    setSizesWithPrices(sizesWithPrices.filter((_, i) => i !== index));
  };

  // Edit size or price
  const handleEditSizeWithPrice = (
    index: number,
    field: "size" | "price",
    value: string
  ) => {
    setSizesWithPrices(
      sizesWithPrices.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  // Add new extra
  const handleAddExtra = () => {
    if (newExtraName && newExtraPrice) {
      setExtras([...extras, { name: newExtraName, price: newExtraPrice }]);
      setNewExtraName("");
      setNewExtraPrice("");
    }
  };

  // Remove extra
  const handleRemoveExtra = (index: number) => {
    setExtras(extras.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    // Use custom values if they exist, otherwise use selected values
    const finalBrand = showCustomBrand ? customBrand : formData.brand;
    const finalCategory = showCustomCategory
      ? customCategory
      : formData.category;
    const finalSubcategory = showCustomSubcategory
      ? customSubcategory
      : formData.subcategory;

    if (!formData.name || !finalCategory || !finalSubcategory) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (sizesWithPrices.length === 0) {
      toast.error("Please add at least one size with price");
      return;
    }

    // Validate special offer fields if special offer is enabled
    if (formData.specialOffer) {
      if (!formData.discountPercentage) {
        toast.error("Please enter a discount percentage for the special offer");
        return;
      }
      if (!offerEndDate) {
        toast.error("Please select an end date for the special offer");
        return;
      }
    }

    try {
      const updatedProduct = {
        ...formData,
        brand: finalBrand,
        category: finalCategory,
        subcategory: finalSubcategory,
        color: colors.length > 0 ? colors.join(",") : "",
        size: sizes.length > 0 ? sizes.join(",") : "",
        sizesWithPrices,
        extras,
        discountPercentage: formData.specialOffer
          ? Number(formData.discountPercentage)
          : undefined,
        offerEndsAt:
          formData.specialOffer && offerEndDate
            ? offerEndDate.toISOString()
            : undefined,
        createdAt: product?.createdAt || new Date().toISOString(),
      };

      onSave(updatedProduct);
      onOpenChange(false);
      toast.success("Product updated successfully");
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    }
  };

  if (!formData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[70vw] max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Make changes to the product details here. Click save when you're
            done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">الاسم *</label>
              <Input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
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
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
              />
              {formData.price && (
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(Number(formData.price))} جنيه
                  </p>
                  {formData.specialOffer && formData.discountPercentage && (
                    <p className="text-sm text-red-600">
                      بعد الخصم:{" "}
                      {formatPrice(
                        Number(formData.price) -
                          (Number(formData.price) *
                            formData.discountPercentage) /
                            100
                      )}{" "}
                      جنيه
                    </p>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">التصنيف *</label>
              {!showCustomCategory ? (
                <div className="space-y-2">
                  <Select
                    value={formData.category}
                    onValueChange={(value) => {
                      if (value === "add-new") {
                        setShowCustomCategory(true);
                        setFormData({ ...formData, category: "" });
                      } else {
                        setFormData({ ...formData, category: value });
                      }
                    }}
                  >
                    <SelectTrigger className="shrink-0">
                      <SelectValue placeholder="اختر تصنيفًا" />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      {uniqueCategories.map((category, idx) => (
                        <SelectItem key={category + "-" + idx} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                      <SelectItem value="add-new" className="text-blue-600 font-medium">
                        + إضافة تصنيف جديد
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="أدخل اسم تصنيف جديد"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCustomCategory(false);
                      setCustomCategory("");
                    }}
                  >
                    العودة إلى الاختيار
                  </Button>
                </div>
              )}
            </div>
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
                        <SelectItem key={subcategory + "-" + idx} value={subcategory}>
                          {subcategory}
                        </SelectItem>
                      ))}
                      <SelectItem value="add-new" className="text-blue-600 font-medium">
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
          </div>

          {/* Sizes with Prices Section */}
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
            {sizesWithPrices.length > 0 && (
              <div className="space-y-2">
                {sizesWithPrices.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      value={item.size}
                      onChange={(e) =>
                        handleEditSizeWithPrice(idx, "size", e.target.value)
                      }
                      className="w-1/3"
                    />
                    <Input
                      value={item.price}
                      type="number"
                      min="0"
                      onChange={(e) =>
                        handleEditSizeWithPrice(idx, "price", e.target.value)
                      }
                      className="w-1/3"
                    />
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

          {/* Extras Section */}
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
            {extras.length > 0 && (
              <div className="space-y-2">
                {extras.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
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
                  placeholder="Enter image URL"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={addImageUrl}
                  variant="outline"
                  className="flex gap-1 items-center"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add
                </Button>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {formData.images.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Product ${index + 1}`}
                      className="aspect-square rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
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
              <Label htmlFor="description">الوصف</Label>
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
                Special Offer
              </Label>
            </div>

            {formData.specialOffer && (
              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div>
                  <label className="text-sm font-medium">
                    Discount Price *
                  </label>
                  <div className="flex items-center">
                    <Input
                      type="number"
                      min="1"
                      value={discountPrice}
                      onChange={(e) =>
                        handleDiscountPriceChange(e.target.value)
                      }
                      className="flex-1"
                      placeholder="Enter discount price"
                    />
                    <span className="ms-2 text-lg">EGP</span>
                  </div>
                  {formData.price && discountPrice && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Discount: {formData.discountPercentage}%
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Offer End Date *
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
                          format(offerEndDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
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
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
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
                Archive Product
              </Label>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Archived products will not be visible to customers
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
                Wholesale Information
              </Label>
            </div>

            {showWholesaleInfo && formData.wholesaleInfo && (
              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div>
                  <label className="text-sm font-medium">Supplier Name *</label>
                  <Input
                    required
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
                  <label className="text-sm font-medium">
                    Supplier Phone *
                  </label>
                  <Input
                    required
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
                  <label className="text-sm font-medium">Supplier User *</label>
                  <Input
                    required
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
                  <label className="text-sm font-medium">
                    Supplier Location *
                  </label>
                  <Input
                    required
                    type="text"
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
                    Purchase Price *
                  </label>
                  <Input
                    required
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
                    Minimum Order Quantity *
                  </label>
                  <Input
                    required
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
                  <label className="text-sm font-medium">Notes</label>
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
            <p className="text-sm text-muted-foreground">
              عند انتهاء الصلاحية، سيتم أرشفة المنتج تلقائياً ولن يظهر للعملاء
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

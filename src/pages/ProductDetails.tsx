import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { Product } from "@/types/product";
import { Navbar } from "@/components/Navbar";
import { Topbar } from "@/components/Topbar";
import { ProductCard } from "@/components/ProductCard";
import { ProductModal } from "@/components/ProductModal";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Share2,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { formatPrice } from "@/utils/format";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const products = useStore((state) => state.products);
  const cart = useStore((state) => state.cart);
  const addToCart = useStore((state) => state.addToCart);
  const removeFromCart = useStore((state) => state.removeFromCart);
  const updateCartItemQuantity = useStore(
    (state) => state.updateCartItemQuantity
  );

  // Find current product
  const product = products.find((p) => p.id === id);

  // Check if product is in cart
  const cartItem = cart.find((item) => item.product.id === id);

  // Find suggested products (same category, excluding current product)
  const suggestedProducts = products
    .filter(
      (p) =>
        p.category === product?.category &&
        p.id !== product?.id &&
        !p.isArchived
    )
    .slice(0, 4);

  useEffect(() => {
    if (!product) {
      navigate("/products");
    }
  }, [product, navigate]);

  if (!product) {
    return null;
  }

  const handleAddToCart = () => {
    addToCart(product);
    toast.success(`${t("cart.productAdded")}: ${product.name}`, {
      duration: 5000,
      dismissible: true,
    });
  };

  const handleUpdateQuantity = (newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(product.id);
      toast.success(`${t("cart.productRemoved")}: ${product.name}`, {
        duration: 5000,
        dismissible: true,
      });
    } else {
      updateCartItemQuantity(product.id, newQuantity);
    }
  };

  const handleShare = () => {
    const productUrl = `${window.location.origin}/products/${product.id}`;

    // Create a detailed message with emojis
    const message = [
      `🛍️ *${product.name}*`,
      `🏷️ ${t("products.brand")}: ${product.brand}`,
      `💰 ${t("products.price")}: ${product.price} EGP`,
      product.specialOffer &&
      new Date(product.offerEndsAt as string) > new Date()
        ? `🎉 ${t("products.specialPrice")}: ${Math.round(
            product.price -
              (product.price * (product.discountPercentage || 0)) / 100
          )} EGP`
        : null,
      product.description
        ? `📝 ${t("products.description")}: ${product.description}`
        : null,
      product.category
        ? `📦 ${t("products.category")}: ${product.category}`
        : null,
      product.size ? `📏 ${t("products.size")}: ${product.size}` : null,
      product.color
        ? `🎨 ${t("products.color")}: ${product.color
            .split(",")
            .map((color) => getColorName(color.trim()))
            .join(", ")}`
        : null,
      `\n🔗 ${t("common.viewProduct")}: ${productUrl}`,
    ]
      .filter(Boolean) // Remove null values
      .join("\n");

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
  };

  const getColorName = (hexCode: string) => {
    const colorMap: { [key: string]: string } = {
      "#000000": "Black",
      "#FFFFFF": "White",
      "#FF0000": "Red",
      "#008000": "Green",
      "#0000FF": "Blue",
      "#FFFF00": "Yellow",
      "#800080": "Purple",
      "#FFA500": "Orange",
      "#FFC0CB": "Pink",
      "#808080": "Gray",
      "#A52A2A": "Brown",
      "#F5F5DC": "Beige",
      "#000080": "Navy",
      "#800000": "Maroon",
      "#008080": "Teal",
      "#FFD700": "Gold",
      "#C0C0C0": "Silver",
    };
    return colorMap[hexCode] || hexCode;
  };

  const displayColors = (colors: string) => {
    if (!colors) return null;
    return colors.split(",").map((color, index) => {
      const trimmedColor = color.trim();
      return (
        <div key={index} className="flex items-center gap-2 mb-2">
          <div
            className="w-6 h-6 rounded-full border"
            style={{ backgroundColor: trimmedColor }}
          />
          <span className="text-muted-foreground">
            {t(`colors.${getColorName(trimmedColor)}`)}
          </span>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <Navbar />
      <main className="container py-8 px-4 md:px-8 flex-1">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Breadcrumb>
            <BreadcrumbList className="flex items-center text-sm">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    to="/"
                    className="flex items-center text-muted-foreground hover:text-primary transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1"
                    >
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    {t("navigation.home")}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <span className="mx-2 text-muted-foreground">&lt;</span>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    to="/products"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t("navigation.products")}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>

              <span className="mx-2 text-muted-foreground">&lt;</span>
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium text-primary">
                  {product.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </motion.div>

        {/* Product Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-[1/1] w-full rounded-lg overflow-hidden relative group">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="h-full w-full object-contain rounded-lg cursor-pointer "
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                />
              </AnimatePresence>
              {/* Navigation arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSelectedImage((prev) =>
                        prev > 0 ? prev - 1 : product.images.length - 1
                      )
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() =>
                      setSelectedImage((prev) =>
                        prev < product.images.length - 1 ? prev + 1 : 0
                      )
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                      selectedImage === index
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`space-y-6 ${
              product.specialOffer &&
              new Date(product.offerEndsAt as string) > new Date()
                ? "relative before:absolute before:inset-0 before:bg-white before:rounded-lg before:-z-10 before:scale-105"
                : ""
            }`}
          >
            <div className="flex flex-col gap-6">
              <div className="space-y-2">
                <h2 className="text-sm font-medium text-muted-foreground">
                  {t("products.name")}
                </h2>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {product.name}
                  </h1>
                  {product.specialOffer && (
                    <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
                      {t("products.specialOffer")}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-sm font-medium text-muted-foreground">
                  {t("products.price")}
                </h2>
                <div className="space-y-2">
                  {product.specialOffer &&
                  new Date(product.offerEndsAt as string) > new Date() ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-red-600">
                          {formatPrice(
                            product.price -
                              (product.price *
                                (product.discountPercentage || 0)) /
                                100
                          )}
                        </span>
                        <span className="text-lg line-through text-muted-foreground">
                          {formatPrice(product.price)}
                        </span>
                        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
                          {product.discountPercentage}% {t("products.off")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="animate-pulse"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <p>
                          {t("products.specialOffersEndsIn")}{" "}
                          {new Date(
                            product.offerEndsAt as string
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </>
                  ) : (
                    <span className="text-2xl font-bold">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/10 p-0 rounded-lg">
                  <h3 className="text-sm font-medium mb-2">
                    {t("products.category")}
                  </h3>
                  <p className="text-muted-foreground">
                    {product.category}
                    {product.subcategory && (
                      <span className="ml-1">/ {product.subcategory}</span>
                    )}
                  </p>
                </div>

                {product.merchant && (
                  <div className="bg-secondary/10 p-4 rounded-lg">
                    <h3 className="text-sm font-medium mb-2">
                      {t("products.merchant")}
                    </h3>
                    <p className="text-muted-foreground">{product.merchant}</p>
                  </div>
                )}
                {product.wholesaleInfo?.supplierName && (
                  <div className="bg-secondary/10 p-4 rounded-lg">
                    <h3 className="text-sm font-medium mb-2">
                      {t("products.supplier")}
                    </h3>
                    <p className="text-muted-foreground">
                      {product.wholesaleInfo.supplierName}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h2 className="text-sm font-medium text-muted-foreground">
                  {t("products.description")}
                </h2>
                <div
                  className="text-sm text-muted-foreground prose prose-sm max-w-none dark:prose-invert
                  prose-headings:font-semibold
                  prose-p:leading-relaxed
                  prose-ul:list-disc prose-ul:pl-4
                  prose-ol:list-decimal prose-ol:pl-4
                  prose-li:my-1
                  prose-strong:text-foreground
                  prose-em:text-foreground/80
                  prose-ul:marker:text-foreground
                  prose-ol:marker:text-foreground"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            </div>

            {/* <div className="bg-secondary/10 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2">
                  {t("products.size")}
                </h3>
                <p className="text-muted-foreground">{product.size}</p>
              </div> */}
            {/* <div className="bg-secondary/10 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2">
                  {t("products.color")}
                </h3>
                <div className="text-muted-foreground">
                  {displayColors(product.color)}
                </div>
              </div> */}

            <div className="flex flex-col gap-4">
              {cartItem ? (
                <>
                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <span className="text-sm font-medium text-muted-foreground">
                      {t("cart.quantity")}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          handleUpdateQuantity(cartItem.quantity - 1)
                        }
                        className="h-8 w-8"
                        title={t("cart.decrease")}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {cartItem.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          handleUpdateQuantity(cartItem.quantity + 1)
                        }
                        className="h-8 w-8"
                        title={t("cart.increase")}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col  sm:flex-row gap-4">
                    <Button
                      size="lg"
                      className="sm:flex-1 flex-1   text-base p-2"
                      onClick={() => navigate("/cart")}
                    >
                      <ShoppingCart className="mr-2 h-6 w-6 sm:h-5 sm:w-5" />
                      {t("cart.goToCart")}
                    </Button>
                    <Button
                      size="lg"
                      className="sm:flex-1 flex-1 text-base bg-green-600 p-2 hover:bg-green-700 text-white"
                      onClick={handleShare}
                    >
                      <Share2 className="mr-2 h-6 w-6 sm:h-5 sm:w-5" />
                      {t("common.shareOnWhatsApp")}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className={`flex-1 h-14 text-lg ${
                      product.specialOffer &&
                      new Date(product.offerEndsAt as string) > new Date()
                        ? "bg-black hover:bg-gray-700"
                        : ""
                    }`}
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="mr-2 h-6 w-6" />
                    {t("cart.addToCart")}
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 h-14 text-lg bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleShare}
                  >
                    <Share2 className="mr-2 h-6 w-6" />
                    {t("common.shareOnWhatsApp")}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="relative my-20">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center">
            <div className="bg-white dark:bg-gray-900 px-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <span className="text-lg font-semibold text-primary">
                  {t("products.suggestedProducts")}
                </span>
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-8">
          <h2 className="text-2xl font-bold mb-6">
            {t("products.suggestedProducts")}
          </h2>
          {suggestedProducts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {suggestedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onView={() => {
                    setSelectedProduct(product);
                    setModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <ProductModal
        product={selectedProduct}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

export default ProductDetails;
